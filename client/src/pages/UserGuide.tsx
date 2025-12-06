import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link as WouterLink } from "wouter";
import { 
  Book, 
  ChevronDown, 
  ChevronRight, 
  Globe, 
  Zap, 
  FileText, 
  Target,
  Layers,
  Shield,
  Clock,
  HelpCircle,
  ArrowLeft,
  CheckCircle,
  Play,
  BarChart3,
  Download
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface QuickstartStep {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  details: string[];
}

const quickstartSteps: QuickstartStep[] = [
  {
    id: 1,
    title: "Enter Your Website URL",
    description: "Start by entering your client website URL in the first field.",
    icon: <Globe className="w-6 h-6" />,
    details: [
      "Enter the full URL including https://",
      "Make sure the website is publicly accessible",
      "The analysis works best with live production sites"
    ]
  },
  {
    id: 2,
    title: "Add Competitor URLs",
    description: "Add up to 5 competitor websites to benchmark against.",
    icon: <Target className="w-6 h-6" />,
    details: [
      "Click 'Add Competitor' to add more URLs",
      "Choose direct competitors or industry leaders",
      "More competitors provide richer comparative insights"
    ]
  },
  {
    id: 3,
    title: "Start the Analysis",
    description: "Click the analyze button to begin the AI-powered analysis.",
    icon: <Play className="w-6 h-6" />,
    details: [
      "Our AI agents will scrape and analyze each website",
      "Watch the real-time progress in the analysis console",
      "Analysis typically takes 2-5 minutes depending on site complexity"
    ]
  },
  {
    id: 4,
    title: "Review Results",
    description: "Explore the comprehensive benchmarking report.",
    icon: <BarChart3 className="w-6 h-6" />,
    details: [
      "View scores across visual design, UX, content, and technical performance",
      "Compare your site against each competitor",
      "Identify strengths and areas for improvement"
    ]
  },
  {
    id: 5,
    title: "Export & Share",
    description: "Download your report as a PDF or share with your team.",
    icon: <Download className="w-6 h-6" />,
    details: [
      "Export detailed PDF reports for stakeholders",
      "Use insights to prioritize improvements",
      "Track progress by running analyses over time"
    ]
  }
];

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const faqItems: FAQItem[] = [
  {
    category: "Getting Started",
    question: "What types of websites can be analyzed?",
    answer: "Our tool can analyze any publicly accessible website. This includes e-commerce sites, corporate websites, blogs, SaaS platforms, and more. The website must be live and not behind a login or paywall for accurate analysis."
  },
  {
    category: "Getting Started",
    question: "How long does an analysis take?",
    answer: "A typical analysis takes 2-5 minutes depending on the number of competitor websites and the complexity of the sites being analyzed. You can watch the progress in real-time through our analysis console."
  },
  {
    category: "Getting Started",
    question: "How many competitors can I benchmark against?",
    answer: "You can benchmark against up to 5 competitor websites in a single analysis. We recommend including 2-3 direct competitors for the most actionable insights."
  },
  {
    category: "Analysis & Scoring",
    question: "What aspects of websites are analyzed?",
    answer: "Our AI agents analyze four key areas: Visual Aesthetics (design quality, color harmony, typography), UX & Navigation (usability, information architecture, accessibility), Content & Storytelling (messaging clarity, brand voice, engagement), and Technical Performance (load times, mobile responsiveness, SEO factors)."
  },
  {
    category: "Analysis & Scoring",
    question: "How is the scoring system calculated?",
    answer: "Each category is scored on a scale of 1-10 by specialized AI agents. The overall score is a weighted average of all categories. Scores are calibrated against industry benchmarks and best practices."
  },
  {
    category: "Analysis & Scoring",
    question: "Can I trust the AI analysis results?",
    answer: "Our multi-agent system uses specialized AI models trained on web design and UX best practices. While AI analysis provides valuable insights, we recommend using it as one input alongside human expert review for critical decisions."
  },
  {
    category: "Reports & Export",
    question: "Can I export the analysis results?",
    answer: "Yes! You can export your complete analysis as a PDF report. The PDF includes all scores, comparisons, detailed insights, and actionable recommendations."
  },
  {
    category: "Reports & Export",
    question: "How long are analysis reports stored?",
    answer: "All analysis reports are stored in your account and can be accessed anytime. You can view historical reports to track improvements over time."
  },
  {
    category: "Technical",
    question: "Is my website data secure?",
    answer: "Yes. We only analyze publicly accessible content and do not store sensitive data. All analysis is performed securely and data is encrypted in transit."
  },
  {
    category: "Technical",
    question: "What if the analysis fails or times out?",
    answer: "If an analysis fails, check that all URLs are correct and publicly accessible. Some websites with aggressive bot protection may not be fully analyzable. Try again or contact support if issues persist."
  }
];

const featureCards = [
  {
    icon: <Layers className="w-8 h-8 text-primary" />,
    title: "Multi-Agent Architecture",
    description: "Specialized AI agents work in parallel to analyze different aspects of your website."
  },
  {
    icon: <Zap className="w-8 h-8 text-primary" />,
    title: "Real-Time Analysis",
    description: "Watch the analysis unfold with live progress updates and agent activity logs."
  },
  {
    icon: <Shield className="w-8 h-8 text-primary" />,
    title: "Comprehensive Scoring",
    description: "Get detailed scores across visual design, UX, content quality, and technical performance."
  },
  {
    icon: <Clock className="w-8 h-8 text-primary" />,
    title: "Fast Results",
    description: "Receive complete benchmarking reports in just 2-5 minutes."
  }
];

export default function UserGuide() {
  const [expandedStep, setExpandedStep] = useState<number | null>(1);
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const categories = ["all", ...Array.from(new Set(faqItems.map(item => item.category)))];
  const filteredFAQs = activeCategory === "all" 
    ? faqItems 
    : faqItems.filter(item => item.category === activeCategory);

  return (
    <div className="min-h-screen bg-background bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-secondary via-background to-background px-4 py-6 md:p-12 font-sans">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-5xl mx-auto"
      >
        <nav className="mb-8" aria-label="Breadcrumb navigation">
          <WouterLink href="/" aria-label="Return to main dashboard">
            <Button 
              variant="ghost" 
              className="gap-2 text-muted-foreground hover:text-foreground"
              data-testid="button-back-dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Button>
          </WouterLink>
        </nav>

        <header className="text-center mb-12" role="banner">
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3 }}
            className="inline-flex items-center gap-3 mb-4"
          >
            <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
              <Book className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
              User Guide
            </h1>
          </motion.div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto" data-testid="text-guide-description">
            Learn how to use the Web Benchmarking Analyst to compare your website against competitors and get actionable insights.
          </p>
        </header>

        <Tabs defaultValue="quickstart" className="mb-12">
          <TabsList className="grid w-full grid-cols-3 mb-8" data-testid="tabs-guide-sections">
            <TabsTrigger value="quickstart" className="gap-2" data-testid="tab-quickstart">
              <Play className="w-4 h-4" />
              <span className="hidden sm:inline">Quickstart</span>
            </TabsTrigger>
            <TabsTrigger value="features" className="gap-2" data-testid="tab-features">
              <Layers className="w-4 h-4" />
              <span className="hidden sm:inline">Features</span>
            </TabsTrigger>
            <TabsTrigger value="faq" className="gap-2" data-testid="tab-faq">
              <HelpCircle className="w-4 h-4" />
              <span className="hidden sm:inline">FAQ</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="quickstart">
            <section aria-labelledby="quickstart-heading">
              <h2 id="quickstart-heading" className="text-2xl font-semibold mb-6 flex items-center gap-2">
                <Zap className="w-6 h-6 text-primary" />
                Quickstart Tutorial
              </h2>
              <p className="text-muted-foreground mb-8" data-testid="text-quickstart-intro">
                Follow these simple steps to run your first website benchmarking analysis.
              </p>

              <div className="space-y-4">
                {quickstartSteps.map((step, index) => (
                  <motion.div
                    key={step.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card 
                      className={`cursor-pointer transition-all duration-300 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none ${
                        expandedStep === step.id 
                          ? "border-primary/50 bg-primary/5" 
                          : "hover:border-primary/30"
                      }`}
                      onClick={() => setExpandedStep(expandedStep === step.id ? null : step.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setExpandedStep(expandedStep === step.id ? null : step.id);
                        }
                      }}
                      role="button"
                      tabIndex={0}
                      aria-expanded={expandedStep === step.id}
                      aria-label={`Step ${step.id}: ${step.title}. ${expandedStep === step.id ? 'Press to collapse' : 'Press to expand'}`}
                      data-testid={`card-step-${step.id}`}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-center gap-4">
                          <div className={`flex items-center justify-center w-12 h-12 rounded-full ${
                            expandedStep === step.id 
                              ? "bg-primary text-primary-foreground" 
                              : "bg-primary/10 text-primary"
                          }`}>
                            <span className="font-bold text-lg">{step.id}</span>
                          </div>
                          <div className="flex-1">
                            <CardTitle className="text-lg flex items-center gap-2">
                              {step.icon}
                              {step.title}
                            </CardTitle>
                            <p className="text-sm text-muted-foreground mt-1">
                              {step.description}
                            </p>
                          </div>
                          <motion.div
                            animate={{ rotate: expandedStep === step.id ? 90 : 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <ChevronRight className="w-5 h-5 text-muted-foreground" />
                          </motion.div>
                        </div>
                      </CardHeader>
                      <AnimatePresence>
                        {expandedStep === step.id && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                          >
                            <CardContent className="pt-4 border-t border-border/50">
                              <ul className="space-y-2">
                                {step.details.map((detail, idx) => (
                                  <li key={idx} className="flex items-start gap-2 text-sm">
                                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                    <span>{detail}</span>
                                  </li>
                                ))}
                              </ul>
                            </CardContent>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </Card>
                  </motion.div>
                ))}
              </div>

              <div className="mt-8 text-center">
                <WouterLink href="/">
                  <Button size="lg" className="gap-2" data-testid="button-start-analysis">
                    <Play className="w-5 h-5" />
                    Start Your First Analysis
                  </Button>
                </WouterLink>
              </div>
            </section>
          </TabsContent>

          <TabsContent value="features">
            <section aria-labelledby="features-heading">
              <h2 id="features-heading" className="text-2xl font-semibold mb-6 flex items-center gap-2">
                <Layers className="w-6 h-6 text-primary" />
                Key Features
              </h2>
              <p className="text-muted-foreground mb-8" data-testid="text-features-intro">
                Discover what makes our Web Benchmarking Analyst unique.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {featureCards.map((feature, index) => (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="h-full hover:border-primary/30 transition-colors" data-testid={`card-feature-${index}`}>
                      <CardContent className="pt-6">
                        <div className="mb-4">{feature.icon}</div>
                        <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                        <p className="text-muted-foreground text-sm">{feature.description}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              <Card className="mt-8 border-primary/30 bg-primary/5" data-testid="card-analysis-areas">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    What We Analyze
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h4 className="font-medium flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500" />
                        Visual Aesthetics
                      </h4>
                      <p className="text-sm text-muted-foreground pl-4">
                        Color harmony, typography, imagery, layout composition, and brand consistency.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-medium flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500" />
                        UX & Navigation
                      </h4>
                      <p className="text-sm text-muted-foreground pl-4">
                        Usability, information architecture, accessibility, and user flow design.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-medium flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-purple-500" />
                        Content & Storytelling
                      </h4>
                      <p className="text-sm text-muted-foreground pl-4">
                        Message clarity, brand voice, emotional engagement, and call-to-action effectiveness.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-medium flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-orange-500" />
                        Technical Performance
                      </h4>
                      <p className="text-sm text-muted-foreground pl-4">
                        Page load speed, mobile responsiveness, SEO fundamentals, and code quality.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>
          </TabsContent>

          <TabsContent value="faq">
            <section aria-labelledby="faq-heading">
              <h2 id="faq-heading" className="text-2xl font-semibold mb-6 flex items-center gap-2">
                <HelpCircle className="w-6 h-6 text-primary" />
                Frequently Asked Questions
              </h2>

              <div className="flex flex-wrap gap-2 mb-6">
                {categories.map((category) => (
                  <Button
                    key={category}
                    variant={activeCategory === category ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveCategory(category)}
                    className="capitalize"
                    data-testid={`button-faq-category-${category.replace(/\s+/g, '-').toLowerCase()}`}
                  >
                    {category === "all" ? "All Questions" : category}
                  </Button>
                ))}
              </div>

              <Accordion type="single" collapsible className="space-y-2" data-testid="accordion-faq">
                {filteredFAQs.map((faq, index) => (
                  <AccordionItem 
                    key={index} 
                    value={`faq-${index}`}
                    className="border rounded-lg px-4 data-[state=open]:border-primary/50 data-[state=open]:bg-primary/5"
                    data-testid={`accordion-item-faq-${index}`}
                  >
                    <AccordionTrigger className="text-left hover:no-underline py-4">
                      <div className="flex items-start gap-3">
                        <HelpCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                        <span className="font-medium">{faq.question}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-4 pl-8">
                      <p className="text-muted-foreground">{faq.answer}</p>
                      <span className="inline-block mt-2 text-xs px-2 py-1 rounded-full bg-secondary text-secondary-foreground">
                        {faq.category}
                      </span>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </section>
          </TabsContent>
        </Tabs>

        <footer className="text-center pt-8 border-t border-border/50">
          <p className="text-muted-foreground text-sm mb-4" data-testid="text-help-prompt">
            Still have questions? Check the{" "}
            <a 
              href="/api/docs" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline"
              data-testid="link-api-docs"
            >
              API Documentation
            </a>
            {" "}for technical details.
          </p>
          <WouterLink href="/">
            <Button variant="outline" className="gap-2" data-testid="button-footer-dashboard">
              <ArrowLeft className="w-4 h-4" />
              Return to Dashboard
            </Button>
          </WouterLink>
        </footer>
      </motion.div>
    </div>
  );
}
