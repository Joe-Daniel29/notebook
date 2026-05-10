export type ChatRole = "user" | "assistant"

export type Source = {
  id: string
  index: number
  text: string
  score: number
}

export type ChatMessage = {
  id: string
  role: ChatRole
  content: string
  sources?: Source[]
  pending?: boolean
}

export type StoredChunk = {
  id: string
  text: string
  index: number
  embedding: number[]
}

export type Notebook = {
  id: string
  name: string
  chunkCount: number
  totalChars: number
  createdAt: number
  chunks: StoredChunk[]
}
