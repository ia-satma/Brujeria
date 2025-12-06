import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { 
  ArrowLeft, 
  Eye, 
  Navigation, 
  FileText, 
  Gauge, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Activity,
  Target,
  BarChart3,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Clock
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface AgentPerformanceMetrics {
  agentName: string;
  totalAnalyses: number;
  averageScore: number;
  scoreVariance: number;
  consistencyScore: number;
  strongAreas: string[];
  weakAreas: string[];
  improvementRate: number;
  recentTrend: 'improving' | 'stable' | 'declining';
}

interface PerformanceResponse {
  success: boolean;
  agents: AgentPerformanceMetrics[];
}

const AGENT_CONFIG: Record<string, { displayName: string; icon: React.ReactNode; color: string; bgColor: string }> = {
  'Visual_Aesthetics_Agent': {
    displayName: 'Agente de Estética Visual',
    icon: <Eye className="w-5 h-5" />,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
  },
  'UX_Navigation_Agent': {
    displayName: 'Agente de UX/Navegación',
    icon: <Navigation className="w-5 h-5" />,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
  },
  'Content_Storytelling_Agent': {
    displayName: 'Agente de Contenido',
    icon: <FileText className="w-5 h-5" />,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
  },
  'Technical_Performance_Agent': {
    displayName: 'Agente de Rendimiento Técnico',
    icon: <Gauge className="w-5 h-5" />,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
  },
};

function CircularProgress({ value, size = 100, strokeWidth = 8, rawScore }: { value: number; size?: number; strokeWidth?: number; rawScore?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const percentage = Math.min(Math.max(value, 0), 100);
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          className="text-muted/30"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          className="text-primary transition-all duration-500 ease-out"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xl font-bold text-foreground">
          {rawScore !== undefined ? rawScore.toFixed(1) : `${percentage.toFixed(0)}%`}
        </span>
      </div>
    </div>
  );
}

function TrendBadge({ trend }: { trend: 'improving' | 'stable' | 'declining' }) {
  const config = {
    improving: { 
      icon: <TrendingUp className="w-3 h-3" />, 
      label: 'Mejorando', 
      className: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
    },
    stable: { 
      icon: <Minus className="w-3 h-3" />, 
      label: 'Estable', 
      className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' 
    },
    declining: { 
      icon: <TrendingDown className="w-3 h-3" />, 
      label: 'Declinando', 
      className: 'bg-red-500/20 text-red-400 border-red-500/30' 
    },
  };

  const { icon, label, className } = config[trend];

  return (
    <Badge variant="outline" className={`gap-1 ${className}`} data-testid={`badge-trend-${trend}`}>
      {icon}
      {label}
    </Badge>
  );
}

function AgentCard({ agent, index }: { agent: AgentPerformanceMetrics; index: number }) {
  const config = AGENT_CONFIG[agent.agentName] || {
    displayName: agent.agentName.replace(/_/g, ' '),
    icon: <Activity className="w-5 h-5" />,
    color: 'text-primary',
    bgColor: 'bg-primary/10',
  };

  const scorePercentage = (agent.averageScore / 10) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card 
        className="border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/30 transition-colors"
        data-testid={`card-agent-${agent.agentName}`}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${config.bgColor} ${config.color}`}>
                {config.icon}
              </div>
              <div>
                <CardTitle className="text-base font-medium" data-testid={`text-agent-name-${agent.agentName}`}>
                  {config.displayName}
                </CardTitle>
                <CardDescription className="text-xs mt-1">
                  {agent.totalAnalyses} análisis realizados
                </CardDescription>
              </div>
            </div>
            <TrendBadge trend={agent.recentTrend} />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex flex-col items-center">
              <CircularProgress value={scorePercentage} size={80} strokeWidth={6} rawScore={agent.averageScore} />
              <div className="mt-2 text-center">
                <span className="text-xs text-muted-foreground">Score: </span>
                <span className="text-sm font-bold text-primary" data-testid={`text-avg-score-${agent.agentName}`}>
                  {agent.averageScore.toFixed(2)}/10
                </span>
              </div>
            </div>
            <div className="flex-1 ml-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Consistencia</span>
                <span className="font-medium" data-testid={`text-consistency-${agent.agentName}`}>
                  {(agent.consistencyScore * 100).toFixed(1)}%
                </span>
              </div>
              <Progress value={agent.consistencyScore * 100} className="h-1.5" />
              
              <div className="flex justify-between text-sm mt-2">
                <span className="text-muted-foreground">Mejora</span>
                <span className="font-medium" data-testid={`text-improvement-${agent.agentName}`}>
                  {agent.improvementRate > 0 ? '+' : ''}{(agent.improvementRate * 100).toFixed(1)}%
                </span>
              </div>
              <Progress 
                value={Math.abs(agent.improvementRate) * 100} 
                className={`h-1.5 ${agent.improvementRate < 0 ? '[&>div]:bg-red-500' : ''}`} 
              />
              
              <div className="flex justify-between text-sm mt-2">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Avg Response Time
                </span>
                <span className="font-medium text-muted-foreground" data-testid={`text-response-time-${agent.agentName}`}>
                  N/A
                </span>
              </div>
            </div>
          </div>

          {(agent.strongAreas.length > 0 || agent.weakAreas.length > 0) && (
            <div className="pt-3 border-t border-border/30 space-y-3">
              {agent.strongAreas.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 text-xs text-emerald-400 mb-2">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Fortalezas</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {agent.strongAreas.slice(0, 3).map((area, i) => (
                      <Badge 
                        key={i} 
                        variant="outline" 
                        className="text-xs bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                        data-testid={`badge-strength-${agent.agentName}-${i}`}
                      >
                        {area}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {agent.weakAreas.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 text-xs text-amber-400 mb-2">
                    <AlertTriangle className="w-3 h-3" />
                    <span>Áreas de Mejora</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {agent.weakAreas.slice(0, 3).map((area, i) => (
                      <Badge 
                        key={i} 
                        variant="outline" 
                        className="text-xs bg-amber-500/10 border-amber-500/30 text-amber-400"
                        data-testid={`badge-weakness-${agent.agentName}-${i}`}
                      >
                        {area}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function SystemHealthSection({ agents }: { agents: AgentPerformanceMetrics[] }) {
  const totalAnalyses = agents.reduce((sum, a) => sum + a.totalAnalyses, 0);
  const avgScore = agents.length > 0 
    ? agents.reduce((sum, a) => sum + a.averageScore, 0) / agents.length 
    : 0;
  const avgConsistency = agents.length > 0
    ? agents.reduce((sum, a) => sum + a.consistencyScore, 0) / agents.length
    : 0;
  
  const trendCounts = {
    improving: agents.filter(a => a.recentTrend === 'improving').length,
    stable: agents.filter(a => a.recentTrend === 'stable').length,
    declining: agents.filter(a => a.recentTrend === 'declining').length,
  };

  const healthScore = (avgScore / 10) * 0.4 + avgConsistency * 0.3 + 
    ((trendCounts.improving * 2 + trendCounts.stable) / (agents.length * 2)) * 0.3;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
    >
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm" data-testid="card-system-health">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <CardTitle>Salud del Sistema</CardTitle>
              <CardDescription>Métricas agregadas de todos los agentes</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 rounded-lg bg-muted/30">
              <div className="text-3xl font-bold text-primary" data-testid="text-total-analyses">
                {totalAnalyses}
              </div>
              <div className="text-xs text-muted-foreground mt-1">Análisis Totales</div>
            </div>
            
            <div className="text-center p-4 rounded-lg bg-muted/30">
              <div className="text-3xl font-bold text-foreground" data-testid="text-avg-score">
                {avgScore.toFixed(1)}
              </div>
              <div className="text-xs text-muted-foreground mt-1">Puntuación Promedio</div>
            </div>
            
            <div className="text-center p-4 rounded-lg bg-muted/30">
              <div className="text-3xl font-bold text-foreground" data-testid="text-avg-consistency">
                {(avgConsistency * 100).toFixed(0)}%
              </div>
              <div className="text-xs text-muted-foreground mt-1">Consistencia Promedio</div>
            </div>
            
            <div className="text-center p-4 rounded-lg bg-muted/30">
              <div className="text-3xl font-bold" data-testid="text-health-score">
                <span className={healthScore > 0.7 ? 'text-emerald-400' : healthScore > 0.4 ? 'text-yellow-400' : 'text-red-400'}>
                  {(healthScore * 100).toFixed(0)}%
                </span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">Índice de Salud</div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-border/30">
            <div className="flex items-center justify-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-sm text-muted-foreground">
                  Mejorando: <span className="font-medium text-foreground">{trendCounts.improving}</span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <span className="text-sm text-muted-foreground">
                  Estable: <span className="font-medium text-foreground">{trendCounts.stable}</span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-sm text-muted-foreground">
                  Declinando: <span className="font-medium text-foreground">{trendCounts.declining}</span>
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function PerformanceDashboard() {
  const { data, isLoading, error, refetch } = useQuery<PerformanceResponse>({
    queryKey: ['agent-performance'],
    queryFn: async () => {
      const response = await fetch('/api/autonomy/agent-performance');
      if (!response.ok) {
        throw new Error('Failed to fetch agent performance data');
      }
      return response.json();
    },
    refetchInterval: 30000,
  });

  return (
    <div className="min-h-screen bg-background bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-secondary via-background to-background p-6 md:p-12 font-sans">
      <motion.header 
        className="max-w-6xl mx-auto mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between mb-6">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2" data-testid="link-back-dashboard">
              <ArrowLeft className="w-4 h-4" />
              Volver al Dashboard
            </Button>
          </Link>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => refetch()}
            disabled={isLoading}
            data-testid="button-refresh-data"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Activity className="w-4 h-4" />}
            <span className="ml-2">Actualizar</span>
          </Button>
        </div>
        
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-mono tracking-wider uppercase">
            <Target className="w-3 h-3" />
            Monitoreo en Tiempo Real
          </div>
          <h1 className="text-3xl md:text-5xl font-display font-bold tracking-tight text-foreground">
            Centro de Monitoreo <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">
              de Agentes
            </span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Supervisa el rendimiento, consistencia y evolución de los agentes especializados en tiempo real.
          </p>
        </div>
      </motion.header>

      <div className="max-w-6xl mx-auto space-y-6">
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">Cargando métricas de rendimiento...</span>
          </div>
        )}

        {error && (
          <Card className="border-red-500/30 bg-red-500/5">
            <CardContent className="py-8 text-center">
              <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-red-400 mb-2">Error al cargar datos</h3>
              <p className="text-muted-foreground mb-4">No se pudieron obtener las métricas de rendimiento.</p>
              <Button variant="outline" onClick={() => refetch()} data-testid="button-retry">
                Reintentar
              </Button>
            </CardContent>
          </Card>
        )}

        {data?.success && data.agents && (
          <>
            <SystemHealthSection agents={data.agents} />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.agents.map((agent, index) => (
                <AgentCard key={agent.agentName} agent={agent} index={index} />
              ))}
            </div>
          </>
        )}

        {data?.success && (!data.agents || data.agents.length === 0) && (
          <Card className="border-border/50 bg-card/50">
            <CardContent className="py-12 text-center">
              <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Sin datos de rendimiento</h3>
              <p className="text-muted-foreground">
                Ejecuta análisis para comenzar a recopilar métricas de rendimiento de los agentes.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
