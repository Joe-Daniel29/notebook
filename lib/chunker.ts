/**
 * Recursive character text splitter.
 *
 * Strategy (in priority order):
 *   1. Split by double newline (paragraphs)
 *   2. Then single newline (lines)
 *   3. Then sentence boundaries (". ", "? ", "! ")
 *   4. Then whitespace
 *
 * Adjacent pieces are then greedily merged back together until we hit the
 * target chunk size, with a small overlap between chunks so that semantic
 * context is preserved across boundaries.
 *
 * This is the same strategy used by LangChain's RecursiveCharacterTextSplitter
 * and works well for arbitrary prose / PDFs.
 */

export type Chunk = {
  id: string
  text: string
  // 1-based index, useful for display ("[chunk 4]")
  index: number
}

const DEFAULT_CHUNK_SIZE = 900
const DEFAULT_CHUNK_OVERLAP = 150
const SEPARATORS = ["\n\n", "\n", ". ", "? ", "! ", " ", ""]

function splitBySeparator(text: string, sep: string): string[] {
  if (sep === "") return text.split("")
  // Keep the separator attached to the *previous* segment so we don't lose
  // punctuation when re-joining.
  const parts: string[] = []
  let start = 0
  while (start < text.length) {
    const idx = text.indexOf(sep, start)
    if (idx === -1) {
      parts.push(text.slice(start))
      break
    }
    parts.push(text.slice(start, idx + sep.length))
    start = idx + sep.length
  }
  return parts.filter((p) => p.length > 0)
}

function recursiveSplit(text: string, separators: string[], chunkSize: number): string[] {
  if (text.length <= chunkSize) return [text]
  const [sep, ...rest] = separators
  const pieces = splitBySeparator(text, sep)

  // If splitting on this separator didn't actually break the text up
  // (e.g. a 5000-char string with no newlines), drop down to the next sep.
  const finalPieces: string[] = []
  for (const piece of pieces) {
    if (piece.length <= chunkSize) {
      finalPieces.push(piece)
    } else if (rest.length > 0) {
      finalPieces.push(...recursiveSplit(piece, rest, chunkSize))
    } else {
      // Hard split as a last resort.
      for (let i = 0; i < piece.length; i += chunkSize) {
        finalPieces.push(piece.slice(i, i + chunkSize))
      }
    }
  }
  return finalPieces
}

/**
 * Greedily merge small pieces back into chunks of roughly `chunkSize`,
 * keeping `overlap` characters of overlap between adjacent chunks.
 */
function mergePieces(pieces: string[], chunkSize: number, overlap: number): string[] {
  const chunks: string[] = []
  let current = ""
  for (const piece of pieces) {
    if (current.length + piece.length <= chunkSize) {
      current += piece
    } else {
      if (current.length > 0) chunks.push(current)
      // Start the next chunk with the tail of the previous one for context.
      const tail = current.slice(-overlap)
      current = tail + piece
      // If a single piece is itself larger than chunkSize, just push it.
      if (current.length > chunkSize * 1.5) {
        chunks.push(current)
        current = ""
      }
    }
  }
  if (current.trim().length > 0) chunks.push(current)
  return chunks
}

export function chunkText(
  text: string,
  opts: { chunkSize?: number; overlap?: number } = {},
): Chunk[] {
  const chunkSize = opts.chunkSize ?? DEFAULT_CHUNK_SIZE
  const overlap = opts.overlap ?? DEFAULT_CHUNK_OVERLAP

  // Normalize whitespace but preserve paragraph breaks.
  const normalized = text
    .replace(/\r\n/g, "\n")
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()

  if (normalized.length === 0) return []

  const pieces = recursiveSplit(normalized, SEPARATORS, chunkSize)
  const merged = mergePieces(pieces, chunkSize, overlap)

  return merged
    .map((text, i) => ({
      id: `c${i + 1}`,
      text: text.trim(),
      index: i + 1,
    }))
    .filter((c) => c.text.length > 0)
}
