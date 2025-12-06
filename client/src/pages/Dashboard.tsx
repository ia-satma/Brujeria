import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2, Play, Globe, LayoutTemplate, Share2, Search, Link, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { TerminalLog } from "@/components/agent/Terminal";
import { AgentNetwork } from "@/components/agent/AgentNetwork";
import { ReportView } from "@/components/agent/Report";
import type { Report } from "@/lib/mock-agent";

const formSchema = z.object({
  clientUrl: z.string().url({ message: "Por favor ingresa una URL válida" }),
  competitorUrls: z.array(
    z.object({
      value: z.string().url({ message: "Por favor ingresa una URL válida" })
    })
  ).min(1, "Agrega al menos un competidor")
});

type FormValues = z.infer<typeof formSchema>;

type InputMode = "manual" | "portfolio";

interface ExtractedDomain {
  url: string;
  selected: boolean;
}

export default function Dashboard() {
  const [step, setStep] = useState<"input" | "processing" | "report">("input");
  const [logs, setLogs] = useState<string[]>([]);
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [inputMode, setInputMode] = useState<InputMode>("manual");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [portfolioClientUrl, setPortfolioClientUrl] = useState("");
  const [extractedDomains, setExtractedDomains] = useState<ExtractedDomain[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      clientUrl: "",
      competitorUrls: [{ value: "" }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    name: "competitorUrls",
    control: form.control
  });

  const handleDiscoverCompetitors = async () => {
    if (!portfolioUrl) return;
    
    setIsExtracting(true);
    setExtractError(null);
    setExtractedDomains([]);
    
    try {
      const response = await fetch('/api/extract-domains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ portfolioUrl }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to extract domains');
      }
      
      const data = await response.json();
      const domains: string[] = data.domains || [];
      
      setExtractedDomains(domains.map(url => ({ url, selected: true })));
    } catch (err) {
      console.error('Domain extraction error:', err);
      setExtractError('Error al extraer dominios. Por favor verifica la URL e intenta de nuevo.');
    } finally {
      setIsExtracting(false);
    }
  };

  const toggleDomainSelection = (index: number) => {
    setExtractedDomains(prev => 
      prev.map((domain, i) => 
        i === index ? { ...domain, selected: !domain.selected } : domain
      )
    );
  };

  const handlePortfolioAnalysis = async () => {
    if (!portfolioClientUrl) {
      setExtractError('Por favor ingresa la URL de tu sitio web cliente');
      return;
    }
    
    const selectedUrls = extractedDomains.filter(d => d.selected).map(d => d.url);
    if (selectedUrls.length < 1) {
      setExtractError('Por favor selecciona al menos 1 dominio competidor');
      return;
    }
    
    const clientUrl = portfolioClientUrl;
    const competitorUrls = selectedUrls;
    
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

  const onSubmit = async (data: FormValues) => {
    setStep("processing");
    setLogs([]);
    setError(null);
    
    const competitorUrls = data.competitorUrls.map(c => c.value);
    
    try {
      const response = await fetch('/api/analyze-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientUrl: data.clientUrl,
          competitorUrls,
        }),
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
    setLogs([]);
    setError(null);
    form.reset();
    setInputMode("manual");
    setPortfolioUrl("");
    setPortfolioClientUrl("");
    setExtractedDomains([]);
    setExtractError(null);
  };

  return (
    <div className="min-h-screen bg-background bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-secondary via-background to-background p-6 md:p-12 font-sans">
      
      <motion.header 
        className="max-w-4xl mx-auto mb-12 text-center space-y-4"
        animate={{ opacity: step === "report" ? 0 : 1, height: step === "report" ? 0 : "auto", overflow: "hidden" }}
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-mono tracking-wider uppercase">
          <Share2 className="w-3 h-3" />
          Sistema Multi-Agente v2.0
        </div>
        <h1 className="text-4xl md:text-6xl font-display font-bold tracking-tight text-foreground">
          Análisis Web <br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">Hiperespecializado</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Despliega un enjambre coordinado de agentes especializados para auditar Diseño, UX, Contenido y Rendimiento Técnico con precisión granular.
        </p>
      </motion.header>

      <AnimatePresence mode="wait">
        
        {step === "input" && (
          <motion.div
            key="input"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-2xl mx-auto"
          >
            <Card className="border-border/50 shadow-2xl bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Configurar Enjambre de Agentes</CardTitle>
                <CardDescription>
                  Inicializa el Agente Orquestador definiendo el objetivo y el panorama competitivo.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 mb-6 p-1 bg-muted/30 rounded-lg">
                  <Button
                    type="button"
                    variant={inputMode === "manual" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setInputMode("manual")}
                    className="flex-1"
                    data-testid="toggle-manual-mode"
                  >
                    <LayoutTemplate className="w-4 h-4 mr-2" />
                    Entrada Manual
                  </Button>
                  <Button
                    type="button"
                    variant={inputMode === "portfolio" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setInputMode("portfolio")}
                    className="flex-1"
                    data-testid="toggle-portfolio-mode"
                  >
                    <Link className="w-4 h-4 mr-2" />
                    Descubrir Competidores
                  </Button>
                </div>

                {inputMode === "manual" ? (
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                      
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-sm font-medium text-foreground/80">
                          <div className="p-1.5 rounded bg-primary/10 text-primary">
                            <LayoutTemplate className="w-4 h-4" />
                          </div>
                          Sitio Web del Cliente (Objetivo)
                        </div>
                        <FormField
                          control={form.control}
                          name="clientUrl"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input 
                                  placeholder="https://tu-sitio-web.com" 
                                  className="font-mono text-sm" 
                                  data-testid="input-client-url"
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="space-y-4">
                         <div className="flex items-center justify-between text-sm font-medium text-foreground/80">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded bg-amber-500/10 text-amber-500">
                              <Globe className="w-4 h-4" />
                            </div>
                            Sitios Web Competidores
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => append({ value: "" })}
                            className="h-8 text-xs hover:bg-muted"
                            data-testid="button-add-competitor"
                          >
                            <Plus className="w-3 h-3 mr-1" />
                            Agregar Competidor
                          </Button>
                        </div>
                        
                        <div className="space-y-3">
                          {fields.map((field, index) => (
                            <FormField
                              key={field.id}
                              control={form.control}
                              name={`competitorUrls.${index}.value`}
                              render={({ field }) => (
                                <FormItem>
                                  <div className="flex gap-2">
                                    <FormControl>
                                      <Input 
                                        placeholder={`https://competidor-${index + 1}.com`} 
                                        className="font-mono text-sm" 
                                        data-testid={`input-competitor-url-${index}`}
                                        {...field} 
                                      />
                                    </FormControl>
                                    {fields.length > 1 && (
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        onClick={() => remove(index)}
                                        className="shrink-0 text-muted-foreground hover:text-destructive"
                                        data-testid={`button-remove-competitor-${index}`}
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    )}
                                  </div>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          ))}
                        </div>
                      </div>

                      <Button 
                        type="submit" 
                        className="w-full h-12 text-base font-medium shadow-primary/25 shadow-lg"
                        data-testid="button-deploy-agents"
                      >
                        <Play className="w-4 h-4 mr-2 fill-current" />
                        Desplegar Agentes
                      </Button>
                    </form>
                  </Form>
                ) : (
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-sm font-medium text-foreground/80">
                        <div className="p-1.5 rounded bg-primary/10 text-primary">
                          <LayoutTemplate className="w-4 h-4" />
                        </div>
                        Sitio Web del Cliente (Tu sitio)
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Ingresa la URL del sitio web que deseas analizar como cliente.
                      </p>
                      <Input
                        value={portfolioClientUrl}
                        onChange={(e) => setPortfolioClientUrl(e.target.value)}
                        placeholder="https://tu-sitio-web.com"
                        className="font-mono text-sm"
                        data-testid="input-portfolio-client-url"
                      />
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-sm font-medium text-foreground/80">
                        <div className="p-1.5 rounded bg-purple-500/10 text-purple-500">
                          <Link className="w-4 h-4" />
                        </div>
                        URL del Portafolio / Agencia
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Ingresa una URL de portafolio o agencia para descubrir automáticamente sitios web competidores.
                      </p>
                      <div className="flex gap-2">
                        <Input
                          value={portfolioUrl}
                          onChange={(e) => setPortfolioUrl(e.target.value)}
                          placeholder="https://agencia-competidora.com/portafolio"
                          className="font-mono text-sm flex-1"
                          data-testid="input-portfolio-url"
                        />
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={handleDiscoverCompetitors}
                          disabled={!portfolioUrl || isExtracting}
                          data-testid="button-discover-competitors"
                        >
                          {isExtracting ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Search className="w-4 h-4 mr-2" />
                          )}
                          Descubrir
                        </Button>
                      </div>
                    </div>

                    {extractError && (
                      <p className="text-sm text-red-400" data-testid="text-extract-error">{extractError}</p>
                    )}

                    {extractedDomains.length > 0 && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-sm font-medium text-foreground/80">
                          <div className="p-1.5 rounded bg-emerald-500/10 text-emerald-500">
                            <Globe className="w-4 h-4" />
                          </div>
                          Dominios Descubiertos ({extractedDomains.filter(d => d.selected).length} seleccionados)
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Los dominios seleccionados serán analizados como competidores de tu sitio cliente.
                        </p>
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                          {extractedDomains.map((domain, index) => (
                            <div 
                              key={domain.url}
                              className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                            >
                              <Checkbox
                                checked={domain.selected}
                                onCheckedChange={() => toggleDomainSelection(index)}
                                data-testid={`checkbox-domain-${index}`}
                              />
                              <span className="font-mono text-sm text-foreground/80 truncate flex-1" data-testid={`text-domain-${index}`}>
                                {domain.url}
                              </span>
                              {domain.selected && (
                                <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-500">Competidor</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <Button
                      type="button"
                      onClick={handlePortfolioAnalysis}
                      disabled={!portfolioClientUrl || extractedDomains.filter(d => d.selected).length < 1}
                      className="w-full h-12 text-base font-medium shadow-primary/25 shadow-lg"
                      data-testid="button-run-portfolio-analysis"
                    >
                      <Play className="w-4 h-4 mr-2 fill-current" />
                      Ejecutar Análisis ({extractedDomains.filter(d => d.selected).length + 1} sitios)
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
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
              <p className="mt-4 text-muted-foreground text-sm animate-pulse">
                El Orquestador está distribuyendo tareas a sub-agentes especializados...
              </p>
            )}
            {error && (
              <div className="mt-4 flex gap-2">
                <p className="text-red-400 text-sm">{error}</p>
                <Button variant="outline" size="sm" onClick={reset}>
                  Intentar de Nuevo
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
               <Button variant="ghost" onClick={reset} className="text-muted-foreground hover:text-foreground">
                 ← Nuevo Análisis
               </Button>
            </div>
            <ReportView report={report} />
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
