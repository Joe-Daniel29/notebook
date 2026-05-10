/**
 * In-Memory Vector Storage Engine
 * Developed by Joe Daniel
 * 
 * Provides efficient storage and retrieval of document chunks and their high-dimensional
 * embeddings. Uses cosine similarity for semantic matching. In-memory storage is handled
 * via a global map to ensure persistence across hot-reloads during local development.
 */

export type StoredChunk = {
  id: string
  text: string
  index: number
  embedding: number[]
}

export type Notebook = {
  id: string
  name: string
  createdAt: number
  chunks: StoredChunk[]
}

type StoreShape = Map<string, Notebook>

const GLOBAL_KEY = "__notebooklm_store__"

function getStore(): StoreShape {
  const g = globalThis as unknown as Record<string, StoreShape | undefined>
  if (!g[GLOBAL_KEY]) {
    g[GLOBAL_KEY] = new Map<string, Notebook>()
  }
  return g[GLOBAL_KEY]!
}

export function createNotebook(name: string): Notebook {
  const id = `nb_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
  const nb: Notebook = { id, name, createdAt: Date.now(), chunks: [] }
  getStore().set(id, nb)
  return nb
}

export function getNotebook(id: string): Notebook | undefined {
  return getStore().get(id)
}

export function addChunks(id: string, chunks: StoredChunk[]): void {
  const nb = getStore().get(id)
  if (!nb) throw new Error(`Notebook ${id} not found`)
  nb.chunks.push(...chunks)
}

export function deleteNotebook(id: string): void {
  getStore().delete(id)
}

function dot(a: number[], b: number[]): number {
  let s = 0
  for (let i = 0; i < a.length; i++) s += a[i] * b[i]
  return s
}

function norm(a: number[]): number {
  let s = 0
  for (let i = 0; i < a.length; i++) s += a[i] * a[i]
  return Math.sqrt(s)
}

export function cosineSimilarity(a: number[], b: number[]): number {
  const denom = norm(a) * norm(b)
  if (denom === 0) return 0
  return dot(a, b) / denom
}

export type SearchResult = StoredChunk & { score: number }

export function search(notebookId: string, queryEmbedding: number[], topK = 5): SearchResult[] {
  const nb = getStore().get(notebookId)
  if (!nb) throw new Error(`Notebook ${notebookId} not found`)
  return searchInChunks(nb.chunks, queryEmbedding, topK)
}

export function searchInChunks(chunks: StoredChunk[], queryEmbedding: number[], topK = 5): SearchResult[] {
  const scored = chunks.map((c) => ({
    ...c,
    score: cosineSimilarity(queryEmbedding, c.embedding),
  }))
  scored.sort((a, b) => b.score - a.score)
  return scored.slice(0, topK)
}
