import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, Book, Bot } from "lucide-react";
import { Link as WouterLink } from "wouter";
import { Button } from "@/components/ui/button";
import { ReportView } from "@/components/agent/Report";
import { IntakeWizard } from "@/components/intake/IntakeWizard";
import { AnalysisConsole } from "@/components/agent/AnalysisConsole";
import type { Report } from "@/lib/mock-agent";

const stateAnnouncements = {
  input: "Listo para iniciar un nuevo análisis web. Por favor ingresa las URLs a analizar.",
  processing: "Análisis en progreso. Por favor espera mientras nuestros agentes analizan los sitios web.",
  report: "Análisis completado. El reporte está disponible para revisar.",
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
        throw new Error('La solicitud de análisis falló');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No se pudo obtener el flujo de respuesta');
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
      setError('Error al completar el análisis. Por favor intenta de nuevo.');
      setLogs(prev => [...prev, "[ERROR FATAL] El análisis falló. Por favor verifica las URLs e intenta de nuevo."]);
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
    <div className="min-h-screen bg-gradient-to-b from-white via-[#F5F9FC] to-white px-4 py-6 md:p-12 font-sans">
      <div 
        role="status" 
        aria-live="polite" 
        aria-atomic="true" 
        className="sr-only"
      >
        {announcement}
      </div>

      <motion.header
        className="max-w-4xl mx-auto mb-8 md:mb-12 text-center space-y-6"
        animate={{ opacity: step === "report" ? 0 : 1, height: step === "report" ? 0 : "auto", overflow: "hidden" }}
        role="banner"
      >
        <nav className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6" aria-label="Navegación principal">
          <a href="https://satma.mx" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3">
            <img 
              src="https://satma.mx/wp-content/uploads/2023/03/logo-azul-png.png" 
              alt="SATMA - Agencia Creativa" 
              className="h-10 md:h-12 object-contain"
              data-testid="img-satma-logo"
            />
          </a>
          <div className="flex gap-2">
            <WouterLink 
              href="/guide"
              aria-label="Ir a la Guía de Usuario para aprender cómo usar la aplicación"
            >
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2 min-h-[44px] min-w-[44px] focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 border-[#2A3E61] text-[#2A3E61] hover:bg-[#2A3E61] hover:text-white" 
                data-testid="link-user-guide"
                aria-label="Guía de Usuario - Aprende cómo usar la aplicación"
              >
                <Book className="w-4 h-4" aria-hidden="true" />
                <span className="hidden sm:inline">Guía</span>
              </Button>
            </WouterLink>
            <WouterLink 
              href="/performance"
              aria-label="Ir al monitoreo de agentes para ver métricas de rendimiento"
            >
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2 min-h-[44px] min-w-[44px] focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 border-[#2A3E61] text-[#2A3E61] hover:bg-[#2A3E61] hover:text-white" 
                data-testid="link-performance-dashboard"
                aria-label="Monitoreo de Agentes - Ver panel de rendimiento"
              >
                <Activity className="w-4 h-4" aria-hidden="true" />
                <span className="hidden sm:inline">Agentes</span>
              </Button>
            </WouterLink>
          </div>
        </nav>

        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#59E2DE]/20 border border-[#59E2DE]/40 text-[#2A3E61] text-xs font-medium tracking-wider uppercase">
          <Bot className="w-4 h-4" aria-hidden="true" />
          <span>Sistema Multi-Agente de IA v2.0</span>
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold tracking-tight text-[#2A3E61]">
          Analiza y Mejora tu <br /> 
          <span className="satma-text-gradient">Presencia Digital</span>
        </h1>

        <p className="text-base sm:text-lg text-[#2A3E61]/70 max-w-2xl mx-auto px-2 font-paragraph">
          Despliega un equipo coordinado de agentes de IA especializados para auditar Diseño, UX, Contenido y Rendimiento Técnico con precisión granular.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm text-[#2A3E61]/60">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#59E2DE]"></span>
            <span>Creado por SATMA</span>
          </div>
          <div className="hidden sm:block w-px h-4 bg-[#2A3E61]/20"></div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#2A3E61]"></span>
            <span>Para equipos de desarrollo web</span>
          </div>
        </div>
      </motion.header>

      <section aria-label="Flujo de trabajo de análisis">
        <AnimatePresence mode="wait">
          {step === "input" && (
            <motion.div
              key="input"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              role="region"
              aria-label="Formulario de entrada de URLs"
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
              aria-label="Análisis en progreso"
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
                    className="min-h-[44px] min-w-[44px] focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 border-[#2A3E61] text-[#2A3E61] hover:bg-[#2A3E61] hover:text-white"
                    data-testid="button-retry"
                    aria-label="Intentar de nuevo - Reiniciar el análisis"
                  >
                    Intentar de Nuevo
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
              aria-label="Reporte de análisis"
            >
              <div className="absolute top-0 sm:-top-12 left-0 px-0">
                <Button 
                  variant="ghost" 
                  onClick={reset} 
                  className="text-[#2A3E61]/60 hover:text-[#2A3E61] min-h-[44px] min-w-[44px] focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2" 
                  data-testid="button-new-analysis"
                  aria-label="Iniciar un nuevo análisis"
                >
                  <span aria-hidden="true">←</span> Nuevo Análisis
                </Button>
              </div>
              <ReportView report={report} reportId={reportId ?? undefined} />
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      <footer className="max-w-4xl mx-auto mt-16 pt-8 border-t border-[#2A3E61]/10 text-center">
        <p className="text-sm text-[#2A3E61]/50 font-paragraph">
          Desarrollado con tecnología de IA multi-agente por{" "}
          <a 
            href="https://satma.mx" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-[#2A3E61] hover:text-[#59E2DE] transition-colors"
            data-testid="link-satma-footer"
          >
            SATMA - Agencia Creativa
          </a>
        </p>
        <p className="text-xs text-[#2A3E61]/40 mt-2 font-paragraph break-words px-2">
          Simón Bolivar # 224 Of. 301 Piso 3, Col. Chepevera, Monterrey, N.L. | +52 (81) 2474 9049
        </p>
      </footer>
    </div>
  );
}
