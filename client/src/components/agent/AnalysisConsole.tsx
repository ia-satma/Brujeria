import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { 
  Database, 
  Eye, 
  Layout, 
  PenTool, 
  Server, 
  Bot,
  CheckCircle2,
  Circle,
  Loader2,
  ChevronRight,
  Activity,
  Zap,
  Clock,
  BarChart3
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AnalysisConsoleProps {
  logs: string[];
  isProcessing: boolean;
  error: string | null;
}

interface Stage {
  id: string;
  label: string;
  icon: React.ElementType;
  color: string;
  agents: string[];
  description: string;
}

const STAGES: Stage[] = [
  { 
    id: "scraping", 
    label: "Web Scraping", 
    icon: Database, 
    color: "text-amber-400",
    agents: ["Scraping_Orchestrator"],
    description: "Extracting content from websites"
  },
  { 
    id: "visual", 
    label: "Visual Analysis", 
    icon: Eye, 
    color: "text-pink-400",
    agents: ["Visual_Aesthetics_Agent", "Color_Palette_Analyzer", "Typo_Readability_Checker", "Design_Trend_Evaluator"],
    description: "Analyzing design and aesthetics"
  },
  { 
    id: "ux", 
    label: "UX Analysis", 
    icon: Layout, 
    color: "text-cyan-400",
    agents: ["UX_Navigation_Agent", "Information_Architecture_Mapper", "CTA_Effectiveness_Scorer", "Responsive_Design_Inferrer"],
    description: "Evaluating user experience"
  },
  { 
    id: "content", 
    label: "Content Analysis", 
    icon: PenTool, 
    color: "text-purple-400",
    agents: ["Content_Storytelling_Agent", "Brand_Voice_Validator", "Thought_Leadership_Scrutinizer", "Credibility_Evidence_Collector"],
    description: "Reviewing content quality"
  },
  { 
    id: "technical", 
    label: "Technical Analysis", 
    icon: Server, 
    color: "text-blue-400",
    agents: ["Technical_Performance_Agent", "Page_Speed_Scorer", "SEO_Metadata_Inspector", "Content_Markup_Validator"],
    description: "Checking technical performance"
  },
  { 
    id: "synthesis", 
    label: "Report Generation", 
    icon: BarChart3, 
    color: "text-emerald-400",
    agents: ["Benchmarking_Manager"],
    description: "Synthesizing final report"
  },
];

function getStageStatus(stage: Stage, logs: string[], allStages: Stage[], stageIndex: number): "pending" | "active" | "completed" {
  const hasStageActivity = stage.agents.some(agent => 
    logs.some(log => log.includes(`[${agent}]`))
  );
  
  const isLastStage = stageIndex === allStages.length - 1;
  const analysisComplete = logs.some(log => log.includes('[COMPLETE]'));
  
  if (isLastStage && hasStageActivity && analysisComplete) {
    return "completed";
  }
  
  const laterStageActive = allStages.slice(stageIndex + 1).some(laterStage =>
    laterStage.agents.some(agent => logs.some(log => log.includes(`[${agent}]`)))
  );
  
  if (laterStageActive && hasStageActivity) return "completed";
  if (hasStageActivity) return "active";
  
  const earlierStageActive = allStages.slice(0, stageIndex).some(earlierStage =>
    earlierStage.agents.some(agent => logs.some(log => log.includes(`[${agent}]`)))
  );
  
  if (earlierStageActive && !hasStageActivity) return "pending";
  
  return "pending";
}

function ProgressStages({ logs }: { logs: string[] }) {
  const stageStatuses = useMemo(() => {
    return STAGES.map((stage, index) => ({
      ...stage,
      status: getStageStatus(stage, logs, STAGES, index)
    }));
  }, [logs]);

  const completedCount = stageStatuses.filter(s => s.status === "completed").length;
  const activeCount = stageStatuses.filter(s => s.status === "active").length;
  const progressPercent = ((completedCount + (activeCount * 0.5)) / STAGES.length) * 100;

  return (
    <div className="w-full space-y-4" data-testid="container-progress-stages">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Analysis Progress</span>
        <span className="font-mono text-primary">{Math.round(progressPercent)}%</span>
      </div>
      <Progress 
        value={progressPercent} 
        className="h-2" 
        data-testid="progress-analysis"
        aria-valuenow={Math.round(progressPercent)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Analysis progress: ${Math.round(progressPercent)} percent complete`}
      />
      <span className="sr-only">Analysis is {Math.round(progressPercent)} percent complete</span>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
        {stageStatuses.map((stage, index) => (
          <motion.div
            key={stage.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={cn(
              "relative p-3 rounded-lg border transition-all duration-300",
              stage.status === "active" && "bg-primary/10 border-primary/50 shadow-lg shadow-primary/10",
              stage.status === "completed" && "bg-emerald-500/10 border-emerald-500/30",
              stage.status === "pending" && "bg-muted/30 border-border/50"
            )}
            data-testid={`stage-${stage.id}`}
            aria-label={`${stage.label}: ${stage.status === "active" ? "in progress" : stage.status === "completed" ? "completed" : "pending"}`}
          >
            <div className="flex flex-col items-center gap-2 text-center">
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                stage.status === "active" && `${stage.color} bg-black/50`,
                stage.status === "completed" && "text-emerald-400 bg-emerald-500/20",
                stage.status === "pending" && "text-muted-foreground bg-muted"
              )}>
                {stage.status === "active" && (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  >
                    <Loader2 className="w-5 h-5" aria-hidden="true" />
                  </motion.div>
                )}
                {stage.status === "completed" && <CheckCircle2 className="w-5 h-5" aria-hidden="true" />}
                {stage.status === "pending" && <stage.icon className="w-5 h-5" aria-hidden="true" />}
              </div>
              <div>
                <p className={cn(
                  "text-xs font-medium",
                  stage.status === "active" && "text-foreground",
                  stage.status === "completed" && "text-emerald-400",
                  stage.status === "pending" && "text-muted-foreground"
                )}>
                  {stage.label}
                </p>
                {stage.status === "active" && (
                  <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">
                    {stage.description}
                  </p>
                )}
              </div>
            </div>
            
            {stage.status === "active" && (
              <motion.div
                className="absolute inset-0 rounded-lg border-2 border-primary/50"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function AgentActivityFeed({ logs }: { logs: string[] }) {
  const recentLogs = logs.slice(-15);
  
  const getLogStyle = (log: string) => {
    if (log.includes("[ERROR]")) return "text-red-400 bg-red-500/10 border-red-500/20";
    if (log.includes("[COMPLETE]")) return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
    
    // Scraping status indicators
    if (log.includes("⚠ Skipped") || log.includes("timeout:") || log.includes("failed:")) {
      return "text-amber-400 bg-amber-500/15 border-amber-500/30";
    }
    if (log.includes("✓ Scraped")) return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
    if (log.includes("═══") || log.includes("Scraping complete:")) return "text-cyan-300 bg-cyan-500/10 border-cyan-500/20 font-medium";
    if (log.includes("Failed:") || log.includes("Timed out:")) return "text-amber-400 bg-amber-500/10 border-amber-500/20";
    
    if (log.includes("[Benchmarking_Manager]")) return "text-white bg-white/5 border-white/10";
    if (log.includes("[Scraping_Orchestrator]")) return "text-amber-300 bg-amber-500/10 border-amber-500/20";
    if (log.includes("[Visual_Aesthetics_Agent]")) return "text-pink-400 bg-pink-500/10 border-pink-500/20";
    if (log.includes("[UX_Navigation_Agent]")) return "text-cyan-400 bg-cyan-500/10 border-cyan-500/20";
    if (log.includes("[Content_Storytelling_Agent]")) return "text-purple-400 bg-purple-500/10 border-purple-500/20";
    if (log.includes("[Technical_Performance_Agent]")) return "text-blue-400 bg-blue-500/10 border-blue-500/20";
    if (log.includes(">")) return "text-muted-foreground bg-muted/20 border-muted/20 pl-6";
    return "text-green-500/90 bg-green-500/5 border-green-500/10";
  };

  const getAgentIcon = (log: string) => {
    if (log.includes("[Scraping_Orchestrator]")) return Database;
    if (log.includes("[Visual_Aesthetics_Agent]")) return Eye;
    if (log.includes("[UX_Navigation_Agent]")) return Layout;
    if (log.includes("[Content_Storytelling_Agent]")) return PenTool;
    if (log.includes("[Technical_Performance_Agent]")) return Server;
    if (log.includes("[Benchmarking_Manager]")) return Bot;
    return Activity;
  };

  return (
    <div 
      role="log" 
      aria-label="Agent activity log stream" 
      aria-live="polite"
      aria-atomic="false"
    >
      <ScrollArea className="h-[300px]" data-testid="container-activity-feed">
        <div className="space-y-2 p-1">
          {recentLogs.map((log, i) => {
            const Icon = getAgentIcon(log);
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.02 }}
                className={cn(
                  "flex items-start gap-2 p-2 rounded-md border text-xs font-mono",
                  getLogStyle(log)
                )}
              >
                <Icon className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" aria-hidden="true" />
                <span className="break-all">{log}</span>
              </motion.div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}

function ReportSkeleton() {
  return (
    <div className="space-y-6 p-4" data-testid="container-report-skeleton">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-6 w-24" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="bg-muted/20">
            <CardContent className="p-4 space-y-3">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-10 w-16" />
              <Skeleton className="h-2 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="bg-muted/20">
          <CardHeader className="pb-2">
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </CardContent>
        </Card>
        <Card className="bg-muted/20">
          <CardHeader className="pb-2">
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function LiveMetrics({ logs }: { logs: string[] }) {
  const [elapsedTime, setElapsedTime] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const activeAgents = useMemo(() => {
    const agents = new Set<string>();
    const mainAgents = [
      "Benchmarking_Manager",
      "Scraping_Orchestrator", 
      "Visual_Aesthetics_Agent",
      "UX_Navigation_Agent",
      "Content_Storytelling_Agent",
      "Technical_Performance_Agent"
    ];
    
    logs.forEach(log => {
      mainAgents.forEach(agent => {
        if (log.includes(`[${agent}]`)) agents.add(agent);
      });
    });
    
    return agents.size;
  }, [logs]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4" data-testid="container-live-metrics">
      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/50">
        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
          <Clock className="w-5 h-5 text-primary" aria-hidden="true" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Elapsed Time</p>
          <p className="text-lg font-mono font-bold text-foreground" data-testid="text-elapsed-time">
            {formatTime(elapsedTime)}
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/50">
        <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
          <Bot className="w-5 h-5 text-emerald-400" aria-hidden="true" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Active Agents</p>
          <p className="text-lg font-mono font-bold text-emerald-400" data-testid="text-active-agents">
            {activeAgents}/6
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/50">
        <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
          <Zap className="w-5 h-5 text-blue-400" aria-hidden="true" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Log Events</p>
          <p className="text-lg font-mono font-bold text-blue-400" data-testid="text-log-count">
            {logs.length}
          </p>
        </div>
      </div>
    </div>
  );
}

export function AnalysisConsole({ logs, isProcessing, error }: AnalysisConsoleProps) {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6" data-testid="container-analysis-console">
      <ProgressStages logs={logs} />
      
      <LiveMetrics logs={logs} />
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList 
          className="grid w-full grid-cols-3 bg-muted/30 min-h-[44px]" 
          role="tablist" 
          aria-label="Analysis console navigation"
        >
          <TabsTrigger value="overview" data-testid="tab-overview" className="min-h-[44px]">
            <Activity className="w-4 h-4 mr-2" aria-hidden="true" />
            Activity
          </TabsTrigger>
          <TabsTrigger value="agents" data-testid="tab-agents" className="min-h-[44px]">
            <Bot className="w-4 h-4 mr-2" aria-hidden="true" />
            Agents
          </TabsTrigger>
          <TabsTrigger value="preview" data-testid="tab-preview" className="min-h-[44px]">
            <BarChart3 className="w-4 h-4 mr-2" aria-hidden="true" />
            Preview
          </TabsTrigger>
        </TabsList>
        
        <div className="mt-4 border border-border rounded-lg bg-black/40 backdrop-blur-sm overflow-hidden">
          <TabsContent value="overview" className="m-0">
            <div className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="w-4 h-4 text-primary" aria-hidden="true" />
                <h3 className="font-medium">Real-Time Activity Feed</h3>
                {isProcessing && (
                  <Badge 
                    variant="outline" 
                    className="ml-auto animate-pulse"
                    aria-label="Analysis is currently running and processing live data"
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-400 mr-2" aria-hidden="true" />
                    Live
                  </Badge>
                )}
              </div>
              <AgentActivityFeed logs={logs} />
            </div>
          </TabsContent>
          
          <TabsContent value="agents" className="m-0">
            <div className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <Bot className="w-4 h-4 text-primary" aria-hidden="true" />
                <h3 className="font-medium">Agent Network Status</h3>
              </div>
              <AgentStatusGrid logs={logs} />
            </div>
          </TabsContent>
          
          <TabsContent value="preview" className="m-0">
            <div className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-4 h-4 text-primary" aria-hidden="true" />
                <h3 className="font-medium">Report Preview</h3>
                <Badge 
                  variant="secondary" 
                  className="ml-auto"
                  aria-label="Report is currently being generated"
                >
                  Generating...
                </Badge>
              </div>
              <ReportSkeleton />
            </div>
          </TabsContent>
        </div>
      </Tabs>
      
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400"
          data-testid="container-console-error"
        >
          <p className="font-medium">Analysis Error</p>
          <p className="text-sm mt-1">{error}</p>
        </motion.div>
      )}
    </div>
  );
}

const agentColorStyles = {
  white: {
    active: "bg-white/10 border-white/30",
    bg: "bg-white/20",
    text: "text-white"
  },
  amber: {
    active: "bg-amber-500/10 border-amber-500/30",
    bg: "bg-amber-500/20",
    text: "text-amber-400"
  },
  pink: {
    active: "bg-pink-500/10 border-pink-500/30",
    bg: "bg-pink-500/20",
    text: "text-pink-400"
  },
  cyan: {
    active: "bg-cyan-500/10 border-cyan-500/30",
    bg: "bg-cyan-500/20",
    text: "text-cyan-400"
  },
  purple: {
    active: "bg-purple-500/10 border-purple-500/30",
    bg: "bg-purple-500/20",
    text: "text-purple-400"
  },
  blue: {
    active: "bg-blue-500/10 border-blue-500/30",
    bg: "bg-blue-500/20",
    text: "text-blue-400"
  }
} as const;

type AgentColor = keyof typeof agentColorStyles;

function AgentStatusGrid({ logs }: { logs: string[] }) {
  const agents: { id: string; label: string; icon: React.ElementType; color: AgentColor }[] = [
    { id: "Benchmarking_Manager", label: "Orchestrator", icon: Bot, color: "white" },
    { id: "Scraping_Orchestrator", label: "Web Scraper", icon: Database, color: "amber" },
    { id: "Visual_Aesthetics_Agent", label: "Visual Analyst", icon: Eye, color: "pink" },
    { id: "UX_Navigation_Agent", label: "UX Analyst", icon: Layout, color: "cyan" },
    { id: "Content_Storytelling_Agent", label: "Content Analyst", icon: PenTool, color: "purple" },
    { id: "Technical_Performance_Agent", label: "Tech Analyst", icon: Server, color: "blue" },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="container-agent-grid">
      {agents.map((agent) => {
        const isActive = logs.some(log => log.includes(`[${agent.id}]`));
        const agentLogs = logs.filter(log => log.includes(`[${agent.id}]`));
        const lastLog = agentLogs[agentLogs.length - 1];
        const colorStyle = agentColorStyles[agent.color];
        
        return (
          <motion.div
            key={agent.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
              "p-4 rounded-lg border transition-all duration-300",
              isActive ? colorStyle.active : "bg-muted/20 border-border/50"
            )}
            data-testid={`agent-status-${agent.id}`}
            aria-label={`${agent.label}: ${isActive ? "active with " + agentLogs.length + " events" : "waiting"}`}
          >
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center",
                isActive ? colorStyle.bg : "bg-muted"
              )}>
                <agent.icon className={cn(
                  "w-5 h-5",
                  isActive ? colorStyle.text : "text-muted-foreground"
                )} aria-hidden="true" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={cn(
                    "font-medium text-sm",
                    isActive ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {agent.label}
                  </p>
                  {isActive && (
                    <span 
                      className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" 
                      aria-hidden="true"
                    />
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {isActive ? `${agentLogs.length} events` : "Waiting..."}
                </p>
              </div>
            </div>
            {isActive && lastLog && (
              <p className="mt-2 text-xs text-muted-foreground line-clamp-2 font-mono">
                {lastLog.substring(0, 80)}...
              </p>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
