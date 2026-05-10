"use client"

import { useEffect, useRef, useState } from "react"
import { ArrowRight, Brain, Square, MessageSquare, Terminal, Cpu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ChatMessageItem } from "@/components/chat-message"
import { cn } from "@/lib/utils"
import type { ChatMessage, Notebook, Source } from "@/lib/types"

type Props = {
  notebook: Notebook | null
}

const SUGGESTED_PROMPTS = [
  "Summarize this document in 3 bullet points",
  "What are the key takeaways from this text?",
  "List any potential risks or limitations mentioned.",
  "How does this compare to existing research?",
]

export function ChatPanel({ notebook }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [isStreaming, setIsStreaming] = useState(false)
  const abortRef = useRef<AbortController | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Reset chat when notebook changes/clears.
  useEffect(() => {
    setMessages([])
    setInput("")
  }, [notebook?.id])

  // Auto-scroll to bottom on new content.
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [messages])

  async function send(prompt: string) {
    const text = prompt.trim()
    if (!text || !notebook || isStreaming) return

    const userMsg: ChatMessage = {
      id: `u_${Date.now()}`,
      role: "user",
      content: text,
    }
    const assistantId = `a_${Date.now()}`
    const assistantMsg: ChatMessage = {
      id: assistantId,
      role: "assistant",
      content: "",
      sources: [],
      pending: true,
    }

    setMessages((prev) => [...prev, userMsg, assistantMsg])
    setInput("")
    setIsStreaming(true)

    const controller = new AbortController()
    abortRef.current = controller

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notebookId: notebook.id,
          notebook: notebook,
          messages: [
            ...messages.map((m) => ({ role: m.role, content: m.content })),
            { role: "user", content: text },
          ],
        }),
        signal: controller.signal,
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
        throw new Error(err.error ?? "Request failed")
      }

      if (!res.body) throw new Error("No response body")

      const reader = res.body.getReader()
      const decoder = new TextDecoder("utf-8")
      let buffer = ""
      let headerParsed = false
      let sources: Source[] = []
      let answer = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })

        if (!headerParsed) {
          const sep = buffer.indexOf("\n\n---\n\n")
          if (sep === -1) continue
          const headerStr = buffer.slice(0, sep)
          buffer = buffer.slice(sep + "\n\n---\n\n".length)
          try {
            const parsed = JSON.parse(headerStr) as {
              type: string
              sources: Source[]
            }
            sources = parsed.sources ?? []
          } catch {
            // ignore
          }
          headerParsed = true
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, sources, pending: true } : m,
            ),
          )
        }

        if (headerParsed && buffer.length > 0) {
          answer += buffer
          buffer = ""
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? { ...m, content: answer, sources, pending: false }
                : m,
            ),
          )
        }
      }

      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, content: answer.trim() || m.content, pending: false }
            : m,
        ),
      )
    } catch (err) {
      if ((err as Error).name === "AbortError") {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, pending: false, content: m.content || "(stopped)" }
              : m,
          ),
        )
      } else {
        const message = err instanceof Error ? err.message : "Something went wrong"
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, pending: false, content: `Sorry — ${message}` }
              : m,
          ),
        )
      }
    } finally {
      setIsStreaming(false)
      abortRef.current = null
    }
  }

  function stop() {
    abortRef.current?.abort()
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    send(input)
  }

  return (
    <section className="flex h-full min-h-0 flex-col bg-transparent">
      {/* Dynamic Header with Blur */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-zinc-950/20 backdrop-blur-sm">
        <div className="flex items-center gap-3 text-sm font-bold tracking-tight">
          <div className="p-1.5 rounded bg-zinc-800/50 border border-white/5">
            <MessageSquare className="h-4 w-4 text-zinc-400" />
          </div>
          Intelligence Session
          {notebook && (
            <span className="text-zinc-500 font-medium hidden sm:inline px-2 py-0.5 rounded bg-white/5 border border-white/5 text-[10px] uppercase tracking-widest ml-2">
              Context: {notebook.name}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-zinc-900 border border-white/10 text-[9px] font-black uppercase tracking-tighter text-zinc-400">
           <Cpu className="h-2.5 w-2.5 text-blue-500" />
           Llama-3.1-70B
        </div>
      </header>

      {/* Message Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-10 custom-scrollbar">
        {messages.length === 0 ? (
          <EmptyState
            disabled={!notebook}
            onPick={(p) => {
              setInput(p)
              if (notebook) send(p)
            }}
          />
        ) : (
          <div className="mx-auto flex max-w-4xl flex-col gap-10">
            {messages.map((m) => (
              <ChatMessageItem key={m.id} message={m} />
            ))}
          </div>
        )}
      </div>

      {/* Input Area - Glassmorphism */}
      <div className="p-6 bg-gradient-to-t from-zinc-950 to-transparent">
        <form onSubmit={onSubmit} className="mx-auto max-w-3xl relative">
          <div
            className={cn(
              "group relative flex flex-col rounded-2xl border border-white/10 bg-zinc-900/80 backdrop-blur-xl p-2 shadow-2xl transition-all duration-300 focus-within:border-white/20 focus-within:shadow-[0_0_30px_rgba(255,255,255,0.05)]",
              !notebook && "opacity-60 grayscale",
            )}
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  onSubmit(e);
                }
              }}
              disabled={!notebook}
              placeholder={
                notebook
                  ? "Describe your query or ask for a summary..."
                  : "Sync a document to start analysis"
              }
              rows={2}
              className="w-full bg-transparent p-3 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none resize-none min-h-[60px] max-h-[200px]"
            />
            
            <div className="flex items-center justify-between px-3 pb-2">
               <div className="flex gap-2">
                  <div className="text-[10px] text-zinc-500 flex items-center gap-1">
                    <Terminal className="h-3 w-3" />
                    Markdown Supported
                  </div>
               </div>
               <div className="flex items-center gap-2">
                  {isStreaming ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20"
                      onClick={stop}
                    >
                      <Square className="h-3 w-3 mr-2 fill-current" />
                      Stop
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      disabled={!notebook || !input.trim()}
                      size="sm"
                      className="h-8 rounded-lg bg-zinc-100 text-zinc-900 hover:bg-white hover:scale-105 active:scale-95 transition-all shadow-lg"
                    >
                      Analyze
                      <ArrowRight className="h-3.5 w-3.5 ml-2" />
                    </Button>
                  )}
               </div>
            </div>
          </div>
          <p className="mt-3 text-center text-[10px] text-zinc-600 font-medium">
            Responses are derived from document context.
          </p>
        </form>
      </div>
    </section>
  )
}

function EmptyState({
  disabled,
  onPick,
}: {
  disabled: boolean
  onPick: (prompt: string) => void
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center text-center pb-20 overflow-hidden">
      <div className="relative mb-8 group animate-float">
        <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full group-hover:bg-blue-500/30 transition-all duration-500 animate-pulse-glow" />
        <div className="relative flex h-20 w-20 items-center justify-center rounded-[2.5rem] bg-zinc-900 border border-white/10 shadow-2xl transition-transform duration-500 group-hover:scale-105">
          <Brain className="h-10 w-10 text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]" />
        </div>
      </div>
      
      <h3 className="mb-2 text-3xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-500">
        Intelligence Awaits.
      </h3>
      <p className="mb-8 max-w-sm text-[13px] text-zinc-500 leading-relaxed font-medium">
        Synchronize your research documents to begin a high-fidelity dialogue powered by advanced semantic retrieval.
      </p>

      <div className="grid w-full max-w-lg grid-cols-1 gap-2 sm:grid-cols-2">
        {SUGGESTED_PROMPTS.map((p) => (
          <button
            key={p}
            type="button"
            disabled={disabled}
            onClick={() => onPick(p)}
            className="group flex items-center justify-between rounded-xl border border-white/5 bg-zinc-900/50 p-4 text-left text-xs font-medium text-zinc-400 transition-all hover:bg-white/5 hover:border-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
          >
            <span className="line-clamp-1">{p}</span>
            <ArrowRight className="h-4 w-4 shrink-0 -translate-x-2 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
          </button>
        ))}
      </div>
    </div>
  )
}
