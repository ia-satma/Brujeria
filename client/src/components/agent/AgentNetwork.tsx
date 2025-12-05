import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Bot, Database, Eye, Layout, PenTool, Server, Cpu } from "lucide-react";

interface AgentNetworkProps {
  logs: string[];
}

interface AgentNode {
  id: string;
  label: string;
  icon: React.ElementType;
  color: string;
  x: number; // Percentage
  y: number; // Percentage
  parentId?: string;
  subAgents?: string[];
}

const AGENTS: AgentNode[] = [
  { id: "Benchmarking_Manager", label: "Orchestrator", icon: Bot, color: "bg-white", x: 50, y: 15 },
  { id: "Scraping_Orchestrator", label: "Scraper", icon: Database, color: "bg-amber-400", x: 20, y: 40, parentId: "Benchmarking_Manager" },
  { id: "Visual_Aesthetics_Agent", label: "Visual", icon: Eye, color: "bg-pink-400", x: 40, y: 40, parentId: "Benchmarking_Manager", subAgents: ["Color_Palette_Analyzer", "Typo_Readability_Checker", "Design_Trend_Evaluator"] },
  { id: "UX_Navigation_Agent", label: "UX/Nav", icon: Layout, color: "bg-cyan-400", x: 60, y: 40, parentId: "Benchmarking_Manager", subAgents: ["Information_Architecture_Mapper", "CTA_Effectiveness_Scorer", "Responsive_Design_Inferrer"] },
  { id: "Content_Storytelling_Agent", label: "Content", icon: PenTool, color: "bg-purple-400", x: 80, y: 40, parentId: "Benchmarking_Manager", subAgents: ["Brand_Voice_Validator", "Thought_Leadership_Scrutinizer", "Credibility_Evidence_Collector"] },
  { id: "Technical_Performance_Agent", label: "Tech", icon: Server, color: "bg-blue-400", x: 50, y: 75, parentId: "Benchmarking_Manager", subAgents: ["Page_Speed_Scorer", "SEO_Metadata_Inspector", "Content_Markup_Validator"] },
];

export function AgentNetwork({ logs }: AgentNetworkProps) {
  const activeAgents = new Set<string>();
  
  // Parse logs to determine active agents
  logs.forEach(log => {
    AGENTS.forEach(agent => {
      if (log.includes(`[${agent.id}]`)) activeAgents.add(agent.id);
    });
  });

  return (
    <div className="w-full h-[300px] md:h-[400px] relative bg-black/40 rounded-lg border border-border/50 backdrop-blur-sm overflow-hidden my-6">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:20px_20px]" />

      {/* Connections */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        {AGENTS.map(agent => {
          if (!agent.parentId) return null;
          const parent = AGENTS.find(p => p.id === agent.parentId);
          if (!parent) return null;

          const isActive = activeAgents.has(agent.id) || activeAgents.has(parent.id);

          return (
            <motion.line
              key={`${parent.id}-${agent.id}`}
              x1={`${parent.x}%`}
              y1={`${parent.y}%`}
              x2={`${agent.x}%`}
              y2={`${agent.y}%`}
              stroke="currentColor"
              strokeWidth="2"
              className={cn(
                "transition-colors duration-500",
                isActive ? "text-primary/50" : "text-muted/10"
              )}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1, delay: 0.5 }}
            />
          );
        })}
      </svg>

      {/* Nodes */}
      {AGENTS.map(agent => {
        const isActive = activeAgents.has(agent.id);
        const isSubTaskActive = agent.subAgents?.some(sub => logs.some(l => l.includes(`[${sub}]`)));

        return (
          <div
            key={agent.id}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-2"
            style={{ left: `${agent.x}%`, top: `${agent.y}%` }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ 
                scale: isActive ? [1, 1.1, 1] : 1,
                boxShadow: isActive ? `0 0 20px ${agent.color.replace('bg-', 'var(--')})` : "none"
              }}
              transition={{ duration: 0.5 }}
              className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center border-2 transition-colors duration-300 z-10 relative",
                isActive ? `${agent.color} border-white text-black` : "bg-muted border-border text-muted-foreground",
                isSubTaskActive && "animate-pulse ring-4 ring-primary/20"
              )}
            >
              <agent.icon className="w-6 h-6" />
              
              {/* Sub-agent orbital particles */}
              {isActive && agent.subAgents && (
                 <div className="absolute inset-0 animate-spin-slow">
                   <div className="absolute -top-1 left-1/2 w-2 h-2 bg-white rounded-full shadow-[0_0_10px_white]" />
                 </div>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "text-xs font-mono font-medium px-2 py-1 rounded bg-black/50 backdrop-blur border border-white/10 whitespace-nowrap",
                isActive ? "text-white" : "text-muted-foreground"
              )}
            >
              {agent.label}
            </motion.div>

            {/* Sub-agent list tooltip style display when active */}
            {isActive && agent.subAgents && (
              <div className="absolute top-14 left-1/2 -translate-x-1/2 flex flex-col gap-1 items-center">
                 {agent.subAgents.map(sub => {
                   const isSubActive = logs.some(l => l.includes(`[${sub}]`));
                   if (!isSubActive) return null;
                   return (
                     <motion.div 
                        key={sub}
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-[10px] text-emerald-400 bg-emerald-950/50 px-1.5 py-0.5 rounded border border-emerald-500/20 whitespace-nowrap"
                     >
                       {sub.replace(/_/g, ' ')}
                     </motion.div>
                   );
                 })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
