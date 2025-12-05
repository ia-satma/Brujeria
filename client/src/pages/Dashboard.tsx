import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2, Play, Globe, LayoutTemplate, Sparkles, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { TerminalLog } from "@/components/agent/Terminal";
import { ReportView } from "@/components/agent/Report";
import { simulateAgentAnalysis, Report } from "@/lib/mock-agent";

const formSchema = z.object({
  clientUrl: z.string().url({ message: "Please enter a valid URL" }),
  competitorUrls: z.array(
    z.object({
      value: z.string().url({ message: "Please enter a valid URL" })
    })
  ).min(1, "Add at least one competitor")
});

type FormValues = z.infer<typeof formSchema>;

export default function Dashboard() {
  const [step, setStep] = useState<"input" | "processing" | "report">("input");
  const [logs, setLogs] = useState<string[]>([]);
  const [report, setReport] = useState<Report | null>(null);

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

  const onSubmit = async (data: FormValues) => {
    setStep("processing");
    setLogs([]);
    
    const competitorUrls = data.competitorUrls.map(c => c.value);
    
    try {
      const result = await simulateAgentAnalysis(
        data.clientUrl, 
        competitorUrls, 
        (log) => setLogs(prev => [...prev, log])
      );
      setReport(result);
      await new Promise(r => setTimeout(r, 1000)); // pause to read "Success"
      setStep("report");
    } catch (error) {
      setLogs(prev => [...prev, "[FATAL ERROR] Analysis failed due to internal timeout."]);
    }
  };

  const reset = () => {
    setStep("input");
    setReport(null);
    setLogs([]);
    form.reset();
  };

  return (
    <div className="min-h-screen bg-background bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-secondary via-background to-background p-6 md:p-12 font-sans">
      
      {/* Header - Only show in Input/Processing modes, collapse in Report mode */}
      <motion.header 
        className="max-w-4xl mx-auto mb-12 text-center space-y-4"
        animate={{ opacity: step === "report" ? 0 : 1, height: step === "report" ? 0 : "auto", overflow: "hidden" }}
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-mono tracking-wider uppercase">
          <Share2 className="w-3 h-3" />
          Multi-Agent System v2.0
        </div>
        <h1 className="text-4xl md:text-6xl font-display font-bold tracking-tight text-foreground">
          Hyperspecialized <br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">Web Benchmarking</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Deploy a coordinated swarm of specialized agents to audit Design, UX, Content, and Technical Performance with granular precision.
        </p>
      </motion.header>

      <AnimatePresence mode="wait">
        
        {/* INPUT STEP */}
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
                <CardTitle>Configure Agent Swarm</CardTitle>
                <CardDescription>
                  Initialize the Orchestrator Agent by defining the target and competitor landscape.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    
                    {/* Client URL */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-sm font-medium text-foreground/80">
                        <div className="p-1.5 rounded bg-primary/10 text-primary">
                          <LayoutTemplate className="w-4 h-4" />
                        </div>
                        Client Website (Target)
                      </div>
                      <FormField
                        control={form.control}
                        name="clientUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input placeholder="https://client-website.com" className="font-mono text-sm" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Competitor URLs */}
                    <div className="space-y-4">
                       <div className="flex items-center justify-between text-sm font-medium text-foreground/80">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded bg-amber-500/10 text-amber-500">
                            <Globe className="w-4 h-4" />
                          </div>
                          Competitor Websites
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => append({ value: "" })}
                          className="h-8 text-xs hover:bg-muted"
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Add Competitor
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
                                    <Input placeholder={`https://competitor-${index + 1}.com`} className="font-mono text-sm" {...field} />
                                  </FormControl>
                                  {fields.length > 1 && (
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="icon"
                                      onClick={() => remove(index)}
                                      className="shrink-0 text-muted-foreground hover:text-destructive"
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

                    <Button type="submit" className="w-full h-12 text-base font-medium shadow-primary/25 shadow-lg">
                      <Play className="w-4 h-4 mr-2 fill-current" />
                      Deploy Agents
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* PROCESSING STEP */}
        {step === "processing" && (
          <motion.div
            key="processing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center"
          >
            <TerminalLog logs={logs} isProcessing={true} />
            <p className="mt-4 text-muted-foreground text-sm animate-pulse">
              Orchestrator is distributing tasks to specialized sub-agents...
            </p>
          </motion.div>
        )}

        {/* REPORT STEP */}
        {step === "report" && report && (
          <motion.div
             key="report"
             className="relative"
          > 
            <div className="absolute -top-12 left-0">
               <Button variant="ghost" onClick={reset} className="text-muted-foreground hover:text-foreground">
                 ← New Analysis
               </Button>
            </div>
            <ReportView report={report} />
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
