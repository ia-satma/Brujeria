import React, { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Terminal, ShieldCheck, Loader2 } from "lucide-react";

interface TerminalLogProps {
  logs: string[];
  isProcessing: boolean;
}

export function TerminalLog({ logs, isProcessing }: TerminalLogProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs]);

  return (
    <div className="w-full max-w-3xl mx-auto mt-8 border border-border bg-black/90 rounded-lg overflow-hidden shadow-2xl font-mono text-sm relative">
      <div className="flex items-center justify-between px-4 py-2 bg-muted/50 border-b border-border">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Terminal className="w-4 h-4" />
          <span className="text-xs font-medium">AGENT_CONSOLE_OUTPUT</span>
        </div>
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/50" />
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500/20 border border-amber-500/50" />
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/20 border border-emerald-500/50" />
        </div>
      </div>
      
      <ScrollArea className="h-[400px] p-4 text-green-500/90 selection:bg-green-500/20">
        <div className="flex flex-col gap-1">
          {logs.map((log, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className={cn(
                "font-mono whitespace-pre-wrap break-all",
                log.includes("[ERROR]") && "text-red-400",
                log.includes("[SUCCESS]") && "text-emerald-400 font-bold",
                log.includes("[ANALYZER]") && "text-blue-400",
                log.includes("[SCRAPER]") && "text-amber-400"
              )}
            >
              <span className="opacity-50 mr-2 select-none">$</span>
              {log}
            </motion.div>
          ))}
          {isProcessing && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2 text-green-500/50 mt-2 animate-pulse"
            >
              <span className="w-2 h-4 bg-green-500/50 block animate-pulse" />
            </motion.div>
          )}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>
      
      {isProcessing && (
        <div className="absolute bottom-4 right-4">
          <Loader2 className="w-5 h-5 text-green-500 animate-spin" />
        </div>
      )}
    </div>
  );
}
