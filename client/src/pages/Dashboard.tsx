import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Share2, Activity, Book } from "lucide-react";
import { Link as WouterLink } from "wouter";
import { Button } from "@/components/ui/button";
import { ReportView } from "@/components/agent/Report";
import { IntakeWizard } from "@/components/intake/IntakeWizard";
import { AnalysisConsole } from "@/components/agent/AnalysisConsole";
import type { Report } from "@/lib/mock-agent";

const stateAnnouncements = {
  input: "Ready to start a new web analysis. Please enter the URLs to analyze.",
  processing: "Analysis in progress. Please wait while our agents analyze the websites.",
  report: "Analysis complete. Report is now available for review.",
};

export default function Dashboard() {
  const [step, setStep] = useState<"input" | "processing" | "report">("input");
  const [logs, setLogs] = useState<string[]>([]);
  const [report, setReport] = useState<Report | null>(null);
  const [reportId, setReportId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState<string>("");

  useEffect(() => {
    setAnnouncement(stateAnnouncements[step]);
  }, [step]);

  const handleStartAnalysis = async (clientUrl: string, competitorUrls: string[]) => {
    setStep("processing");
    setLogs([]);
    setError(null);

    try {
      const response = await fetch('/api/analyze-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientUrl, competitorUrls }),
      });

      if (!response.ok) {
        throw new Error('Analysis request failed');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response stream');
      }

      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const jsonStr = line.slice(6);
              const data = JSON.parse(jsonStr);

              if (data.type === 'log') {
                setLogs(prev => [...prev, data.message]);
              } else if (data.type === 'complete') {
                setReport(data.report);
                if (data.reportId) {
                  setReportId(data.reportId);
                }
                await new Promise(r => setTimeout(r, 1000));
                setStep("report");
              } else if (data.type === 'error') {
                setError(data.message);
                setLogs(prev => [...prev, `[ERROR FATAL] ${data.message}`]);
              }
            } catch (parseError) {
              console.warn('Failed to parse SSE data:', parseError);
            }
          }
        }
      }
    } catch (err) {
      console.error('Analysis error:', err);
      setError('Error completing the analysis. Please try again.');
      setLogs(prev => [...prev, "[ERROR FATAL] Analysis failed. Please check the URLs and try again."]);
    }
  };

  const reset = () => {
    setStep("input");
    setReport(null);
    setReportId(null);
    setLogs([]);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-background bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-secondary via-background to-background px-4 py-6 md:p-12 font-sans">
      <div 
        role="status" 
        aria-live="polite" 
        aria-atomic="true" 
        className="sr-only"
      >
        {announcement}
      </div>

      <motion.header
        className="max-w-4xl mx-auto mb-8 md:mb-12 text-center space-y-4"
        animate={{ opacity: step === "report" ? 0 : 1, height: step === "report" ? 0 : "auto", overflow: "hidden" }}
        role="banner"
      >
        <nav className="flex justify-center sm:justify-end gap-2 mb-4" aria-label="Dashboard navigation">
          <WouterLink 
            href="/guide"
            aria-label="Go to User Guide to learn how to use the application"
          >
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2 min-h-[44px] min-w-[44px] focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2" 
              data-testid="link-user-guide"
              aria-label="User Guide - Learn how to use the application"
            >
              <Book className="w-4 h-4" aria-hidden="true" />
              <span className="hidden sm:inline">Guide</span>
            </Button>
          </WouterLink>
          <WouterLink 
            href="/performance"
            aria-label="Go to Agent Monitoring dashboard to view agent performance metrics"
          >
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2 min-h-[44px] min-w-[44px] focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2" 
              data-testid="link-performance-dashboard"
              aria-label="Agent Monitoring - View performance dashboard"
            >
              <Activity className="w-4 h-4" aria-hidden="true" />
              <span className="hidden sm:inline">Agent Monitoring</span>
            </Button>
          </WouterLink>
        </nav>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-mono tracking-wider uppercase">
          <Share2 className="w-3 h-3" aria-hidden="true" />
          <span>Multi-Agent System v2.0</span>
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-6xl font-display font-bold tracking-tight text-foreground">
          Web Analysis <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">Hyperspecialized</span>
        </h1>
        <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto px-2">
          Deploy a coordinated swarm of specialized agents to audit Design, UX, Content, and Technical Performance with granular precision.
        </p>
      </motion.header>

      <section aria-label="Analysis workflow">
        <AnimatePresence mode="wait">
          {step === "input" && (
            <motion.div
              key="input"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              role="region"
              aria-label="URL input form"
            >
              <IntakeWizard onSubmit={handleStartAnalysis} />
            </motion.div>
          )}

          {step === "processing" && (
            <motion.div
              key="processing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full"
              role="region"
              aria-label="Analysis in progress"
              aria-busy="true"
            >
              <AnalysisConsole 
                logs={logs} 
                isProcessing={!error} 
                error={error}
              />
              {error && (
                <div className="mt-4 flex justify-center px-4">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={reset} 
                    className="min-h-[44px] min-w-[44px] focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                    data-testid="button-retry"
                    aria-label="Try again - Restart the analysis"
                  >
                    Try Again
                  </Button>
                </div>
              )}
            </motion.div>
          )}

          {step === "report" && report && (
            <motion.div
              key="report"
              className="relative pt-12 sm:pt-0"
              role="region"
              aria-label="Analysis report"
            >
              <div className="absolute top-0 sm:-top-12 left-0 px-0">
                <Button 
                  variant="ghost" 
                  onClick={reset} 
                  className="text-muted-foreground hover:text-foreground min-h-[44px] min-w-[44px] focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2" 
                  data-testid="button-new-analysis"
                  aria-label="Start a new analysis"
                >
                  <span aria-hidden="true">←</span> New Analysis
                </Button>
              </div>
              <ReportView report={report} reportId={reportId ?? undefined} />
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </div>
  );
}
