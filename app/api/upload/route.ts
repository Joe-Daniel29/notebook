import { NextResponse } from "next/server"
import { extractText, getDocumentProxy } from "unpdf"
import { chunkText } from "@/lib/chunker"
import { embedBatch } from "@/lib/gemini"
import { addChunks, createNotebook, type StoredChunk } from "@/lib/store"

// Run on Node runtime so unpdf (which uses pdf.js) has access to Buffer/streams.
export const runtime = "nodejs"
export const maxDuration = 300

const MAX_BYTES = 20 * 1024 * 1024 // 20 MB

/**
 * Document Upload and Processing Route
 * Handles PDF/Text extraction, chunking, and embedding generation.
 */
export async function POST(req: Request) {
  try {
    const form = await req.formData()
    const file = form.get("file")
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 })
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "File too large (max 20 MB)" }, { status: 413 })
    }

    // 1) Extract raw text -----------------------------------------------------
    let rawText = ""
    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")

    if (isPdf) {
      const bytes = new Uint8Array(await file.arrayBuffer())
      const pdf = await getDocumentProxy(bytes)
      const { text } = await extractText(pdf, { mergePages: true })
      rawText = Array.isArray(text) ? text.join("\n\n") : text
    } else {
      // Treat everything else as plain text (txt, md, etc.)
      rawText = await file.text()
    }

    rawText = rawText.trim()
    if (rawText.length < 20) {
      return NextResponse.json(
        { error: "Could not extract any readable text from this file." },
        { status: 422 },
      )
    }

    // 2) Chunk ----------------------------------------------------------------
    const chunks = chunkText(rawText, { chunkSize: 900, overlap: 150 })
    if (chunks.length === 0) {
      return NextResponse.json({ error: "Document produced no chunks" }, { status: 422 })
    }

    // 3) Embed ----------------------------------------------------------------
    const embeddings = await embedBatch(
      chunks.map((c) => c.text),
      "passage",
    )

    // 4) Store ----------------------------------------------------------------
    const notebook = createNotebook(file.name)
    const stored: StoredChunk[] = chunks.map((c, i) => ({
      ...c,
      embedding: embeddings[i],
    }))

    // Experiment: Production-grade Qdrant Integration
    if (process.env.USE_QDRANT === "true") {
      try {
        const { initQdrantCollection, uploadToQdrant } = await import("@/lib/qdrant-experiment")
        await initQdrantCollection()
        await uploadToQdrant(notebook.id, chunks, embeddings)
        console.log("✅ Document successfully indexed in Qdrant Cloud.")
      } catch (qErr) {
        console.error("❌ Qdrant indexing failed, falling back to in-memory:", qErr)
      }
    }

    addChunks(notebook.id, stored)

    return NextResponse.json({
      id: notebook.id,
      name: notebook.name,
      chunkCount: stored.length,
      totalChars: rawText.length,
      createdAt: notebook.createdAt,
      chunks: stored,
    })
  } catch (err) {
    console.error("[v0] upload error:", err)
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
