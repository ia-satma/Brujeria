import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Share2, Activity } from "lucide-react";
import { Link as WouterLink } from "wouter";
import { Button } from "@/components/ui/button";
import { TerminalLog } from "@/components/agent/Terminal";
import { AgentNetwork } from "@/components/agent/AgentNetwork";
import { ReportView } from "@/components/agent/Report";
import { IntakeWizard } from "@/components/intake/IntakeWizard";
import type { Report } from "@/lib/mock-agent";

export default function Dashboard() {
  const [step, setStep] = useState<"input" | "processing" | "report">("input");
  const [logs, setLogs] = useState<string[]>([]);
  const [report, setReport] = useState<Report | null>(null);
  const [reportId, setReportId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

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
    <div className="min-h-screen bg-background bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-secondary via-background to-background p-6 md:p-12 font-sans">

      <motion.header
        className="max-w-4xl mx-auto mb-12 text-center space-y-4"
        animate={{ opacity: step === "report" ? 0 : 1, height: step === "report" ? 0 : "auto", overflow: "hidden" }}
      >
        <div className="flex justify-end mb-4">
          <WouterLink href="/performance">
            <Button variant="outline" size="sm" className="gap-2" data-testid="link-performance-dashboard">
              <Activity className="w-4 h-4" />
              Agent Monitoring
            </Button>
          </WouterLink>
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-mono tracking-wider uppercase">
          <Share2 className="w-3 h-3" />
          Multi-Agent System v2.0
        </div>
        <h1 className="text-4xl md:text-6xl font-display font-bold tracking-tight text-foreground">
          Web Analysis <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">Hyperspecialized</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Deploy a coordinated swarm of specialized agents to audit Design, UX, Content, and Technical Performance with granular precision.
        </p>
      </motion.header>

      <AnimatePresence mode="wait">

        {step === "input" && (
          <motion.div
            key="input"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
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
            className="flex flex-col items-center w-full max-w-4xl mx-auto"
          >
            <AgentNetwork logs={logs} />
            <TerminalLog logs={logs} isProcessing={!error} />
            {!error && (
              <p className="mt-4 text-muted-foreground text-sm animate-pulse" data-testid="text-processing-status">
                The Orchestrator is distributing tasks to specialized sub-agents...
              </p>
            )}
            {error && (
              <div className="mt-4 flex gap-2" data-testid="container-error">
                <p className="text-red-400 text-sm" data-testid="text-error-message">{error}</p>
                <Button variant="outline" size="sm" onClick={reset} data-testid="button-retry">
                  Try Again
                </Button>
              </div>
            )}
          </motion.div>
        )}

        {step === "report" && report && (
          <motion.div
            key="report"
            className="relative"
          >
            <div className="absolute -top-12 left-0">
              <Button variant="ghost" onClick={reset} className="text-muted-foreground hover:text-foreground" data-testid="button-new-analysis">
                ← New Analysis
              </Button>
            </div>
            <ReportView report={report} reportId={reportId ?? undefined} />
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
