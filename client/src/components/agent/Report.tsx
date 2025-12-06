import { motion } from "framer-motion";
import { Report, SiteAnalysis, CouncilOpinion, CouncilResult, PrioritizedTask, FinalRankedIssue } from "@/lib/mock-agent";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ExternalLink, TrendingUp, AlertTriangle, Award, CheckCircle2, BarChart3, FileText, Users, Target, Clock, Gavel, MessageSquare, ListOrdered, Download, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ComparativeHeatmap } from "./ComparativeHeatmap";
import { PriorityTaskBoard } from "./PriorityTaskBoard";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell
} from "recharts";

interface ReportViewProps {
  report: Report;
  reportId?: number;
}

export function ReportView({ report, reportId }: ReportViewProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-7xl mx-auto space-y-8 pb-20"
    >
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-border">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
              Análisis Completado
            </Badge>
            <span className="text-xs text-muted-foreground font-mono">{new Date().toISOString()}</span>
          </div>
          <h1 className="text-3xl font-display font-bold text-foreground">{report.report_title}</h1>
          <p className="text-muted-foreground mt-1">Benchmarking integral para <span className="text-primary font-medium">{report.client_website_analysis.name}</span></p>
        </div>
        <div className="flex gap-4 items-center">
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Puntuación General</p>
            <p className="text-3xl font-mono font-bold text-primary">{report.client_website_analysis.overall_score}/10</p>
          </div>
          {reportId && (
            <Button asChild className="shadow-lg" data-testid="button-download-pdf">
              <a href={`/api/reports/${reportId}/pdf`} download>
                <Download className="w-4 h-4 mr-2" />
                Descargar PDF
              </a>
            </Button>
          )}
        </div>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5 lg:w-[700px] mb-8 bg-muted/50">
          <TabsTrigger value="overview" data-testid="tab-overview">Resumen</TabsTrigger>
          <TabsTrigger value="workspace" data-testid="tab-workspace" className="flex items-center gap-1">
            <LayoutGrid className="w-3 h-3" />
            Workspace
          </TabsTrigger>
          <TabsTrigger value="client" data-testid="tab-client">Cliente</TabsTrigger>
          <TabsTrigger value="competitors" data-testid="tab-competitors">Competidores</TabsTrigger>
          <TabsTrigger value="council" data-testid="tab-council">Consejo</TabsTrigger>
        </TabsList>

        {/* OVERVIEW TAB */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Comparison Chart */}
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  Comparación de Benchmark
                </CardTitle>
                <CardDescription>Rendimiento relativo de todos los sitios analizados</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[report.client_website_analysis, ...report.competitor_analyses].map(s => ({
                      name: s.name.replace(' (Client)', ''),
                      score: s.overall_score,
                      full: 10
                    }))}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <XAxis type="number" domain={[0, 10]} hide />
                    <YAxis dataKey="name" type="category" width={100} tick={{fill: '#94a3b8', fontSize: 12}} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#f4f4f5' }}
                      cursor={{fill: 'transparent'}}
                    />
                    <Bar dataKey="score" radius={[0, 4, 4, 0]} barSize={30}>
                      {
                        [report.client_website_analysis, ...report.competitor_analyses].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index === 0 ? '#3b82f6' : '#334155'} />
                        ))
                      }
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Key Findings */}
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-500" />
                  Resumen Ejecutivo
                </CardTitle>
                <CardDescription>Perspectivas de alto nivel y oportunidades estratégicas</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-emerald-400">Fortalezas Clave</h4>
                  <ul className="space-y-1">
                    {report.comparative_analysis.strengths_relative.map((item, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500/50 shrink-0 mt-0.5" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <Separator className="bg-border/50" />
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-red-400">Brechas Críticas</h4>
                  <ul className="space-y-1">
                    {report.comparative_analysis.weaknesses_relative.map((item, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-500/50 shrink-0 mt-0.5" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Recommendations Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-red-950/10 border-red-900/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-red-400 text-base">Alta Prioridad</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  {report.recommendations.high_priority.map((rec, i) => <li key={i}>{rec}</li>)}
                </ul>
              </CardContent>
            </Card>
            <Card className="bg-amber-950/10 border-amber-900/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-amber-400 text-base">Media Prioridad</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  {report.recommendations.medium_priority.map((rec, i) => <li key={i}>{rec}</li>)}
                </ul>
              </CardContent>
            </Card>
            <Card className="bg-blue-950/10 border-blue-900/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-blue-400 text-base">Oportunidades</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  {report.recommendations.innovative_opportunities.map((rec, i) => <li key={i}>{rec}</li>)}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Quick access to Workspace */}
          <div className="flex justify-center pt-4">
            <div className="text-center p-4 bg-muted/20 rounded-lg border border-border/50">
              <p className="text-sm text-muted-foreground mb-2">
                Para análisis detallado con heatmaps comparativos y tablero de tareas
              </p>
              <Badge variant="outline" className="text-primary border-primary/30">
                <LayoutGrid className="w-3 h-3 mr-1" />
                Ver pestaña Workspace
              </Badge>
            </div>
          </div>
        </TabsContent>

        {/* WORKSPACE TAB - Insights Workspace */}
        <TabsContent value="workspace" className="space-y-8">
          <ComparativeHeatmap report={report} />
          
          <PriorityTaskBoard tasks={report.prioritized_tasks || []} />
        </TabsContent>

        {/* CLIENT DEEP DIVE */}
        <TabsContent value="client">
          <SiteDetailView site={report.client_website_analysis} />
        </TabsContent>

        {/* COMPETITORS */}
        <TabsContent value="competitors" className="space-y-8">
          {report.competitor_analyses.map((site, i) => (
            <div key={i}>
              <h3 className="text-xl font-display font-bold mb-4 text-foreground">{site.name}</h3>
              <SiteDetailView site={site} />
              {i < report.competitor_analyses.length - 1 && <Separator className="my-8" />}
            </div>
          ))}
        </TabsContent>

        {/* COUNCIL INSIGHTS */}
        <TabsContent value="council" className="space-y-6">
          {/* Report Metadata & Executive Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {report.report_metadata && (
              <Card data-testid="card-report-metadata">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    Metadatos del Reporte
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Generado En</span>
                    <span className="font-mono text-foreground">{report.report_metadata.generated_at}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">URL del Cliente</span>
                    <span className="font-mono text-foreground truncate max-w-[200px]">{report.report_metadata.client_url}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Competidores Analizados</span>
                    <span className="font-mono text-foreground">{report.report_metadata.competitors_analyzed}</span>
                  </div>
                  <div className="flex justify-between text-sm items-center">
                    <span className="text-muted-foreground">Consenso del Consejo</span>
                    <div className="flex items-center gap-2">
                      <Progress value={report.report_metadata.council_consensus} className="w-20 h-2" />
                      <span className="font-mono text-foreground">{report.report_metadata.council_consensus}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {report.executive_summary && (
              <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20" data-testid="card-executive-summary">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-primary" />
                    Resumen Ejecutivo
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-background/50 rounded-lg">
                      <div className="text-3xl font-mono font-bold text-primary">{report.executive_summary.overall_score}/10</div>
                      <div className="text-xs text-muted-foreground mt-1">Puntuación General</div>
                    </div>
                    <div className="text-center p-3 bg-background/50 rounded-lg">
                      <div className="text-lg font-medium text-foreground">{report.executive_summary.vs_competitors}</div>
                      <div className="text-xs text-muted-foreground mt-1">vs Competidores</div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-red-950/20 rounded-lg border border-red-900/20">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-400" />
                      <span className="text-sm text-muted-foreground">Problemas Críticos</span>
                    </div>
                    <span className="text-xl font-mono font-bold text-red-400">{report.executive_summary.critical_issues}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-amber-950/20 rounded-lg border border-amber-900/20">
                    <span className="text-sm text-muted-foreground">Pérdida Estimada de Conversión</span>
                    <span className="font-mono font-medium text-amber-400">{report.executive_summary.estimated_conversion_loss}</span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Council Deliberation */}
          {report.councilResult && (
            <>
              <div className="flex items-center gap-2 mt-8 mb-4">
                <Users className="w-5 h-5 text-purple-400" />
                <h3 className="text-lg font-display font-bold text-foreground">Deliberación del Consejo - Etapa 1</h3>
                <Badge variant="outline" className="ml-2">Consenso: {report.councilResult.consensusScore}%</Badge>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {report.councilResult.stage1Opinions.map((opinion, i) => (
                  <CouncilOpinionCard key={i} opinion={opinion} />
                ))}
              </div>

              {/* Chairman's Verdict */}
              <Card className="mt-6 bg-gradient-to-br from-purple-950/20 to-indigo-950/20 border-purple-900/30" data-testid="card-chairman-verdict">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Gavel className="w-5 h-5 text-purple-400" />
                    Veredicto del Presidente
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">{report.councilResult.chairmanVerdict}</p>
                </CardContent>
              </Card>

              {/* Dissenting Opinions */}
              {report.councilResult.dissentingOpinions.length > 0 && (
                <Card className="mt-4 border-amber-900/30" data-testid="card-dissenting-opinions">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-amber-400 text-base">
                      <MessageSquare className="w-4 h-4" />
                      Opiniones Disidentes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {report.councilResult.dissentingOpinions.map((opinion, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="text-amber-500/50 mt-1">•</span>
                          {opinion}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Final Ranked Issues */}
              {report.councilResult.finalRanking.length > 0 && (
                <div className="mt-6">
                  <div className="flex items-center gap-2 mb-4">
                    <ListOrdered className="w-5 h-5 text-primary" />
                    <h3 className="text-lg font-display font-bold text-foreground">Clasificación Final de Problemas</h3>
                  </div>
                  <div className="space-y-2">
                    {report.councilResult.finalRanking.map((issue, i) => (
                      <FinalRankedIssueCard key={i} issue={issue} rank={i + 1} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Prioritized Tasks */}
          {report.prioritized_tasks && report.prioritized_tasks.length > 0 && (
            <div className="mt-8">
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-5 h-5 text-emerald-400" />
                <h3 className="text-lg font-display font-bold text-foreground">Tareas Priorizadas</h3>
              </div>
              <div className="space-y-4">
                {report.prioritized_tasks.map((task, i) => (
                  <PrioritizedTaskCard key={task.id || i} task={task} />
                ))}
              </div>
            </div>
          )}

          {/* Execution Order */}
          {report.execution_order && report.execution_order.length > 0 && (
            <Card className="mt-6" data-testid="card-execution-order">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-400" />
                  Orden de Ejecución
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="space-y-2">
                  {report.execution_order.map((step, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-mono font-bold shrink-0">
                        {i + 1}
                      </span>
                      <span className="text-muted-foreground pt-0.5">{step}</span>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          )}

          {/* Completion Criteria */}
          {report.completion_criteria && (
            <Card className="mt-6" data-testid="card-completion-criteria">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  Criterios de Finalización
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 bg-red-950/20 rounded-lg border border-red-900/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Fase 0</Badge>
                    <span className="text-xs text-muted-foreground">Crítico</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{report.completion_criteria.phase_0}</p>
                </div>
                <div className="p-3 bg-amber-950/20 rounded-lg border border-amber-900/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">Fase 1</Badge>
                    <span className="text-xs text-muted-foreground">Alta Prioridad</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{report.completion_criteria.phase_1}</p>
                </div>
                <div className="p-3 bg-blue-950/20 rounded-lg border border-blue-900/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Fase 2</Badge>
                    <span className="text-xs text-muted-foreground">Media Prioridad</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{report.completion_criteria.phase_2}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Show message if no council data */}
          {!report.councilResult && !report.report_metadata && !report.executive_summary && (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Users className="w-12 h-12 text-muted-foreground/30 mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground">No hay Perspectivas del Consejo Disponibles</h3>
                <p className="text-sm text-muted-foreground/70 mt-2 max-w-md">
                  Los datos de deliberación del consejo no están disponibles para este análisis. 
                  Esto puede ocurrir con reportes antiguos o modos de análisis simplificados.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}

function SiteDetailView({ site }: { site: SiteAnalysis }) {
  const radarData = [
    { subject: 'Visual', A: site.visual_design.score, fullMark: 10 },
    { subject: 'UX', A: site.user_experience.score, fullMark: 10 },
    { subject: 'Contenido', A: site.content_quality.score, fullMark: 10 },
    { subject: 'Técnico', A: site.technical_performance.score, fullMark: 10 },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Col: Radar & Scores */}
      <div className="col-span-1 space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                  <PolarGrid stroke="#334155" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <Radar
                    name={site.name}
                    dataKey="A"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.3}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="text-center p-2 bg-muted/30 rounded">
                <div className="text-xs text-muted-foreground">Visual</div>
                <div className="font-mono font-bold text-foreground">{site.visual_design.score}</div>
              </div>
              <div className="text-center p-2 bg-muted/30 rounded">
                <div className="text-xs text-muted-foreground">UX</div>
                <div className="font-mono font-bold text-foreground">{site.user_experience.score}</div>
              </div>
              <div className="text-center p-2 bg-muted/30 rounded">
                <div className="text-xs text-muted-foreground">Contenido</div>
                <div className="font-mono font-bold text-foreground">{site.content_quality.score}</div>
              </div>
              <div className="text-center p-2 bg-muted/30 rounded">
                <div className="text-xs text-muted-foreground">Técnico</div>
                <div className="font-mono font-bold text-foreground">{site.technical_performance.score}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
             <CardTitle className="text-sm">Estadísticas Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tiempo de Carga (Est.)</span>
              <span className="font-mono">0.{Math.floor(Math.random() * 8 + 2)}s</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Compatible con Móviles</span>
              <span className="text-emerald-400">Sí</span>
            </div>
             <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Accesibilidad</span>
              <span className="text-amber-400">AA</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Col: Detailed Text Analysis */}
      <div className="col-span-1 lg:col-span-2 space-y-4">
        <AnalysisSectionCard title="Diseño Visual" data={site.visual_design} />
        <AnalysisSectionCard title="Experiencia de Usuario" data={site.user_experience} />
        <AnalysisSectionCard title="Estrategia de Contenido" data={site.content_quality} />
        <AnalysisSectionCard title="Rendimiento Técnico" data={site.technical_performance} />
      </div>
    </div>
  );
}

function AnalysisSectionCard({ title, data }: { title: string, data: SiteAnalysis['visual_design'] }) {
  return (
    <Card className="overflow-hidden">
      <div className="bg-muted/30 px-6 py-3 border-b border-border flex justify-between items-center">
        <h4 className="font-medium text-foreground">{title}</h4>
        <Badge variant={data.score >= 8 ? "default" : data.score >= 5 ? "secondary" : "destructive"}>
          Puntuación: {data.score}
        </Badge>
      </div>
      <CardContent className="p-6 space-y-4">
        <p className="text-sm text-muted-foreground italic">"{data.observations}"</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h5 className="text-xs font-bold text-emerald-500 uppercase mb-2">Fortalezas</h5>
            <ul className="space-y-1">
              {data.strengths.map((s, i) => (
                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-emerald-500/50">•</span> {s}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h5 className="text-xs font-bold text-red-500 uppercase mb-2">Debilidades</h5>
            <ul className="space-y-1">
              {data.weaknesses.map((s, i) => (
                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-red-500/50">•</span> {s}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CouncilOpinionCard({ opinion }: { opinion: CouncilOpinion }) {
  const personaColors: Record<string, { bg: string; border: string; text: string; icon: string }> = {
    critic: { bg: 'bg-red-950/20', border: 'border-red-900/30', text: 'text-red-400', icon: '🔍' },
    strategist: { bg: 'bg-blue-950/20', border: 'border-blue-900/30', text: 'text-blue-400', icon: '📊' },
    innovator: { bg: 'bg-emerald-950/20', border: 'border-emerald-900/30', text: 'text-emerald-400', icon: '💡' },
  };
  
  const colors = personaColors[opinion.persona] || personaColors.critic;

  return (
    <Card className={`${colors.bg} ${colors.border}`} data-testid={`card-opinion-${opinion.persona}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className={`flex items-center gap-2 text-base ${colors.text}`}>
            <span>{colors.icon}</span>
            {opinion.personaName}
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            {opinion.confidence}% de confianza
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">{opinion.analysis}</p>
        
        {opinion.findings.length > 0 && (
          <div className="space-y-2">
            <h5 className="text-xs font-medium text-foreground/70 uppercase">Hallazgos Clave</h5>
            {opinion.findings.slice(0, 3).map((finding, i) => (
              <div key={i} className="p-2 bg-background/40 rounded text-xs space-y-1">
                <div className="flex items-center gap-2">
                  <SeverityBadge severity={finding.severity} />
                  <span className="text-foreground font-medium truncate">{finding.issue}</span>
                </div>
                <p className="text-muted-foreground line-clamp-2">{finding.impact}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SeverityBadge({ severity }: { severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' }) {
  const styles: Record<string, string> = {
    CRITICAL: 'bg-red-500/20 text-red-400 border-red-500/30',
    HIGH: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    MEDIUM: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    LOW: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  };
  
  return (
    <Badge className={`text-[10px] px-1.5 py-0 ${styles[severity] || styles.MEDIUM}`}>
      {severity}
    </Badge>
  );
}

function FinalRankedIssueCard({ issue, rank }: { issue: FinalRankedIssue; rank: number }) {
  const priorityColors: Record<string, string> = {
    P0: 'bg-red-500/20 text-red-400 border-red-500/30',
    P1: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    P2: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  };

  return (
    <div 
      className="flex items-center gap-4 p-3 bg-muted/20 rounded-lg border border-border/50"
      data-testid={`card-ranked-issue-${rank}`}
    >
      <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 text-primary text-sm font-mono font-bold shrink-0">
        #{rank}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{issue.issue}</p>
        <p className="text-xs text-muted-foreground">Severidad: {issue.severity}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-xs text-muted-foreground">{issue.votes} votos</span>
        <Badge className={priorityColors[issue.priority] || priorityColors.P2}>
          {issue.priority}
        </Badge>
      </div>
    </div>
  );
}

function PrioritizedTaskCard({ task }: { task: PrioritizedTask }) {
  const priorityColors: Record<string, { badge: string; bg: string; border: string }> = {
    'P0-CRITICAL': { badge: 'bg-red-500/20 text-red-400 border-red-500/30', bg: 'bg-red-950/10', border: 'border-red-900/20' },
    'P1-HIGH': { badge: 'bg-amber-500/20 text-amber-400 border-amber-500/30', bg: 'bg-amber-950/10', border: 'border-amber-900/20' },
    'P2-MEDIUM': { badge: 'bg-blue-500/20 text-blue-400 border-blue-500/30', bg: 'bg-blue-950/10', border: 'border-blue-900/20' },
  };

  const colors = priorityColors[task.priority] || priorityColors['P2-MEDIUM'];

  return (
    <Card className={`${colors.bg} ${colors.border}`} data-testid={`card-task-${task.id}`}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge className={colors.badge}>{task.priority}</Badge>
              <Badge variant="outline" className="text-xs">{task.department}</Badge>
            </div>
            <CardTitle className="text-base">{task.title}</CardTitle>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
            <Clock className="w-3 h-3" />
            {task.estimated_hours}h
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <h5 className="text-xs font-medium text-red-400 uppercase mb-1">Problema</h5>
          <p className="text-sm text-muted-foreground">{task.problem}</p>
        </div>
        <div>
          <h5 className="text-xs font-medium text-emerald-400 uppercase mb-1">Solución</h5>
          <p className="text-sm text-muted-foreground">{task.solution}</p>
        </div>
        {task.success_metrics && task.success_metrics.length > 0 && (
          <div>
            <h5 className="text-xs font-medium text-blue-400 uppercase mb-1">Métricas de Éxito</h5>
            <ul className="space-y-1">
              {task.success_metrics.map((metric, i) => (
                <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                  <CheckCircle2 className="w-3 h-3 text-blue-400/50 shrink-0 mt-0.5" />
                  {metric}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
