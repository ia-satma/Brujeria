import React, { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Terminal, ShieldCheck, Loader2, Bot, Network } from "lucide-react";

interface TerminalLogProps {
  logs: string[];
  isProcessing: boolean;
}

export function TerminalLog({ logs, isProcessing }: TerminalLogProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs]);

  // Helper to determine log color/style based on Agent
  const getLogStyle = (log: string) => {
    if (log.includes("[ERROR]")) return "text-red-400";
    if (log.includes("[COMPLETE]")) return "text-emerald-400 font-bold";
    
    // Orchestrator
    if (log.includes("[Benchmarking_Manager]")) return "text-white font-medium";
    if (log.includes("[Scraping_Orchestrator]")) return "text-amber-300";
    
    // Specialized Agents
    if (log.includes("[Visual_Aesthetics_Agent]")) return "text-pink-400";
    if (log.includes("[UX_Navigation_Agent]")) return "text-cyan-400";
    if (log.includes("[Content_Storytelling_Agent]")) return "text-purple-400";
    if (log.includes("[Technical_Performance_Agent]")) return "text-blue-400";
    
    // Sub-Agents (usually noted with >)
    if (log.includes(">")) return "text-muted-foreground pl-4 italic"; // Indented sub-tasks
    
    return "text-green-500/90"; // Default
  };

  return (
    <div className="w-full max-w-3xl mx-auto mt-8 border border-border bg-black/95 rounded-lg overflow-hidden shadow-2xl font-mono text-sm relative">
      <div className="flex items-center justify-between px-4 py-2 bg-muted/10 border-b border-border">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Network className="w-4 h-4 text-primary" />
          <span className="text-xs font-medium tracking-wider">DISTRIBUTED_AGENT_NETWORK</span>
        </div>
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/50" />
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500/20 border border-amber-500/50" />
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/20 border border-emerald-500/50" />
        </div>
      </div>
      
      <ScrollArea className="h-[450px] p-4 text-green-500/90 selection:bg-green-500/20">
        <div className="flex flex-col gap-1.5">
          {logs.map((log, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -5 }}
              animate={{ opacity: 1, x: 0 }}
              className={cn(
                "font-mono whitespace-pre-wrap break-all transition-colors duration-300",
                getLogStyle(log)
              )}
            >
              {!log.includes(">") && <span className="opacity-30 mr-2 text-xs select-none">sys::</span>}
              {log.includes(">") && <span className="opacity-30 mr-2 text-xs select-none">sub::</span>}
              {log}
            </motion.div>
          ))}
          {isProcessing && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2 text-green-500/50 mt-2"
            >
              <span className="w-2 h-4 bg-primary block animate-pulse" />
            </motion.div>
          )}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>
      
      {isProcessing && (
        <div className="absolute bottom-4 right-4 flex items-center gap-2 bg-black/50 backdrop-blur px-3 py-1 rounded-full border border-primary/20">
          <Bot className="w-4 h-4 text-primary animate-pulse" />
          <span className="text-xs text-primary/80 font-medium uppercase">Agents Active</span>
        </div>
      )}
    </div>
  );
}
