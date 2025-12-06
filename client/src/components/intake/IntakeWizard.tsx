import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Globe,
  LayoutTemplate,
  Link,
  Loader2,
  Plus,
  Play,
  Search,
  Trash2,
  CheckCircle2,
  Circle,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const urlSchema = z.string().url({ message: "Please enter a valid URL (e.g., https://example.com)" });

const step1Schema = z.object({
  clientUrl: urlSchema,
});

const step2Schema = z.object({
  inputMethod: z.enum(["manual", "discover"]),
  competitorUrls: z.array(
    z.object({
      value: z.string().url({ message: "Please enter a valid URL" }),
    })
  ).min(1, "Add at least one competitor"),
});

type Step1Values = z.infer<typeof step1Schema>;
type Step2Values = z.infer<typeof step2Schema>;

interface ExtractedDomain {
  url: string;
  selected: boolean;
}

interface IntakeWizardProps {
  onSubmit: (clientUrl: string, competitorUrls: string[]) => void;
}

const steps = [
  { id: 1, title: "Client Website", description: "Enter your target website" },
  { id: 2, title: "Competitors", description: "Add competitor websites" },
  { id: 3, title: "Review", description: "Confirm and start analysis" },
];

export function IntakeWizard({ onSubmit }: IntakeWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [clientUrl, setClientUrl] = useState("");
  const [competitorUrls, setCompetitorUrls] = useState<string[]>([]);
  const [inputMethod, setInputMethod] = useState<"manual" | "discover">("manual");
  
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [extractedDomains, setExtractedDomains] = useState<ExtractedDomain[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);

  const step1Form = useForm<Step1Values>({
    resolver: zodResolver(step1Schema),
    defaultValues: { clientUrl: "" },
  });

  const step2Form = useForm<Step2Values>({
    resolver: zodResolver(step2Schema),
    defaultValues: {
      inputMethod: "manual",
      competitorUrls: [{ value: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    name: "competitorUrls",
    control: step2Form.control,
  });

  const handleStep1Submit = (data: Step1Values) => {
    setClientUrl(data.clientUrl);
    setCurrentStep(2);
  };

  const handleStep2Submit = (data: Step2Values) => {
    const urls = data.competitorUrls.map((c) => c.value).filter(Boolean);
    setCompetitorUrls(urls);
    setCurrentStep(3);
  };

  const handleDiscoverSubmit = () => {
    const selectedUrls = extractedDomains.filter((d) => d.selected).map((d) => d.url);
    if (selectedUrls.length < 1) {
      setExtractError("Please select at least 1 competitor");
      return;
    }
    setCompetitorUrls(selectedUrls);
    setCurrentStep(3);
  };

  const handleDiscoverCompetitors = async () => {
    if (!portfolioUrl) return;

    setIsExtracting(true);
    setExtractError(null);
    setExtractedDomains([]);

    try {
      const response = await fetch("/api/extract-domains", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ portfolioUrl }),
      });

      if (!response.ok) {
        throw new Error("Failed to extract domains");
      }

      const data = await response.json();
      const domains: string[] = data.domains || [];

      setExtractedDomains(domains.map((url) => ({ url, selected: true })));
    } catch (err) {
      console.error("Domain extraction error:", err);
      setExtractError("Error extracting domains. Please check the URL and try again.");
    } finally {
      setIsExtracting(false);
    }
  };

  const toggleDomainSelection = (index: number) => {
    setExtractedDomains((prev) =>
      prev.map((domain, i) =>
        i === index ? { ...domain, selected: !domain.selected } : domain
      )
    );
  };

  const handleFinalSubmit = () => {
    onSubmit(clientUrl, competitorUrls);
  };

  const goBack = () => {
    if (currentStep === 2) {
      setCurrentStep(1);
    } else if (currentStep === 3) {
      setCurrentStep(2);
    }
  };

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 100 : -100,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 100 : -100,
      opacity: 0,
    }),
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8" data-testid="wizard-progress">
        <div className="flex items-center justify-between relative">
          <div className="absolute top-5 left-0 right-0 h-0.5 bg-border -z-10" />
          <div
            className="absolute top-5 left-0 h-0.5 bg-primary transition-all duration-500 -z-10"
            style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
          />
          {steps.map((step) => (
            <div
              key={step.id}
              className="flex flex-col items-center gap-2"
              data-testid={`wizard-step-${step.id}`}
            >
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300",
                  currentStep > step.id
                    ? "bg-primary border-primary text-primary-foreground"
                    : currentStep === step.id
                    ? "bg-background border-primary text-primary"
                    : "bg-background border-muted-foreground/30 text-muted-foreground"
                )}
              >
                {currentStep > step.id ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <span className="font-semibold">{step.id}</span>
                )}
              </div>
              <div className="text-center hidden sm:block">
                <p
                  className={cn(
                    "text-sm font-medium",
                    currentStep >= step.id ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {step.title}
                </p>
                <p className="text-xs text-muted-foreground">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Card className="border-border/50 shadow-2xl bg-card/50 backdrop-blur-sm overflow-hidden">
        <AnimatePresence mode="wait" custom={currentStep}>
          {currentStep === 1 && (
            <motion.div
              key="step1"
              custom={1}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    <LayoutTemplate className="w-5 h-5" />
                  </div>
                  Enter Your Client Website
                </CardTitle>
                <CardDescription>
                  This is the website you want to analyze and compare against competitors.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...step1Form}>
                  <form onSubmit={step1Form.handleSubmit(handleStep1Submit)} className="space-y-6">
                    <FormField
                      control={step1Form.control}
                      name="clientUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground/80">Website URL</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                              <Input
                                placeholder="https://your-website.com"
                                className="font-mono text-sm pl-10 h-12"
                                data-testid="input-wizard-client-url"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end">
                      <Button
                        type="submit"
                        className="gap-2"
                        data-testid="button-wizard-step1-next"
                      >
                        Next Step
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </motion.div>
          )}

          {currentStep === 2 && (
            <motion.div
              key="step2"
              custom={2}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
                    <Globe className="w-5 h-5" />
                  </div>
                  Add Competitor Websites
                </CardTitle>
                <CardDescription>
                  Add competitor websites to compare against your client site.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex gap-2 p-1 bg-muted/30 rounded-lg">
                  <Button
                    type="button"
                    variant={inputMethod === "manual" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setInputMethod("manual")}
                    className="flex-1"
                    data-testid="toggle-wizard-manual-mode"
                  >
                    <LayoutTemplate className="w-4 h-4 mr-2" />
                    Manual Entry
                  </Button>
                  <Button
                    type="button"
                    variant={inputMethod === "discover" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setInputMethod("discover")}
                    className="flex-1"
                    data-testid="toggle-wizard-discover-mode"
                  >
                    <Search className="w-4 h-4 mr-2" />
                    Auto-Discover
                  </Button>
                </div>

                {inputMethod === "manual" ? (
                  <Form {...step2Form}>
                    <form
                      onSubmit={step2Form.handleSubmit(handleStep2Submit)}
                      className="space-y-6"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="text-foreground/80">Competitor URLs</Label>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => append({ value: "" })}
                            className="h-8 text-xs hover:bg-muted gap-1"
                            data-testid="button-wizard-add-competitor"
                          >
                            <Plus className="w-3 h-3" />
                            Add More
                          </Button>
                        </div>

                        <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                          {fields.map((field, index) => (
                            <FormField
                              key={field.id}
                              control={step2Form.control}
                              name={`competitorUrls.${index}.value`}
                              render={({ field }) => (
                                <FormItem>
                                  <div className="flex gap-2">
                                    <FormControl>
                                      <div className="relative flex-1">
                                        <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        <Input
                                          placeholder={`https://competitor-${index + 1}.com`}
                                          className="font-mono text-sm pl-10"
                                          data-testid={`input-wizard-competitor-${index}`}
                                          {...field}
                                        />
                                      </div>
                                    </FormControl>
                                    {fields.length > 1 && (
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        onClick={() => remove(index)}
                                        className="shrink-0 text-muted-foreground hover:text-destructive"
                                        data-testid={`button-wizard-remove-competitor-${index}`}
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

                      <div className="flex justify-between">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={goBack}
                          className="gap-2"
                          data-testid="button-wizard-step2-back"
                        >
                          <ArrowLeft className="w-4 h-4" />
                          Back
                        </Button>
                        <Button
                          type="submit"
                          className="gap-2"
                          data-testid="button-wizard-step2-next"
                        >
                          Review
                          <ArrowRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </form>
                  </Form>
                ) : (
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <Label className="text-foreground/80">Portfolio / Agency URL</Label>
                      <p className="text-xs text-muted-foreground">
                        Enter a portfolio or agency URL to automatically discover competitor websites.
                      </p>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            value={portfolioUrl}
                            onChange={(e) => setPortfolioUrl(e.target.value)}
                            placeholder="https://agency-portfolio.com/works"
                            className="font-mono text-sm pl-10"
                            data-testid="input-wizard-portfolio-url"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={handleDiscoverCompetitors}
                          disabled={!portfolioUrl || isExtracting}
                          data-testid="button-wizard-discover"
                        >
                          {isExtracting ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Search className="w-4 h-4 mr-2" />
                          )}
                          Discover
                        </Button>
                      </div>
                    </div>

                    {extractError && (
                      <div className="flex items-center gap-2 text-sm text-red-400" data-testid="text-wizard-extract-error">
                        <AlertCircle className="w-4 h-4" />
                        {extractError}
                      </div>
                    )}

                    {extractedDomains.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-foreground/80">
                            Discovered Domains
                          </span>
                          <Badge variant="secondary">
                            {extractedDomains.filter((d) => d.selected).length} selected
                          </Badge>
                        </div>
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                          {extractedDomains.map((domain, index) => (
                            <div
                              key={domain.url}
                              className={cn(
                                "flex items-center gap-3 p-3 rounded-lg transition-colors cursor-pointer",
                                domain.selected
                                  ? "bg-primary/10 border border-primary/30"
                                  : "bg-muted/30 hover:bg-muted/50"
                              )}
                              onClick={() => toggleDomainSelection(index)}
                              data-testid={`domain-item-${index}`}
                            >
                              <Checkbox
                                checked={domain.selected}
                                onCheckedChange={() => toggleDomainSelection(index)}
                                data-testid={`checkbox-wizard-domain-${index}`}
                              />
                              <span
                                className="font-mono text-sm text-foreground/80 truncate flex-1"
                                data-testid={`text-wizard-domain-${index}`}
                              >
                                {domain.url}
                              </span>
                              {domain.selected && (
                                <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={goBack}
                        className="gap-2"
                        data-testid="button-wizard-discover-back"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        Back
                      </Button>
                      <Button
                        onClick={handleDiscoverSubmit}
                        disabled={extractedDomains.filter((d) => d.selected).length < 1}
                        className="gap-2"
                        data-testid="button-wizard-discover-next"
                      >
                        Review
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </motion.div>
          )}

          {currentStep === 3 && (
            <motion.div
              key="step3"
              custom={3}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                    <Check className="w-5 h-5" />
                  </div>
                  Review Your Analysis
                </CardTitle>
                <CardDescription>
                  Confirm the websites to be analyzed before starting.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                    <div className="flex items-center gap-2 text-sm font-medium text-primary mb-2">
                      <LayoutTemplate className="w-4 h-4" />
                      Client Website (Target)
                    </div>
                    <p className="font-mono text-sm text-foreground break-all" data-testid="text-review-client-url">
                      {clientUrl}
                    </p>
                  </div>

                  <div className="p-4 rounded-lg bg-amber-500/5 border border-amber-500/20">
                    <div className="flex items-center gap-2 text-sm font-medium text-amber-500 mb-3">
                      <Globe className="w-4 h-4" />
                      Competitor Websites ({competitorUrls.length})
                    </div>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {competitorUrls.map((url, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 text-sm"
                          data-testid={`text-review-competitor-${index}`}
                        >
                          <Circle className="w-2 h-2 text-amber-500 fill-current" />
                          <span className="font-mono text-foreground/80 break-all">{url}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                  <p className="text-sm text-muted-foreground">
                    <strong className="text-foreground">Total websites:</strong>{" "}
                    {competitorUrls.length + 1} ({1} client + {competitorUrls.length} competitors)
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Our AI agents will analyze design, UX, content, and technical performance.
                  </p>
                </div>

                <div className="flex justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={goBack}
                    className="gap-2"
                    data-testid="button-wizard-step3-back"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </Button>
                  <Button
                    onClick={handleFinalSubmit}
                    className="gap-2 shadow-primary/25 shadow-lg"
                    data-testid="button-wizard-start-analysis"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    Start Analysis
                  </Button>
                </div>
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </div>
  );
}
