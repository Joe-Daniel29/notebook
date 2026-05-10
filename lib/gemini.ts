/**
 * Google Gemini API Integration
 * Developed by Joe Daniel
 * 
 * Provides core utilities for document embedding and streaming chat completions.
 * This implementation uses native fetch to maintain a lightweight footprint without
 * external dependencies.
 */

const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta"

// We use the gemini-embedding-001 model for high-fidelity retrieval.
const EMBED_MODEL = "models/gemini-embedding-001"

// Gemini 1.5 Flash is fast and excellent for document-based reasoning.
const CHAT_MODEL = "models/gemini-1.5-flash"

function getApiKey(): string {
  const key = process.env.GEMINI_API_KEY
  if (!key) {
    throw new Error("GEMINI_API_KEY environment variable is not set")
  }
  return key
}

export type InputType = "passage" | "query"

/**
 * Embed a single piece of text.
 */
export async function embed(text: string, inputType: InputType): Promise<number[]> {
  const taskType = inputType === "passage" ? "RETRIEVAL_DOCUMENT" : "RETRIEVAL_QUERY"
  
  const res = await fetch(`${GEMINI_BASE_URL}/${EMBED_MODEL}:embedContent?key=${getApiKey()}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: EMBED_MODEL,
      content: {
        parts: [{ text }],
      },
      taskType: taskType,
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Embedding failed (${res.status}): ${body}`)
  }

  const json = await res.json()
  return json.embedding.values
}

/**
 * Embed multiple texts using batchEmbedContents.
 */
export async function embedBatch(texts: string[], inputType: InputType): Promise<number[][]> {
  const BATCH = 32
  const out: number[][] = []
  const taskType = inputType === "passage" ? "RETRIEVAL_DOCUMENT" : "RETRIEVAL_QUERY"

  for (let i = 0; i < texts.length; i += BATCH) {
    const slice = texts.slice(i, i + BATCH)
    
    const requests = slice.map(text => ({
      model: EMBED_MODEL,
      content: { parts: [{ text }] },
      taskType: taskType,
    }))

    const res = await fetch(`${GEMINI_BASE_URL}/${EMBED_MODEL}:batchEmbedContents?key=${getApiKey()}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ requests }),
    })

    if (!res.ok) {
      const body = await res.text()
      throw new Error(`Batch embedding failed (${res.status}): ${body}`)
    }

    const json = await res.json()
    for (const embedding of json.embeddings) {
      out.push(embedding.values)
    }
  }
  return out
}

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string }

/**
 * Stream a chat completion using Gemini API.
 */
export async function* streamChat(messages: ChatMessage[]): AsyncGenerator<string> {
  // Convert generic ChatMessage format to Gemini format
  let systemInstruction: any = undefined;
  const geminiContents = [];
  
  for (const msg of messages) {
    if (msg.role === "system") {
      systemInstruction = {
        parts: [{ text: msg.content }]
      };
    } else {
      geminiContents.push({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }]
      });
    }
  }

  // Use alt=sse to get standard server-sent events
  const res = await fetch(`${GEMINI_BASE_URL}/${CHAT_MODEL}:streamGenerateContent?alt=sse&key=${getApiKey()}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: geminiContents,
      systemInstruction: systemInstruction,
      generationConfig: {
        temperature: 0.2,
        topP: 0.9,
      }
    }),
  })

  if (!res.ok || !res.body) {
    const body = await res.text().catch(() => "")
    throw new Error(`Chat completion failed (${res.status}): ${body}`)
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder("utf-8")
  let buffer = ""

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    const lines = buffer.split("\n")
    buffer = lines.pop() ?? ""

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed.startsWith("data:")) continue
      const data = trimmed.slice(5).trim()
      if (data === "[DONE]") return
      try {
        const json = JSON.parse(data)
        const delta = json.candidates?.[0]?.content?.parts?.[0]?.text
        if (delta) yield delta
      } catch {
        // Ignore parse errors on partial streams
      }
    }
  }
}
