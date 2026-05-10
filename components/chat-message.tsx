"use client"

import { useState } from "react"
import { Bot, User, Quote, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ChatMessage as ChatMessageType, Source } from "@/lib/types"

type Props = {
  message: ChatMessageType
}

export function ChatMessageItem({ message }: Props) {
  const [activeChunk, setActiveChunk] = useState<number | null>(null)
  const isUser = message.role === "user"

  const rendered = isUser
    ? message.content
    : renderWithCitations(message.content, message.sources ?? [], (idx) =>
        setActiveChunk((prev) => (prev === idx ? null : idx)),
      )

  return (
    <div className={cn(
      "group relative flex flex-col gap-4 animate-message",
      isUser ? "items-end" : "items-start"
    )}>
      <div
        className={cn(
          "flex items-start gap-4 max-w-[90%] md:max-w-[80%]",
          isUser ? "flex-row-reverse" : "flex-row",
        )}
      >
        {/* Avatar with Glow */}
        <div
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl shadow-lg border",
            isUser
              ? "bg-zinc-800 border-white/5 text-zinc-400"
              : "bg-zinc-100 border-white text-zinc-950 shadow-[0_0_20px_rgba(255,255,255,0.1)]",
          )}
        >
          {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
        </div>

        {/* Message Bubble */}
        <div
          className={cn(
            "relative flex flex-col gap-2 rounded-2xl px-5 py-4 text-sm leading-relaxed shadow-xl transition-all",
            isUser
              ? "bg-white text-zinc-950 font-medium rounded-tr-none"
              : "bg-zinc-900/50 backdrop-blur-md text-zinc-100 border border-white/5 rounded-tl-none hover:bg-zinc-900/80",
          )}
        >
          {!isUser && (
             <div className="flex items-center gap-2 mb-1 text-[10px] font-black uppercase tracking-widest text-zinc-500">
               <span className="text-zinc-400">Intelligence Node</span>
               <span className="w-1 h-1 rounded-full bg-zinc-700" />
               <span>Session Contextualized</span>
             </div>
          )}

          {message.pending && !message.content ? (
            <div className="flex items-center gap-2 py-2">
              <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-500 [animation-duration:1s]" />
              <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-500 [animation-duration:1s] [animation-delay:0.2s]" />
              <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-500 [animation-duration:1s] [animation-delay:0.4s]" />
            </div>
          ) : (
            <div className={cn(
              "whitespace-pre-wrap text-pretty",
              isUser 
                ? "font-sans text-[14px] font-medium tracking-tight leading-relaxed" 
                : "font-serif text-[15px] md:text-[16px] leading-[1.7] tracking-normal text-zinc-200"
            )}>
              {rendered}
            </div>
          )}
        </div>
      </div>

      {/* Citation Preview with Glass Effect */}
      {!isUser && activeChunk !== null && message.sources && (
        <div className="animate-in slide-in-from-top-2 fade-in duration-300 w-full max-w-2xl ml-13">
          <SourcePreview
            source={message.sources.find((s) => s.index === activeChunk)}
            onClose={() => setActiveChunk(null)}
          />
        </div>
      )}
    </div>
  )
}

function renderWithCitations(
  text: string,
  sources: Source[],
  onClick: (idx: number) => void,
): React.ReactNode {
  if (sources.length === 0) return text

  const validIndices = new Set(sources.map((s) => s.index))
  const regex = /\[((?:\d+\s*,\s*)*\d+)\]/g

  const out: React.ReactNode[] = []
  let lastEnd = 0
  let key = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastEnd) {
      out.push(text.slice(lastEnd, match.index))
    }
    const nums = match[1]
      .split(",")
      .map((n) => Number.parseInt(n.trim(), 10))
      .filter((n) => Number.isFinite(n))

    out.push(
      <span key={`cite-${key++}`} className="inline-flex items-center gap-1 mx-1 translate-y-[-1px]">
        {nums.map((n, i) => {
          const valid = validIndices.has(n)
          return (
            <button
              key={`${n}-${i}`}
              type="button"
              onClick={() => valid && onClick(n)}
              disabled={!valid}
              className={cn(
                "inline-flex h-4.5 min-w-[18px] items-center justify-center rounded bg-zinc-800 border border-white/10 px-1 font-mono text-[9px] font-black tracking-tighter transition-all",
                valid
                  ? "text-blue-400 hover:bg-zinc-700 hover:text-white cursor-pointer hover:scale-110 active:scale-95"
                  : "text-zinc-600 cursor-default opacity-50",
              )}
              title={valid ? `View Evidence: Chunk ${n}` : `Metadata Ref ${n}`}
            >
              {n}
            </button>
          )
        })}
      </span>,
    )
    lastEnd = match.index + match[0].length
  }
  if (lastEnd < text.length) out.push(text.slice(lastEnd))
  return out
}

function SourcePreview({
  source,
  onClose,
}: {
  source: Source | undefined
  onClose: () => void
}) {
  if (!source) return null
  return (
    <div className="relative rounded-2xl border border-white/10 bg-zinc-900/40 backdrop-blur-2xl p-5 shadow-2xl group/source overflow-hidden">
      <div className="absolute top-0 right-0 p-3">
         <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-lg bg-white/5 text-zinc-500 hover:text-white transition-all"
        >
          <ChevronRight className="h-4 w-4 rotate-90 md:rotate-0" />
        </button>
      </div>
      
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
           <Quote className="h-4 w-4 text-blue-400" />
        </div>
        <div className="flex flex-col">
           <span className="text-xs font-black uppercase tracking-widest text-zinc-200">Source Evidence #{source.index}</span>
           <span className="text-[10px] text-zinc-500 font-bold tracking-tight">Semantic Score: {(source.score * 100).toFixed(1)}% Relevance</span>
        </div>
      </div>

      <div className="max-h-60 overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed text-zinc-300 font-medium custom-scrollbar pr-2 italic">
        "{source.text}"
      </div>
    </div>
  )
}
