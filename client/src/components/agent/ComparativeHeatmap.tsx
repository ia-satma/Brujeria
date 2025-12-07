import { useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import type { Report, SiteAnalysis } from "@/lib/mock-agent";
import { Grid3X3, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface HeatmapCell {
  site: string;
  dimension: string;
  score: number;
  isClient: boolean;
}

interface ComparativeHeatmapProps {
  report: Report;
}

const DIMENSIONS = [
  { key: "visual_design", label: "Visual", shortLabel: "VIS" },
  { key: "user_experience", label: "UX", shortLabel: "UX" },
  { key: "content_quality", label: "Content", shortLabel: "CNT" },
  { key: "technical_performance", label: "Technical", shortLabel: "TCH" },
  { key: "overall_score", label: "Overall", shortLabel: "ALL" },
] as const;

function getScoreColor(score: number): string {
  if (score >= 8.5) return "bg-emerald-500";
  if (score >= 7.5) return "bg-emerald-400";
  if (score >= 6.5) return "bg-amber-400";
  if (score >= 5.5) return "bg-amber-500";
  if (score >= 4.5) return "bg-orange-500";
  return "bg-red-500";
}

function getScoreTextColor(score: number): string {
  if (score >= 8.5) return "text-emerald-500";
  if (score >= 7.5) return "text-emerald-400";
  if (score >= 6.5) return "text-amber-400";
  if (score >= 5.5) return "text-amber-500";
  if (score >= 4.5) return "text-orange-500";
  return "text-red-500";
}

function getScoreFromAnalysis(site: SiteAnalysis, dimension: string): number {
  if (dimension === "overall_score") return site.overall_score;
  const section = site[dimension as keyof SiteAnalysis];
  if (typeof section === "object" && section !== null && "score" in section) {
    return (section as { score: number }).score;
  }
  return 0;
}

function buildScoreMatrix(report: Report): HeatmapCell[][] {
  const allSites = [report.client_website_analysis, ...report.competitor_analyses];
  
  return allSites.map((site) => {
    const isClient = site.name.includes("(Client)");
    return DIMENSIONS.map((dim) => ({
      site: site.name.replace(" (Client)", ""),
      dimension: dim.label,
      score: getScoreFromAnalysis(site, dim.key),
      isClient,
    }));
  });
}

function ComparisonIndicator({ clientScore, competitorScore }: { clientScore: number; competitorScore: number }) {
  const diff = clientScore - competitorScore;
  
  if (Math.abs(diff) < 0.3) {
    return <Minus className="w-3 h-3 text-muted-foreground" />;
  }
  
  if (diff > 0) {
    return <TrendingUp className="w-3 h-3 text-emerald-500" />;
  }
  
  return <TrendingDown className="w-3 h-3 text-red-500" />;
}

export function ComparativeHeatmap({ report }: ComparativeHeatmapProps) {
  const matrix = useMemo(() => buildScoreMatrix(report), [report]);
  const allSites = useMemo(() => [report.client_website_analysis, ...report.competitor_analyses], [report]);
  
  const clientScores = useMemo(() => {
    const client = report.client_website_analysis;
    return DIMENSIONS.reduce((acc, dim) => {
      acc[dim.label] = getScoreFromAnalysis(client, dim.key);
      return acc;
    }, {} as Record<string, number>);
  }, [report]);

  const avgScores = useMemo(() => {
    return DIMENSIONS.reduce((acc, dim) => {
      const scores = allSites.map(site => getScoreFromAnalysis(site, dim.key));
      acc[dim.label] = scores.reduce((a, b) => a + b, 0) / scores.length;
      return acc;
    }, {} as Record<string, number>);
  }, [allSites]);

  return (
    <Card className="w-full" data-testid="card-comparative-heatmap">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Grid3X3 className="w-5 h-5 text-primary" />
          Comparative Heatmap
        </CardTitle>
        <CardDescription>
          Visual comparison of scores across all analyzed websites
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <TooltipProvider>
            <div className="overflow-x-auto">
              <div className="min-w-[600px]">
                <div className="grid gap-1" style={{ gridTemplateColumns: `180px repeat(${DIMENSIONS.length}, 1fr)` }}>
                  <div className="p-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Website
                  </div>
                  {DIMENSIONS.map((dim) => (
                    <div
                      key={dim.key}
                      className="p-2 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider"
                    >
                      <span className="hidden sm:inline">{dim.label}</span>
                      <span className="sm:hidden">{dim.shortLabel}</span>
                    </div>
                  ))}

                  {matrix.map((row, rowIndex) => (
                    <motion.div
                      key={rowIndex}
                      className="contents"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: rowIndex * 0.1 }}
                    >
                      <div className={`p-2 flex items-center gap-2 ${row[0].isClient ? 'bg-primary/5 rounded-l-lg' : ''}`}>
                        <span className="text-sm font-medium truncate" title={row[0].site}>
                          {row[0].site}
                        </span>
                        {row[0].isClient && (
                          <Badge variant="outline" className="text-[10px] px-1 py-0 bg-primary/10 text-primary border-primary/20">
                            YOU
                          </Badge>
                        )}
                      </div>
                      
                      {row.map((cell, colIndex) => (
                        <Tooltip key={colIndex}>
                          <TooltipTrigger asChild>
                            <div
                              className={`p-2 flex items-center justify-center ${cell.isClient ? (colIndex === row.length - 1 ? 'bg-primary/5 rounded-r-lg' : 'bg-primary/5') : ''}`}
                              data-testid={`heatmap-cell-${rowIndex}-${colIndex}`}
                            >
                              <motion.div
                                className={`w-12 h-10 rounded-md flex items-center justify-center font-mono font-bold text-sm ${getScoreColor(cell.score)} text-white shadow-sm`}
                                whileHover={{ scale: 1.05 }}
                                transition={{ type: "spring", stiffness: 300 }}
                              >
                                {cell.score.toFixed(1)}
                              </motion.div>
                              {!cell.isClient && colIndex < row.length - 1 && (
                                <div className="ml-1">
                                  <ComparisonIndicator 
                                    clientScore={clientScores[cell.dimension]} 
                                    competitorScore={cell.score} 
                                  />
                                </div>
                              )}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="bg-popover border border-border">
                            <div className="text-xs space-y-1">
                              <p className="font-medium">{cell.site} - {cell.dimension}</p>
                              <p className={`font-mono ${getScoreTextColor(cell.score)}`}>
                                Score: {cell.score.toFixed(1)}/10
                              </p>
                              {!cell.isClient && (
                                <p className="text-muted-foreground">
                                  vs Client: {(clientScores[cell.dimension] - cell.score).toFixed(1)}
                                </p>
                              )}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      ))}
                    </motion.div>
                  ))}

                  <div className="p-2 flex items-center gap-2 border-t border-border mt-2 pt-3">
                    <span className="text-sm font-medium text-muted-foreground">Average</span>
                  </div>
                  {DIMENSIONS.map((dim) => (
                    <div
                      key={`avg-${dim.key}`}
                      className="p-2 flex items-center justify-center border-t border-border mt-2 pt-3"
                    >
                      <div className={`px-3 py-1 rounded text-sm font-mono ${getScoreTextColor(avgScores[dim.label])} bg-muted/30`}>
                        {avgScores[dim.label].toFixed(1)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TooltipProvider>

          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 pt-4 border-t border-border">
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs text-muted-foreground">
              <span className="w-full text-center sm:w-auto">Score Legend:</span>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 sm:w-4 sm:h-4 rounded bg-emerald-500" />
                <span>8.5+</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 sm:w-4 sm:h-4 rounded bg-emerald-400" />
                <span>7.5-8.4</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 sm:w-4 sm:h-4 rounded bg-amber-400" />
                <span>6.5-7.4</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 sm:w-4 sm:h-4 rounded bg-amber-500" />
                <span>5.5-6.4</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 sm:w-4 sm:h-4 rounded bg-red-500" />
                <span>&lt;5.5</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
