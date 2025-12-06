import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { 
  CheckCircle, 
  XCircle, 
  Play, 
  RefreshCw, 
  Database,
  Clock,
  Target,
  TrendingUp,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  ArrowLeft
} from "lucide-react";
import { Link } from "wouter";

interface ValidationRun {
  id: number;
  status: string;
  totalSites: number;
  passedSites: number;
  failedSites: number;
  defaultTolerance: number;
  initiatedBy: string | null;
  executedAt: string;
  completedAt: string | null;
}

interface CategoryResult {
  category: string;
  expectedMin: number;
  expectedMax: number;
  actualScore: number;
  tolerance: number;
  passed: boolean;
  deviation: number;
}

interface SiteResult {
  siteId: number;
  siteName: string;
  siteUrl: string;
  categories: CategoryResult[];
  overallPassed: boolean;
  overallScore?: number;
}

interface ValidationRunDetail {
  run: ValidationRun;
  results: SiteResult[];
}

interface GoldenSite {
  id: number;
  url: string;
  displayName: string;
  category: string;
  enabled: number;
}

const categoryLabels: Record<string, string> = {
  visual_design: "Visual Design",
  user_experience: "User Experience",
  content_quality: "Content Quality",
  technical_performance: "Technical Performance",
};

export default function ValidationDashboard() {
  const queryClient = useQueryClient();
  const [selectedRunId, setSelectedRunId] = useState<number | null>(null);
  const [expandedSites, setExpandedSites] = useState<Set<number>>(new Set());

  const { data: runsData, isLoading: runsLoading } = useQuery({
    queryKey: ["/api/validation/runs"],
    queryFn: async () => {
      const res = await fetch("/api/validation/runs?limit=10");
      return res.json();
    },
  });

  const { data: sitesData, isLoading: sitesLoading } = useQuery({
    queryKey: ["/api/validation/sites"],
    queryFn: async () => {
      const res = await fetch("/api/validation/sites?enabledOnly=false");
      return res.json();
    },
  });

  const { data: runDetailData, isLoading: runDetailLoading } = useQuery({
    queryKey: ["/api/validation/runs", selectedRunId],
    queryFn: async () => {
      if (!selectedRunId) return null;
      const res = await fetch(`/api/validation/runs/${selectedRunId}`);
      return res.json();
    },
    enabled: !!selectedRunId,
  });

  const runValidationMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/validation/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ initiatedBy: "dashboard" }),
      });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/validation/runs"] });
      if (data.run?.id) {
        setSelectedRunId(data.run.id);
      }
    },
  });

  const seedDatasetMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/validation/seed", {
        method: "POST",
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/validation/sites"] });
    },
  });

  const runs: ValidationRun[] = runsData?.runs || [];
  const sites: GoldenSite[] = sitesData?.sites || [];
  const runDetail: ValidationRunDetail | null = runDetailData?.run ? runDetailData : null;

  const toggleSiteExpand = (siteId: number) => {
    setExpandedSites(prev => {
      const newSet = new Set(prev);
      if (newSet.has(siteId)) {
        newSet.delete(siteId);
      } else {
        newSet.add(siteId);
      }
      return newSet;
    });
  };

  const latestRun = runs[0];
  const passRate = latestRun ? (latestRun.passedSites / latestRun.totalSites) * 100 : 0;

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <Link href="/" aria-label="Back to dashboard">
              <Button 
                variant="ghost" 
                size="sm" 
                className="min-h-[44px] w-fit"
                data-testid="button-back-home"
                aria-label="Back to dashboard"
              >
                <ArrowLeft className="h-4 w-4 mr-2" aria-hidden="true" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground font-display" data-testid="text-page-title">
                Golden Dataset Validation
              </h1>
              <p className="text-muted-foreground text-sm md:text-base">
                Automated regression testing for agent consistency
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              variant="outline"
              className="min-h-[44px]"
              onClick={() => seedDatasetMutation.mutate()}
              disabled={seedDatasetMutation.isPending}
              data-testid="button-seed-dataset"
              aria-label={seedDatasetMutation.isPending ? "Seeding dataset in progress" : "Seed the golden dataset with reference sites"}
            >
              <Database className="h-4 w-4 mr-2" aria-hidden="true" />
              {seedDatasetMutation.isPending ? "Seeding..." : "Seed Dataset"}
            </Button>
            <Button
              className="min-h-[44px]"
              onClick={() => runValidationMutation.mutate()}
              disabled={runValidationMutation.isPending}
              data-testid="button-run-validation"
              aria-label={runValidationMutation.isPending ? "Validation running" : "Start validation run against golden dataset"}
            >
              {runValidationMutation.isPending ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
                  Running...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" aria-hidden="true" />
                  Run Validation
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Golden Sites</p>
                  <p className="text-2xl font-bold" data-testid="text-total-sites">
                    {sitesLoading ? <Skeleton className="h-8 w-16" /> : sites.length}
                  </p>
                </div>
                <Target className="h-8 w-8 text-primary opacity-50" aria-hidden="true" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Runs</p>
                  <p className="text-2xl font-bold" data-testid="text-total-runs">
                    {runsLoading ? <Skeleton className="h-8 w-16" /> : runs.length}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-blue-500 opacity-50" aria-hidden="true" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Latest Status</p>
                  <div className="flex items-center gap-2">
                    {runsLoading ? (
                      <Skeleton className="h-8 w-20" />
                    ) : latestRun ? (
                      <Badge 
                        variant={latestRun.status === "passed" ? "default" : "destructive"}
                        className="text-lg px-3 py-1"
                        data-testid="badge-latest-status"
                        role="status"
                        aria-label={`Latest validation status: ${latestRun.status}`}
                      >
                        {latestRun.status.toUpperCase()}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">No runs yet</span>
                    )}
                  </div>
                </div>
                {latestRun?.status === "passed" ? (
                  <CheckCircle className="h-8 w-8 text-green-500" aria-hidden="true" />
                ) : latestRun?.status === "failed" ? (
                  <XCircle className="h-8 w-8 text-red-500" aria-hidden="true" />
                ) : (
                  <AlertTriangle className="h-8 w-8 text-yellow-500 opacity-50" aria-hidden="true" />
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pass Rate</p>
                  <p className="text-2xl font-bold" data-testid="text-pass-rate">
                    {runsLoading ? <Skeleton className="h-8 w-16" /> : latestRun ? `${passRate.toFixed(0)}%` : "N/A"}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500 opacity-50" aria-hidden="true" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Validation History</CardTitle>
              <CardDescription>Recent validation runs</CardDescription>
            </CardHeader>
            <CardContent>
              {runsLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : runs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No validation runs yet</p>
                  <p className="text-sm">Seed the dataset and run validation</p>
                </div>
              ) : (
                <div className="space-y-2" role="list" aria-label="Validation run history">
                  {runs.map((run) => (
                    <motion.button
                      key={run.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`w-full text-left p-3 rounded-lg border cursor-pointer transition-colors min-h-[44px] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                        selectedRunId === run.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                      onClick={() => setSelectedRunId(run.id)}
                      data-testid={`card-run-${run.id}`}
                      role="listitem"
                      aria-label={`Validation run ${run.id}, status: ${run.status}, ${run.passedSites} of ${run.totalSites} sites passed`}
                      aria-pressed={selectedRunId === run.id}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {run.status === "passed" ? (
                            <CheckCircle className="h-4 w-4 text-green-500" aria-hidden="true" />
                          ) : run.status === "failed" ? (
                            <XCircle className="h-4 w-4 text-red-500" aria-hidden="true" />
                          ) : (
                            <RefreshCw className="h-4 w-4 text-yellow-500 animate-spin" aria-hidden="true" />
                          )}
                          <span className="font-medium">Run #{run.id}</span>
                        </div>
                        <Badge 
                          variant={run.status === "passed" ? "default" : "destructive"}
                          role="status"
                          aria-label={`${run.passedSites} of ${run.totalSites} sites passed`}
                        >
                          {run.passedSites}/{run.totalSites}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(run.executedAt).toLocaleString()}
                      </p>
                    </motion.button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>
                {selectedRunId ? `Run #${selectedRunId} Details` : "Select a Run"}
              </CardTitle>
              <CardDescription>
                {runDetail ? (
                  <>
                    {runDetail.run.passedSites} of {runDetail.run.totalSites} sites passed 
                    (tolerance: ±{runDetail.run.defaultTolerance})
                  </>
                ) : (
                  "Click on a validation run to see detailed results"
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {runDetailLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-24 w-full" />
                  ))}
                </div>
              ) : !runDetail ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Target className="h-12 w-12 mx-auto mb-4 opacity-30" aria-hidden="true" />
                  <p>Select a validation run from the history</p>
                </div>
              ) : (
                <div className="space-y-4" role="list" aria-label="Site validation results">
                  {runDetail.results.map((site) => (
                    <motion.div
                      key={site.siteId}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="border rounded-lg overflow-hidden"
                      data-testid={`card-site-result-${site.siteId}`}
                      role="listitem"
                    >
                      <button
                        type="button"
                        className="w-full p-4 flex items-center justify-between cursor-pointer hover:bg-muted/50 min-h-[44px] focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary text-left"
                        onClick={() => toggleSiteExpand(site.siteId)}
                        aria-expanded={expandedSites.has(site.siteId)}
                        aria-controls={`site-details-${site.siteId}`}
                        aria-label={`${site.siteName}, ${site.overallPassed ? 'passed' : 'failed'}, ${site.categories.filter(c => c.passed).length} of ${site.categories.length} categories passed. Click to ${expandedSites.has(site.siteId) ? 'collapse' : 'expand'} details.`}
                      >
                        <div className="flex items-center gap-3">
                          {expandedSites.has(site.siteId) ? (
                            <ChevronDown className="h-4 w-4" aria-hidden="true" />
                          ) : (
                            <ChevronRight className="h-4 w-4" aria-hidden="true" />
                          )}
                          {site.overallPassed ? (
                            <CheckCircle className="h-5 w-5 text-green-500" aria-hidden="true" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-500" aria-hidden="true" />
                          )}
                          <div>
                            <p className="font-medium">{site.siteName}</p>
                            <p className="text-xs text-muted-foreground">{site.siteUrl}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {site.overallScore !== undefined && (
                            <span className="text-sm font-mono">
                              Score: {site.overallScore.toFixed(1)}
                            </span>
                          )}
                          <Badge 
                            variant={site.overallPassed ? "default" : "destructive"}
                            role="status"
                            aria-label={`${site.overallPassed ? 'Passed' : 'Failed'}: ${site.categories.filter(c => c.passed).length} of ${site.categories.length} categories`}
                          >
                            {site.categories.filter(c => c.passed).length}/{site.categories.length}
                          </Badge>
                        </div>
                      </button>
                      
                      {expandedSites.has(site.siteId) && (
                        <div 
                          id={`site-details-${site.siteId}`}
                          className="border-t bg-muted/30 p-4"
                          role="region"
                          aria-label={`Category details for ${site.siteName}`}
                        >
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {site.categories.map((cat) => (
                              <div
                                key={cat.category}
                                className={`p-3 rounded-lg border ${
                                  cat.passed
                                    ? "border-green-500/30 bg-green-500/5"
                                    : "border-red-500/30 bg-red-500/5"
                                }`}
                                data-testid={`category-${site.siteId}-${cat.category}`}
                                role="article"
                                aria-label={`${categoryLabels[cat.category] || cat.category}: ${cat.passed ? 'Passed' : 'Failed'}`}
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm font-medium">
                                    {categoryLabels[cat.category] || cat.category}
                                  </span>
                                  {cat.passed ? (
                                    <CheckCircle className="h-4 w-4 text-green-500" aria-hidden="true" />
                                  ) : (
                                    <XCircle className="h-4 w-4 text-red-500" aria-hidden="true" />
                                  )}
                                </div>
                                <dl className="text-sm space-y-1">
                                  <div className="flex justify-between">
                                    <dt className="text-muted-foreground">Actual:</dt>
                                    <dd className="font-mono">{cat.actualScore.toFixed(1)}</dd>
                                  </div>
                                  <div className="flex justify-between">
                                    <dt className="text-muted-foreground">Expected:</dt>
                                    <dd className="font-mono">{cat.expectedMin}-{cat.expectedMax}</dd>
                                  </div>
                                  {!cat.passed && (
                                    <div className="flex justify-between text-red-500">
                                      <dt>Deviation:</dt>
                                      <dd className="font-mono">±{cat.deviation.toFixed(1)}</dd>
                                    </div>
                                  )}
                                </dl>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Configured Golden Dataset Sites</CardTitle>
            <CardDescription>Reference websites used for validation testing</CardDescription>
          </CardHeader>
          <CardContent>
            {sitesLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : sites.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Database className="h-12 w-12 mx-auto mb-4 opacity-30" aria-hidden="true" />
                <p>No golden dataset sites configured</p>
                <p className="text-sm">Click "Seed Dataset" to add default sites</p>
              </div>
            ) : (
              <div 
                className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
                role="list"
                aria-label="Golden dataset sites"
              >
                {sites.map((site) => (
                  <div
                    key={site.id}
                    className={`p-4 rounded-lg border ${
                      site.enabled ? "border-border" : "border-border/50 opacity-50"
                    }`}
                    data-testid={`card-golden-site-${site.id}`}
                    role="listitem"
                    aria-label={`${site.displayName}, category: ${site.category}, ${site.enabled ? 'enabled' : 'disabled'}`}
                  >
                    <div className="flex items-center justify-between mb-2 gap-2">
                      <span className="font-medium truncate">{site.displayName}</span>
                      <Badge 
                        variant="outline" 
                        className="text-xs flex-shrink-0"
                        aria-label={`Category: ${site.category}`}
                      >
                        {site.category}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{site.url}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
