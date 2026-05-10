"use client"

import { useState } from "react"
import { BookOpen, Menu, X, Github, ExternalLink, Sparkles } from "lucide-react"
import { ChatPanel } from "@/components/chat-panel"
import { SourcePanel } from "@/components/source-panel"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { Notebook } from "@/lib/types"

/**
 * Premium Notebook App Shell
 * Developed by Joe Daniel
 */
export function NotebookApp() {
  const [notebook, setNotebook] = useState<Notebook | null>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <div className="flex h-dvh flex-col bg-zinc-950 text-zinc-100 selection:bg-zinc-100 selection:text-zinc-900 overflow-hidden font-sans bg-glow">
      {/* Top Header - Glassmorphism */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-white/5 bg-zinc-950/80 backdrop-blur-md px-4 z-50">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 md:hidden text-zinc-400 hover:text-white hover:bg-white/5 transition-all"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 text-zinc-950 shadow-[0_0_15px_rgba(255,255,255,0.2)]">
            <BookOpen className="h-4.5 w-4.5" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold tracking-tight leading-none">Notebook RAG</span>
            <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-widest mt-1">Professional</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Cloud Engine Active</span>
          </div>
          <a
            href="https://github.com/joedaniel/notebook"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg border border-white/5 transition-all"
          >
            <Github className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Source</span>
          </a>
        </div>
      </header>

      <main className="relative flex flex-1 overflow-hidden min-h-0">
        {/* Mobile Sidebar Overlay */}
        <div 
          className={cn(
            "fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity md:hidden",
            isSidebarOpen ? "opacity-100" : "pointer-events-none opacity-0"
          )}
          onClick={() => setIsSidebarOpen(false)}
        />
        
        {/* Sidebar Panel - Glassmorphism */}
        <div className={cn(
          "fixed inset-y-0 left-0 z-40 w-[300px] transform bg-zinc-950/40 backdrop-blur-2xl border-r border-white/5 transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1) md:relative md:z-0 md:w-[320px] md:translate-x-0 lg:w-[360px]",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          <div className="h-full flex flex-col">
            <div className="flex-1 overflow-y-auto custom-scrollbar">
               <SourcePanel
                notebook={notebook}
                onUploaded={(nb) => {
                  setNotebook(nb)
                  setIsSidebarOpen(false) 
                }}
                onClear={() => setNotebook(null)}
              />
            </div>
            <div className="p-4 border-t border-white/5 bg-black/20">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">Dev Studio</span>
                <span className="text-[10px] text-zinc-400 font-bold">Joe Daniel</span>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Area - Focused Design */}
        <div className="flex-1 relative flex flex-col min-w-0 bg-gradient-to-br from-zinc-950 via-zinc-950 to-zinc-900/50">
          <div className="flex-1 overflow-hidden flex flex-col">
            <ChatPanel notebook={notebook} />
          </div>
        </div>
      </main>
    </div>
  )
}
