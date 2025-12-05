import { motion } from "framer-motion";
import { Report, SiteAnalysis } from "@/lib/mock-agent";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ExternalLink, TrendingUp, AlertTriangle, Award, CheckCircle2, BarChart3, FileText } from "lucide-react";
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
}

export function ReportView({ report }: ReportViewProps) {
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
              Analysis Complete
            </Badge>
            <span className="text-xs text-muted-foreground font-mono">{new Date().toISOString()}</span>
          </div>
          <h1 className="text-3xl font-display font-bold text-foreground">{report.report_title}</h1>
          <p className="text-muted-foreground mt-1">Comprehensive benchmarking for <span className="text-primary font-medium">{report.client_website_analysis.name}</span></p>
        </div>
        <div className="flex gap-3">
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Overall Score</p>
            <p className="text-3xl font-mono font-bold text-primary">{report.client_website_analysis.overall_score}/10</p>
          </div>
        </div>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px] mb-8 bg-muted/50">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="client">Client Deep Dive</TabsTrigger>
          <TabsTrigger value="competitors">Competitors</TabsTrigger>
        </TabsList>

        {/* OVERVIEW TAB */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Comparison Chart */}
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  Benchmark Comparison
                </CardTitle>
                <CardDescription>Relative performance across all analyzed sites</CardDescription>
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
                  Executive Summary
                </CardTitle>
                <CardDescription>Top-level insights and strategic opportunities</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-emerald-400">Key Strengths</h4>
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
                  <h4 className="text-sm font-medium text-red-400">Critical Gaps</h4>
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
                <CardTitle className="text-red-400 text-base">High Priority</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  {report.recommendations.high_priority.map((rec, i) => <li key={i}>{rec}</li>)}
                </ul>
              </CardContent>
            </Card>
            <Card className="bg-amber-950/10 border-amber-900/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-amber-400 text-base">Medium Priority</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  {report.recommendations.medium_priority.map((rec, i) => <li key={i}>{rec}</li>)}
                </ul>
              </CardContent>
            </Card>
            <Card className="bg-blue-950/10 border-blue-900/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-blue-400 text-base">Opportunities</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  {report.recommendations.innovative_opportunities.map((rec, i) => <li key={i}>{rec}</li>)}
                </ul>
              </CardContent>
            </Card>
          </div>
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
      </Tabs>
    </motion.div>
  );
}

function SiteDetailView({ site }: { site: SiteAnalysis }) {
  const radarData = [
    { subject: 'Visual', A: site.visual_design.score, fullMark: 10 },
    { subject: 'UX', A: site.user_experience.score, fullMark: 10 },
    { subject: 'Content', A: site.content_quality.score, fullMark: 10 },
    { subject: 'Tech', A: site.technical_performance.score, fullMark: 10 },
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
                <div className="text-xs text-muted-foreground">Content</div>
                <div className="font-mono font-bold text-foreground">{site.content_quality.score}</div>
              </div>
              <div className="text-center p-2 bg-muted/30 rounded">
                <div className="text-xs text-muted-foreground">Tech</div>
                <div className="font-mono font-bold text-foreground">{site.technical_performance.score}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
             <CardTitle className="text-sm">Quick Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Load Time (Est.)</span>
              <span className="font-mono">0.{Math.floor(Math.random() * 8 + 2)}s</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Mobile Friendly</span>
              <span className="text-emerald-400">Yes</span>
            </div>
             <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Accessibility</span>
              <span className="text-amber-400">AA</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Col: Detailed Text Analysis */}
      <div className="col-span-1 lg:col-span-2 space-y-4">
        <AnalysisSectionCard title="Visual Design" data={site.visual_design} />
        <AnalysisSectionCard title="User Experience" data={site.user_experience} />
        <AnalysisSectionCard title="Content Strategy" data={site.content_quality} />
        <AnalysisSectionCard title="Technical Performance" data={site.technical_performance} />
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
          Score: {data.score}
        </Badge>
      </div>
      <CardContent className="p-6 space-y-4">
        <p className="text-sm text-muted-foreground italic">"{data.observations}"</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h5 className="text-xs font-bold text-emerald-500 uppercase mb-2">Strengths</h5>
            <ul className="space-y-1">
              {data.strengths.map((s, i) => (
                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-emerald-500/50">•</span> {s}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h5 className="text-xs font-bold text-red-500 uppercase mb-2">Weaknesses</h5>
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
