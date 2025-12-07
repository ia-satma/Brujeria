import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link as WouterLink } from "wouter";
import { 
  Book, 
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
  Download,
  Bot,
  Brain,
  Eye,
  MousePointer,
  Palette,
  Gauge,
  Users,
  Lightbulb,
  Award,
  Network,
  Crown,
  Briefcase,
  Building2,
  UserCheck,
  Database,
  TrendingUp,
  Search,
  FileSearch,
  Type,
  Sparkles,
  Map,
  MousePointerClick,
  Smartphone,
  MessageSquare,
  Star,
  BadgeCheck,
  Timer,
  Code
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

const AGENCY_IDENTITY = {
  name: "Brujer.ia Digital Agency",
  tagline: "Elite Web Intelligence • Powered by AI Agents",
  vision: "Ser la agencia líder mundial en inteligencia web impulsada por agentes de IA",
  mission: "Empoderar a equipos de desarrollo web con insights accionables y benchmarks de clase mundial"
};

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
    title: "Ingresa la URL de tu Cliente",
    description: "Comienza ingresando la URL del sitio web de tu cliente en el primer campo.",
    icon: <Globe className="w-6 h-6" />,
    details: [
      "Ingresa la URL completa incluyendo https://",
      "Asegúrate de que el sitio sea accesible públicamente",
      "El análisis funciona mejor con sitios en producción"
    ]
  },
  {
    id: 2,
    title: "Agrega URLs de Competidores",
    description: "Agrega hasta 5 sitios web de competidores para comparar.",
    icon: <Target className="w-6 h-6" />,
    details: [
      "Haz clic en 'Agregar Competidor' para añadir más URLs",
      "Elige competidores directos o líderes de la industria",
      "Más competidores proporcionan insights comparativos más ricos"
    ]
  },
  {
    id: 3,
    title: "Inicia el Análisis",
    description: "Haz clic en el botón de analizar para comenzar el análisis con IA.",
    icon: <Play className="w-6 h-6" />,
    details: [
      "Nuestros empleados digitales extraerán y analizarán cada sitio web",
      "Observa el progreso en tiempo real en la consola de análisis",
      "El análisis típicamente toma 2-5 minutos dependiendo de la complejidad"
    ]
  },
  {
    id: 4,
    title: "Revisa los Resultados",
    description: "Explora el reporte completo de benchmarking.",
    icon: <BarChart3 className="w-6 h-6" />,
    details: [
      "Ve puntuaciones en diseño visual, UX, contenido y rendimiento técnico",
      "Compara tu sitio contra cada competidor",
      "Identifica fortalezas y áreas de mejora"
    ]
  },
  {
    id: 5,
    title: "Exporta y Comparte",
    description: "Descarga tu reporte como PDF o compártelo con tu equipo.",
    icon: <Download className="w-6 h-6" />,
    details: [
      "Exporta reportes PDF detallados para stakeholders",
      "Usa los insights para priorizar mejoras",
      "Haz seguimiento del progreso ejecutando análisis a lo largo del tiempo"
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
    category: "Primeros Pasos",
    question: "¿Qué tipos de sitios web se pueden analizar?",
    answer: "Nuestra agencia puede analizar cualquier sitio web accesible públicamente. Esto incluye sitios de e-commerce, sitios corporativos, blogs, plataformas SaaS y más. El sitio debe estar en línea y no estar detrás de un login o paywall para un análisis preciso."
  },
  {
    category: "Primeros Pasos",
    question: "¿Cuánto tiempo toma un análisis?",
    answer: "Un análisis típico toma 2-5 minutos dependiendo del número de sitios web competidores y la complejidad de los sitios analizados. Nuestros 18 empleados digitales trabajan en paralelo para entregar resultados rápidamente."
  },
  {
    category: "Primeros Pasos",
    question: "¿Contra cuántos competidores puedo hacer benchmark?",
    answer: "Puedes hacer benchmark contra hasta 5 sitios web competidores en un solo análisis. Recomendamos incluir 2-3 competidores directos para los insights más accionables."
  },
  {
    category: "Análisis y Puntuación",
    question: "¿Qué aspectos de los sitios web se analizan?",
    answer: "Nuestros 6 departamentos especializados analizan: Dirección Creativa (estética visual, color, tipografía), Diseño de Experiencia (UX, navegación, conversión), Estrategia de Contenido (voz de marca, messaging, credibilidad), e Ingeniería Digital (velocidad, SEO, estructura técnica)."
  },
  {
    category: "Análisis y Puntuación",
    question: "¿Cómo se calcula el sistema de puntuación?",
    answer: "Cada categoría se califica en una escala del 1 al 10 por nuestros directores de departamento y validada por el Consejo Ejecutivo. Los puntajes están calibrados contra benchmarks de la industria y mejores prácticas internacionales."
  },
  {
    category: "Análisis y Puntuación",
    question: "¿Puedo confiar en los resultados del análisis de IA?",
    answer: "Nuestra agencia de 18 empleados digitales utiliza un sistema de validación por consenso donde múltiples especialistas verifican cada análisis. Aunque proporcionamos insights valiosos, recomendamos usarlos como complemento a la revisión humana para decisiones críticas."
  },
  {
    category: "Reportes y Exportación",
    question: "¿Puedo exportar los resultados del análisis?",
    answer: "¡Sí! Puedes exportar tu análisis completo como un reporte PDF profesional. El PDF incluye todos los puntajes, comparaciones, insights detallados y recomendaciones accionables de nuestros directores de departamento."
  },
  {
    category: "Reportes y Exportación",
    question: "¿Cuánto tiempo se guardan los reportes de análisis?",
    answer: "Todos los reportes de análisis se guardan en tu cuenta y pueden ser accedidos en cualquier momento. Puedes ver reportes históricos para hacer seguimiento de mejoras a lo largo del tiempo."
  },
  {
    category: "Técnico",
    question: "¿Están seguros los datos de mi sitio web?",
    answer: "Sí. Solo analizamos contenido accesible públicamente y no almacenamos datos sensibles. Todo el análisis se realiza de forma segura y los datos están encriptados en tránsito."
  },
  {
    category: "Técnico",
    question: "¿Qué pasa si el análisis falla o se agota el tiempo?",
    answer: "Si un análisis falla, verifica que todas las URLs sean correctas y accesibles públicamente. Algunos sitios web con protección agresiva contra bots pueden no ser completamente analizables. Intenta de nuevo o contacta soporte si los problemas persisten."
  }
];

interface DigitalEmployee {
  id: string;
  agentName: string;
  displayName: string;
  jobTitle: string;
  department: string;
  level: "executive" | "director" | "specialist";
  icon: React.ReactNode;
  description: string;
  reportsTo: string | null;
}

const digitalEmployees: DigitalEmployee[] = [
  {
    id: "exec_001",
    agentName: "Benchmarking_Manager",
    displayName: "Director General de Inteligencia",
    jobTitle: "Chief Intelligence Officer",
    department: "Governance",
    level: "executive",
    icon: <Crown className="w-5 h-5" />,
    description: "Dirige la estrategia general del consejo de benchmarking y aprueba análisis finales",
    reportsTo: null
  },
  {
    id: "exec_002",
    agentName: "Scraping_Orchestrator",
    displayName: "Director de Operaciones de Datos",
    jobTitle: "Chief Data Operations Officer",
    department: "Operations",
    level: "executive",
    icon: <Database className="w-5 h-5" />,
    description: "Coordina la extracción de datos y garantiza calidad de información",
    reportsTo: "Benchmarking_Manager"
  },
  {
    id: "dir_001",
    agentName: "Visual_Aesthetics_Agent",
    displayName: "Director Creativo",
    jobTitle: "Creative Director",
    department: "Creative Direction",
    level: "director",
    icon: <Palette className="w-5 h-5" />,
    description: "Lidera análisis de estética visual, diseño y coherencia de marca",
    reportsTo: "Benchmarking_Manager"
  },
  {
    id: "dir_002",
    agentName: "UX_Navigation_Agent",
    displayName: "Director de Experiencia de Usuario",
    jobTitle: "Experience Design Director",
    department: "Experience Design",
    level: "director",
    icon: <MousePointer className="w-5 h-5" />,
    description: "Lidera análisis de usabilidad, navegación y conversión",
    reportsTo: "Benchmarking_Manager"
  },
  {
    id: "dir_003",
    agentName: "Content_Storytelling_Agent",
    displayName: "Director de Estrategia de Contenido",
    jobTitle: "Content Strategy Director",
    department: "Content Strategy",
    level: "director",
    icon: <FileText className="w-5 h-5" />,
    description: "Lidera análisis de voz de marca, messaging y credibilidad",
    reportsTo: "Benchmarking_Manager"
  },
  {
    id: "dir_004",
    agentName: "Technical_Performance_Agent",
    displayName: "Director de Ingeniería Digital",
    jobTitle: "Digital Engineering Director",
    department: "Digital Engineering",
    level: "director",
    icon: <Gauge className="w-5 h-5" />,
    description: "Lidera análisis de rendimiento técnico, SEO y estructura",
    reportsTo: "Benchmarking_Manager"
  },
  {
    id: "spec_001",
    agentName: "Color_Palette_Analyzer",
    displayName: "Especialista en Psicología del Color",
    jobTitle: "Color Psychology Specialist",
    department: "Creative Direction",
    level: "specialist",
    icon: <Sparkles className="w-5 h-5" />,
    description: "Analiza paletas, contraste y armonía cromática",
    reportsTo: "Visual_Aesthetics_Agent"
  },
  {
    id: "spec_002",
    agentName: "Typo_Readability_Checker",
    displayName: "Especialista en Tipografía",
    jobTitle: "Typography Specialist",
    department: "Creative Direction",
    level: "specialist",
    icon: <Type className="w-5 h-5" />,
    description: "Evalúa legibilidad, jerarquía y selección tipográfica",
    reportsTo: "Visual_Aesthetics_Agent"
  },
  {
    id: "spec_003",
    agentName: "Design_Trend_Evaluator",
    displayName: "Analista de Tendencias de Diseño",
    jobTitle: "Design Trends Analyst",
    department: "Creative Direction",
    level: "specialist",
    icon: <TrendingUp className="w-5 h-5" />,
    description: "Identifica tendencias actuales y mejores prácticas de diseño",
    reportsTo: "Visual_Aesthetics_Agent"
  },
  {
    id: "spec_004",
    agentName: "Information_Architecture_Mapper",
    displayName: "Especialista en Arquitectura de Información",
    jobTitle: "Information Architecture Specialist",
    department: "Experience Design",
    level: "specialist",
    icon: <Map className="w-5 h-5" />,
    description: "Mapea estructura, flujos y organización de contenido",
    reportsTo: "UX_Navigation_Agent"
  },
  {
    id: "spec_005",
    agentName: "CTA_Effectiveness_Scorer",
    displayName: "Especialista en Conversión",
    jobTitle: "Conversion Specialist",
    department: "Experience Design",
    level: "specialist",
    icon: <MousePointerClick className="w-5 h-5" />,
    description: "Evalúa efectividad de llamadas a la acción y conversión",
    reportsTo: "UX_Navigation_Agent"
  },
  {
    id: "spec_006",
    agentName: "Responsive_Design_Inferrer",
    displayName: "Especialista en Multi-Dispositivo",
    jobTitle: "Multi-Device Specialist",
    department: "Experience Design",
    level: "specialist",
    icon: <Smartphone className="w-5 h-5" />,
    description: "Analiza adaptación responsiva y experiencia móvil",
    reportsTo: "UX_Navigation_Agent"
  },
  {
    id: "spec_007",
    agentName: "Brand_Voice_Validator",
    displayName: "Especialista en Voz de Marca",
    jobTitle: "Brand Voice Specialist",
    department: "Content Strategy",
    level: "specialist",
    icon: <MessageSquare className="w-5 h-5" />,
    description: "Valida tono, personalidad y consistencia de marca",
    reportsTo: "Content_Storytelling_Agent"
  },
  {
    id: "spec_008",
    agentName: "Thought_Leadership_Scrutinizer",
    displayName: "Analista de Liderazgo de Pensamiento",
    jobTitle: "Thought Leadership Analyst",
    department: "Content Strategy",
    level: "specialist",
    icon: <Star className="w-5 h-5" />,
    description: "Evalúa autoridad, expertise y posicionamiento",
    reportsTo: "Content_Storytelling_Agent"
  },
  {
    id: "spec_009",
    agentName: "Credibility_Evidence_Collector",
    displayName: "Especialista en Credibilidad",
    jobTitle: "Credibility Specialist",
    department: "Content Strategy",
    level: "specialist",
    icon: <BadgeCheck className="w-5 h-5" />,
    description: "Identifica señales de confianza y evidencia social",
    reportsTo: "Content_Storytelling_Agent"
  },
  {
    id: "spec_010",
    agentName: "Page_Speed_Predictor",
    displayName: "Especialista en Rendimiento",
    jobTitle: "Performance Specialist",
    department: "Digital Engineering",
    level: "specialist",
    icon: <Timer className="w-5 h-5" />,
    description: "Mide Core Web Vitals y optimización de velocidad",
    reportsTo: "Technical_Performance_Agent"
  },
  {
    id: "spec_011",
    agentName: "SEO_Signal_Detector",
    displayName: "Especialista en SEO",
    jobTitle: "SEO Specialist",
    department: "Digital Engineering",
    level: "specialist",
    icon: <Search className="w-5 h-5" />,
    description: "Analiza señales SEO, meta tags y posicionamiento",
    reportsTo: "Technical_Performance_Agent"
  },
  {
    id: "spec_012",
    agentName: "Content_Structure_Auditor",
    displayName: "Especialista en Estructura de Contenido",
    jobTitle: "Content Structure Specialist",
    department: "Digital Engineering",
    level: "specialist",
    icon: <Code className="w-5 h-5" />,
    description: "Audita semántica HTML, accesibilidad y estándares web",
    reportsTo: "Technical_Performance_Agent"
  }
];

interface DepartmentCard {
  icon: React.ReactNode;
  department: string;
  departmentEs: string;
  color: string;
  description: string;
  director: {
    name: string;
    title: string;
    agentName: string;
  };
  specialists: {
    name: string;
    title: string;
    description: string;
  }[];
}

const departmentCards: DepartmentCard[] = [
  {
    icon: <Crown className="w-8 h-8" />,
    department: "Governance",
    departmentEs: "Gobernanza",
    color: "bg-[#2A3E61]",
    description: "Coordinación estratégica, toma de decisiones ejecutivas y aseguramiento de calidad del consejo.",
    director: {
      name: "Director General de Inteligencia",
      title: "Chief Intelligence Officer",
      agentName: "Benchmarking_Manager"
    },
    specialists: []
  },
  {
    icon: <Database className="w-8 h-8" />,
    department: "Operations",
    departmentEs: "Operaciones",
    color: "bg-[#59E2DE]",
    description: "Extracción de datos, infraestructura de scraping y gestión de información.",
    director: {
      name: "Director de Operaciones de Datos",
      title: "Chief Data Operations Officer",
      agentName: "Scraping_Orchestrator"
    },
    specialists: []
  },
  {
    icon: <Palette className="w-8 h-8" />,
    department: "Creative Direction",
    departmentEs: "Dirección Creativa",
    color: "bg-[#2A3E61]",
    description: "Análisis de estética visual, diseño gráfico, paletas de color, tipografía y coherencia de marca.",
    director: {
      name: "Director Creativo",
      title: "Creative Director",
      agentName: "Visual_Aesthetics_Agent"
    },
    specialists: [
      {
        name: "Especialista en Psicología del Color",
        title: "Color Psychology Specialist",
        description: "Analiza paletas, contraste y armonía cromática"
      },
      {
        name: "Especialista en Tipografía",
        title: "Typography Specialist",
        description: "Evalúa legibilidad, jerarquía y selección tipográfica"
      },
      {
        name: "Analista de Tendencias de Diseño",
        title: "Design Trends Analyst",
        description: "Identifica tendencias actuales y mejores prácticas"
      }
    ]
  },
  {
    icon: <MousePointer className="w-8 h-8" />,
    department: "Experience Design",
    departmentEs: "Diseño de Experiencia",
    color: "bg-[#59E2DE]",
    description: "Evaluación de UX, navegación, arquitectura de información y optimización de conversión.",
    director: {
      name: "Director de Experiencia de Usuario",
      title: "Experience Design Director",
      agentName: "UX_Navigation_Agent"
    },
    specialists: [
      {
        name: "Especialista en Arquitectura de Información",
        title: "IA Specialist",
        description: "Mapea estructura, flujos y organización"
      },
      {
        name: "Especialista en Conversión",
        title: "Conversion Specialist",
        description: "Evalúa efectividad de CTAs y conversión"
      },
      {
        name: "Especialista en Multi-Dispositivo",
        title: "Multi-Device Specialist",
        description: "Analiza experiencia responsiva y móvil"
      }
    ]
  },
  {
    icon: <FileText className="w-8 h-8" />,
    department: "Content Strategy",
    departmentEs: "Estrategia de Contenido",
    color: "bg-[#2A3E61]",
    description: "Análisis de voz de marca, messaging, liderazgo de pensamiento y señales de credibilidad.",
    director: {
      name: "Director de Estrategia de Contenido",
      title: "Content Strategy Director",
      agentName: "Content_Storytelling_Agent"
    },
    specialists: [
      {
        name: "Especialista en Voz de Marca",
        title: "Brand Voice Specialist",
        description: "Valida tono, personalidad y consistencia"
      },
      {
        name: "Analista de Liderazgo de Pensamiento",
        title: "Thought Leadership Analyst",
        description: "Evalúa autoridad y posicionamiento"
      },
      {
        name: "Especialista en Credibilidad",
        title: "Credibility Specialist",
        description: "Identifica señales de confianza"
      }
    ]
  },
  {
    icon: <Gauge className="w-8 h-8" />,
    department: "Digital Engineering",
    departmentEs: "Ingeniería Digital",
    color: "bg-[#59E2DE]",
    description: "Medición de rendimiento técnico, optimización SEO, velocidad de carga y estructura de código.",
    director: {
      name: "Director de Ingeniería Digital",
      title: "Digital Engineering Director",
      agentName: "Technical_Performance_Agent"
    },
    specialists: [
      {
        name: "Especialista en Rendimiento",
        title: "Performance Specialist",
        description: "Mide Core Web Vitals y velocidad"
      },
      {
        name: "Especialista en SEO",
        title: "SEO Specialist",
        description: "Analiza señales SEO y posicionamiento"
      },
      {
        name: "Especialista en Estructura de Contenido",
        title: "Content Structure Specialist",
        description: "Audita semántica HTML y estándares"
      }
    ]
  }
];

interface LayerConfig {
  id: number;
  name: string;
  description: string;
  icon: React.ReactNode;
}

const layerConfigurations: LayerConfig[] = [
  {
    id: 1,
    name: "Identidad",
    description: "Personalidad del agente, arquetipo, tono, objetivos",
    icon: <Users className="w-4 h-4" />
  },
  {
    id: 2,
    name: "Seguridad",
    description: "Límites, lineamientos éticos, manejo de datos",
    icon: <Shield className="w-4 h-4" />
  },
  {
    id: 3,
    name: "Metodología",
    description: "Razonamiento, marcos de puntuación, estructura de salida",
    icon: <Target className="w-4 h-4" />
  },
  {
    id: 4,
    name: "Conocimiento Estático",
    description: "Experiencia fundamental, principios, mejores prácticas",
    icon: <Book className="w-4 h-4" />
  },
  {
    id: 5,
    name: "Datos Dinámicos",
    description: "Configuración consciente del contexto, contexto de sesión, conocimiento previo",
    icon: <Zap className="w-4 h-4" />
  },
  {
    id: 6,
    name: "Herramientas",
    description: "Definiciones de sub-agentes, modos de ejecución, manejo de errores",
    icon: <Layers className="w-4 h-4" />
  },
  {
    id: 7,
    name: "Orquestación",
    description: "Colaboración entre agentes, mecanismos de consenso",
    icon: <Network className="w-4 h-4" />
  },
  {
    id: 8,
    name: "Metacognición",
    description: "Auto-conciencia (confianza, detección de sesgos, limitaciones)",
    icon: <Brain className="w-4 h-4" />
  },
  {
    id: 9,
    name: "Evolución",
    description: "Mecanismos de auto-mejora (eventos de aprendizaje, generación de propuestas)",
    icon: <Lightbulb className="w-4 h-4" />
  }
];

const satmaBenefits = [
  {
    icon: <Brain className="w-6 h-6" />,
    title: "18 Empleados Digitales",
    description: "Una agencia completa de IA con ejecutivos, directores y especialistas trabajando en paralelo para analizar cada aspecto de tu sitio."
  },
  {
    icon: <Users className="w-6 h-6" />,
    title: "Diseñado para Equipos Creativos",
    description: "Creado específicamente para equipos de desarrollo web y diseñadores que buscan crear sitios excepcionales."
  },
  {
    icon: <Lightbulb className="w-6 h-6" />,
    title: "Insights Accionables",
    description: "No solo identificamos problemas, sino que proporcionamos recomendaciones claras y priorizadas de nuestros directores de departamento."
  },
  {
    icon: <Award className="w-6 h-6" />,
    title: "Estándares de la Industria",
    description: "Todos los análisis están calibrados contra las mejores prácticas y estándares internacionales del diseño web."
  }
];

export default function UserGuide() {
  const [expandedStep, setExpandedStep] = useState<number | null>(1);
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const categories = ["all", ...Array.from(new Set(faqItems.map(item => item.category)))];
  const filteredFAQs = activeCategory === "all" 
    ? faqItems 
    : faqItems.filter(item => item.category === activeCategory);

  const executiveCouncil = digitalEmployees.filter(e => e.level === "executive");
  const directors = digitalEmployees.filter(e => e.level === "director");
  const specialists = digitalEmployees.filter(e => e.level === "specialist");

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-[#F5F9FC] to-white px-4 py-6 md:p-12 font-sans">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-5xl mx-auto"
      >
        <nav className="flex items-center justify-between mb-8" aria-label="Navegación">
          <WouterLink href="/" aria-label="Regresar al dashboard principal">
            <Button 
              variant="ghost" 
              className="gap-2 text-[#2A3E61]/70 hover:text-[#2A3E61]"
              data-testid="button-back-dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
              Regresar
            </Button>
          </WouterLink>
          <a href="https://satma.mx" target="_blank" rel="noopener noreferrer">
            <img 
              src="https://satma.mx/wp-content/uploads/2023/03/logo-azul-png.png" 
              alt="SATMA" 
              className="h-8 object-contain"
            />
          </a>
        </nav>

        <header className="text-center mb-12" role="banner">
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3 }}
            className="inline-flex items-center gap-3 mb-4"
          >
            <div className="p-3 rounded-xl bg-[#2A3E61]/10 border border-[#2A3E61]/20">
              <Book className="w-8 h-8 text-[#2A3E61]" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-[#2A3E61]">
              Guía de Usuario
            </h1>
          </motion.div>
          <p className="text-lg text-[#2A3E61]/70 max-w-2xl mx-auto font-paragraph" data-testid="text-guide-description">
            Conoce cómo {AGENCY_IDENTITY.name} y sus 18 empleados digitales 
            ayudan a tu equipo a crear sitios web excepcionales.
          </p>
        </header>

        <Tabs defaultValue="platform" className="mb-12">
          <TabsList className="grid w-full grid-cols-4 mb-8 bg-[#2A3E61]/5" data-testid="tabs-guide-sections">
            <TabsTrigger value="platform" className="gap-2 data-[state=active]:bg-[#2A3E61] data-[state=active]:text-white" data-testid="tab-platform">
              <Bot className="w-4 h-4" />
              <span className="hidden sm:inline">Plataforma</span>
            </TabsTrigger>
            <TabsTrigger value="agents" className="gap-2 data-[state=active]:bg-[#2A3E61] data-[state=active]:text-white" data-testid="tab-agents">
              <Network className="w-4 h-4" />
              <span className="hidden sm:inline">Agentes</span>
            </TabsTrigger>
            <TabsTrigger value="quickstart" className="gap-2 data-[state=active]:bg-[#2A3E61] data-[state=active]:text-white" data-testid="tab-quickstart">
              <Play className="w-4 h-4" />
              <span className="hidden sm:inline">Tutorial</span>
            </TabsTrigger>
            <TabsTrigger value="faq" className="gap-2 data-[state=active]:bg-[#2A3E61] data-[state=active]:text-white" data-testid="tab-faq">
              <HelpCircle className="w-4 h-4" />
              <span className="hidden sm:inline">FAQ</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="platform">
            <section aria-labelledby="platform-heading">
              <h2 id="platform-heading" className="text-2xl font-semibold mb-6 flex items-center gap-2 text-[#2A3E61]">
                <Building2 className="w-6 h-6 text-[#59E2DE]" />
                {AGENCY_IDENTITY.name}
              </h2>
              
              <Card className="mb-8 border-[#59E2DE]/30 bg-gradient-to-r from-[#59E2DE]/5 to-transparent" data-testid="card-agency-identity">
                <CardContent className="pt-6">
                  <div className="text-center mb-6">
                    <p className="text-sm font-medium text-[#59E2DE] tracking-wider uppercase mb-2" data-testid="text-agency-tagline">
                      {AGENCY_IDENTITY.tagline}
                    </p>
                    <h3 className="text-2xl font-bold text-[#2A3E61] mb-4" data-testid="text-agency-name">
                      {AGENCY_IDENTITY.name}
                    </h3>
                    <div className="flex justify-center gap-2 mb-4">
                      <span className="px-3 py-1 bg-[#2A3E61] text-white text-xs rounded-full font-medium" data-testid="badge-employee-count">
                        18 Empleados Digitales
                      </span>
                      <span className="px-3 py-1 bg-[#59E2DE] text-[#2A3E61] text-xs rounded-full font-medium" data-testid="badge-department-count">
                        6 Departamentos
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="p-4 bg-white rounded-lg border border-[#2A3E61]/10" data-testid="card-agency-vision">
                      <div className="flex items-center gap-2 mb-2">
                        <Eye className="w-5 h-5 text-[#59E2DE]" />
                        <h4 className="font-semibold text-[#2A3E61]">Visión</h4>
                      </div>
                      <p className="text-sm text-[#2A3E61]/70 font-paragraph" data-testid="text-agency-vision">
                        {AGENCY_IDENTITY.vision}
                      </p>
                    </div>
                    <div className="p-4 bg-white rounded-lg border border-[#2A3E61]/10" data-testid="card-agency-mission">
                      <div className="flex items-center gap-2 mb-2">
                        <Target className="w-5 h-5 text-[#59E2DE]" />
                        <h4 className="font-semibold text-[#2A3E61]">Misión</h4>
                      </div>
                      <p className="text-sm text-[#2A3E61]/70 font-paragraph" data-testid="text-agency-mission">
                        {AGENCY_IDENTITY.mission}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="mb-8 border-[#2A3E61]/10">
                <CardContent className="pt-6">
                  <div className="grid md:grid-cols-2 gap-6 items-center">
                    <div>
                      <h3 className="text-xl font-semibold mb-4 text-[#2A3E61]">
                        Inteligencia Artificial al Servicio del Diseño Web
                      </h3>
                      <p className="text-[#2A3E61]/70 mb-4 font-paragraph">
                        {AGENCY_IDENTITY.name} es una agencia digital elite impulsada por 
                        inteligencia artificial. Fue desarrollada por <strong>SATMA - Agencia Creativa</strong> para 
                        ayudar a nuestro equipo de desarrollo a crear las mejores páginas de internet para nuestros clientes.
                      </p>
                      <p className="text-[#2A3E61]/70 font-paragraph">
                        Con 18 empleados digitales organizados en 6 departamentos especializados, 
                        nuestra agencia ofrece análisis profundo de sitios web, comparaciones competitivas 
                        y recomendaciones accionables.
                      </p>
                    </div>
                    <div className="flex justify-center">
                      <div className="relative">
                        <div className="absolute inset-0 bg-[#59E2DE]/20 blur-3xl rounded-full"></div>
                        <img 
                          src="https://satma.mx/wp-content/uploads/2023/03/logo-azul-png.png" 
                          alt="SATMA" 
                          className="relative w-48 h-auto"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <h3 className="text-xl font-semibold mb-6 text-[#2A3E61]">
                ¿Cómo Ayuda a los Equipos de Desarrollo?
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                {satmaBenefits.map((benefit, index) => (
                  <motion.div
                    key={benefit.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="h-full border-[#2A3E61]/10 hover:border-[#59E2DE]/50 transition-colors" data-testid={`card-benefit-${index}`}>
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-4">
                          <div className="p-2 rounded-lg bg-[#59E2DE]/20 text-[#2A3E61]">
                            {benefit.icon}
                          </div>
                          <div>
                            <h4 className="font-semibold text-[#2A3E61] mb-1">{benefit.title}</h4>
                            <p className="text-sm text-[#2A3E61]/70 font-paragraph">{benefit.description}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              <Card className="border-[#2A3E61]/20 bg-[#2A3E61]">
                <CardContent className="pt-6 text-white">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-full bg-[#59E2DE]/20">
                      <Eye className="w-6 h-6 text-[#59E2DE]" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-lg mb-2">Nuestra Filosofía</h4>
                      <p className="text-white/80 font-paragraph">
                        En SATMA creemos que cada cliente es <strong>ÚNICO</strong>. Por eso desarrollamos 
                        esta agencia digital: para entender profundamente cada proyecto, analizar la competencia, 
                        y crear soluciones web que no solo sean hermosas, sino que también cumplan objetivos 
                        de negocio reales. Esta plataforma es el resultado de nuestra experiencia trabajando 
                        con servicios jurídicos, médicos, asociaciones profesionales y comercializadoras.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>
          </TabsContent>

          <TabsContent value="agents">
            <section aria-labelledby="agents-heading">
              <h2 id="agents-heading" className="text-2xl font-semibold mb-6 flex items-center gap-2 text-[#2A3E61]">
                <Users className="w-6 h-6 text-[#59E2DE]" />
                Nuestros 18 Empleados Digitales
              </h2>
              <p className="text-[#2A3E61]/70 mb-8 font-paragraph" data-testid="text-agents-intro">
                {AGENCY_IDENTITY.name} opera como una agencia digital real con una estructura organizacional 
                completa. Nuestros 18 empleados digitales trabajan en paralelo, cada uno con responsabilidades 
                específicas, KPIs definidos y trayectorias de desarrollo profesional.
              </p>

              <Card className="border-[#59E2DE]/30 bg-gradient-to-r from-[#59E2DE]/10 to-transparent mb-8" data-testid="card-org-structure">
                <CardContent className="pt-6">
                  <h3 className="text-lg font-semibold mb-6 text-[#2A3E61] flex items-center gap-2">
                    <Layers className="w-5 h-5" />
                    Estructura Organizacional
                  </h3>
                  
                  <div className="space-y-6">
                    <div className="p-4 bg-white rounded-lg border-2 border-[#2A3E61]" data-testid="org-level-executive">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-[#2A3E61] flex items-center justify-center">
                          <Crown className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h4 className="font-bold text-[#2A3E61]">Consejo Ejecutivo</h4>
                          <p className="text-xs text-[#2A3E61]/60">{executiveCouncil.length} empleados • Decisiones estratégicas</p>
                        </div>
                      </div>
                      <div className="grid md:grid-cols-2 gap-3">
                        {executiveCouncil.map((employee) => (
                          <div key={employee.id} className="flex items-center gap-3 p-3 bg-[#2A3E61]/5 rounded-lg" data-testid={`employee-${employee.id}`}>
                            <div className="w-8 h-8 rounded-full bg-[#2A3E61] flex items-center justify-center text-white">
                              {employee.icon}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-sm text-[#2A3E61] truncate">{employee.displayName}</p>
                              <p className="text-xs text-[#2A3E61]/60 truncate">{employee.jobTitle}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-center">
                      <div className="w-0.5 h-6 bg-[#2A3E61]/30"></div>
                    </div>

                    <div className="p-4 bg-white rounded-lg border-2 border-[#59E2DE]" data-testid="org-level-directors">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-[#59E2DE] flex items-center justify-center">
                          <Briefcase className="w-5 h-5 text-[#2A3E61]" />
                        </div>
                        <div>
                          <h4 className="font-bold text-[#2A3E61]">Directores de Departamento</h4>
                          <p className="text-xs text-[#2A3E61]/60">{directors.length} empleados • Liderazgo de áreas especializadas</p>
                        </div>
                      </div>
                      <div className="grid md:grid-cols-2 gap-3">
                        {directors.map((employee) => (
                          <div key={employee.id} className="flex items-center gap-3 p-3 bg-[#59E2DE]/10 rounded-lg" data-testid={`employee-${employee.id}`}>
                            <div className="w-8 h-8 rounded-full bg-[#59E2DE] flex items-center justify-center text-[#2A3E61]">
                              {employee.icon}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-sm text-[#2A3E61] truncate">{employee.displayName}</p>
                              <p className="text-xs text-[#2A3E61]/60 truncate">{employee.department}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-center">
                      <div className="w-0.5 h-6 bg-[#2A3E61]/30"></div>
                    </div>

                    <div className="p-4 bg-white rounded-lg border-2 border-[#2A3E61]/20" data-testid="org-level-specialists">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-[#2A3E61]/20 flex items-center justify-center">
                          <UserCheck className="w-5 h-5 text-[#2A3E61]" />
                        </div>
                        <div>
                          <h4 className="font-bold text-[#2A3E61]">Especialistas</h4>
                          <p className="text-xs text-[#2A3E61]/60">{specialists.length} empleados • Análisis granular y especializado</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                        {specialists.map((employee) => (
                          <div key={employee.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg" data-testid={`employee-${employee.id}`}>
                            <div className="w-6 h-6 rounded-full bg-[#2A3E61]/10 flex items-center justify-center text-[#2A3E61] flex-shrink-0">
                              {employee.icon}
                            </div>
                            <p className="text-xs text-[#2A3E61] truncate">{employee.displayName.replace("Especialista en ", "").replace("Analista de ", "")}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-wrap justify-center gap-2 sm:gap-4">
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-[#2A3E61]/70">
                      <div className="w-3 h-3 rounded-full bg-[#2A3E61]"></div>
                      <span>Ejecutivos ({executiveCouncil.length})</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-[#2A3E61]/70">
                      <div className="w-3 h-3 rounded-full bg-[#59E2DE]"></div>
                      <span>Directores ({directors.length})</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-[#2A3E61]/70">
                      <div className="w-3 h-3 rounded-full bg-[#2A3E61]/20"></div>
                      <span>Especialistas ({specialists.length})</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <h3 className="text-xl font-semibold mb-6 text-[#2A3E61]">Departamentos de la Agencia</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {departmentCards.map((dept, index) => (
                  <motion.div
                    key={dept.department}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="h-full border-[#2A3E61]/10 hover:border-[#59E2DE]/50 transition-all hover:shadow-lg" data-testid={`card-department-${dept.department.toLowerCase().replace(/\s+/g, '-')}`}>
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-4 mb-4">
                          <div className={`p-3 rounded-xl ${dept.color} text-white`}>
                            {dept.icon}
                          </div>
                          <div>
                            <h4 className="font-semibold text-lg text-[#2A3E61]">{dept.departmentEs}</h4>
                            <p className="text-xs text-[#59E2DE] font-medium">{dept.department}</p>
                            <p className="text-sm text-[#2A3E61]/70 font-paragraph mt-1">{dept.description}</p>
                          </div>
                        </div>
                        
                        <div className="p-3 bg-[#2A3E61]/5 rounded-lg mb-3">
                          <div className="flex items-center gap-2 mb-1">
                            <Crown className="w-4 h-4 text-[#2A3E61]" />
                            <span className="text-xs font-semibold text-[#2A3E61] uppercase">Director</span>
                          </div>
                          <p className="font-medium text-[#2A3E61]">{dept.director.name}</p>
                          <p className="text-xs text-[#2A3E61]/60">{dept.director.title}</p>
                        </div>

                        {dept.specialists.length > 0 && (
                          <div className="pl-4 border-l-2 border-[#59E2DE]/30">
                            <p className="text-xs font-semibold text-[#2A3E61]/50 uppercase mb-3">Especialistas:</p>
                            <ul className="space-y-3">
                              {dept.specialists.map((specialist, idx) => (
                                <li key={idx} className="text-sm font-paragraph">
                                  <div className="flex items-start gap-2">
                                    <span className="w-2 h-2 rounded-full bg-[#59E2DE] mt-1.5 flex-shrink-0"></span>
                                    <div>
                                      <span className="font-medium text-[#2A3E61]">{specialist.name}</span>
                                      <p className="text-xs text-[#2A3E61]/60 mt-0.5">{specialist.description}</p>
                                    </div>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              <Card className="border-[#2A3E61]/20 bg-gradient-to-br from-white to-[#F5F9FC]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-[#2A3E61]">
                    <Shield className="w-5 h-5 text-[#59E2DE]" />
                    Configuración Avanzada de 9 Capas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-[#2A3E61]/70 mb-6 font-paragraph">
                    Cada empleado digital está configurado con un sistema sofisticado de 9 capas que define su comportamiento, 
                    conocimiento y capacidad de evolución profesional:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {layerConfigurations.map((layer) => (
                      <motion.div 
                        key={layer.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: layer.id * 0.05 }}
                        className="group p-4 bg-white rounded-lg border border-[#2A3E61]/10 hover:border-[#59E2DE]/50 hover:shadow-md transition-all"
                        data-testid={`layer-config-${layer.id}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-[#2A3E61] to-[#59E2DE] text-white flex items-center justify-center font-mono text-sm font-bold shadow-sm">
                            {layer.id}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[#59E2DE]">{layer.icon}</span>
                              <h5 className="font-semibold text-[#2A3E61] text-sm">{layer.name}</h5>
                            </div>
                            <p className="text-xs text-[#2A3E61]/60 font-paragraph leading-relaxed">
                              {layer.description}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  <div className="mt-6 p-4 bg-[#2A3E61]/5 rounded-lg border border-[#2A3E61]/10">
                    <p className="text-xs text-[#2A3E61]/70 font-paragraph flex items-start gap-2">
                      <Lightbulb className="w-4 h-4 text-[#59E2DE] flex-shrink-0 mt-0.5" />
                      <span>
                        Esta arquitectura de 9 capas permite que cada empleado digital sea altamente especializado, 
                        seguro y capaz de aprender de cada análisis para mejorar continuamente su desempeño profesional.
                      </span>
                    </p>
                  </div>
                </CardContent>
              </Card>
            </section>
          </TabsContent>

          <TabsContent value="quickstart">
            <section aria-labelledby="quickstart-heading">
              <h2 id="quickstart-heading" className="text-2xl font-semibold mb-6 flex items-center gap-2 text-[#2A3E61]">
                <Zap className="w-6 h-6 text-[#59E2DE]" />
                Tutorial Rápido
              </h2>
              <p className="text-[#2A3E61]/70 mb-8 font-paragraph" data-testid="text-quickstart-intro">
                Sigue estos simples pasos para ejecutar tu primer análisis de benchmarking web con nuestros 18 empleados digitales.
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
                      className={`cursor-pointer transition-all duration-300 focus-visible:ring-2 focus-visible:ring-[#2A3E61] focus-visible:ring-offset-2 focus-visible:outline-none border-[#2A3E61]/10 ${
                        expandedStep === step.id 
                          ? "border-[#59E2DE]/50 bg-[#59E2DE]/5" 
                          : "hover:border-[#59E2DE]/30"
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
                      aria-label={`Paso ${step.id}: ${step.title}. ${expandedStep === step.id ? 'Presiona para colapsar' : 'Presiona para expandir'}`}
                      data-testid={`card-step-${step.id}`}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-center gap-4">
                          <div className={`flex items-center justify-center w-12 h-12 rounded-full ${
                            expandedStep === step.id 
                              ? "bg-[#2A3E61] text-white" 
                              : "bg-[#59E2DE]/20 text-[#2A3E61]"
                          }`}>
                            <span className="font-bold text-lg">{step.id}</span>
                          </div>
                          <div className="flex-1">
                            <CardTitle className="text-lg flex items-center gap-2 text-[#2A3E61]">
                              <span className="text-[#59E2DE]">{step.icon}</span>
                              {step.title}
                            </CardTitle>
                            <p className="text-sm text-[#2A3E61]/70 mt-1 font-paragraph">
                              {step.description}
                            </p>
                          </div>
                          <motion.div
                            animate={{ rotate: expandedStep === step.id ? 90 : 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <ChevronRight className="w-5 h-5 text-[#2A3E61]/50" />
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
                            <CardContent className="pt-4 border-t border-[#2A3E61]/10">
                              <ul className="space-y-2">
                                {step.details.map((detail, idx) => (
                                  <li key={idx} className="flex items-start gap-2 text-sm font-paragraph">
                                    <CheckCircle className="w-4 h-4 text-[#59E2DE] mt-0.5 flex-shrink-0" />
                                    <span className="text-[#2A3E61]/70">{detail}</span>
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
                  <Button size="lg" className="gap-2 bg-[#2A3E61] hover:bg-[#2A3E61]/90" data-testid="button-start-analysis">
                    <Play className="w-5 h-5" />
                    Iniciar Tu Primer Análisis
                  </Button>
                </WouterLink>
              </div>
            </section>
          </TabsContent>

          <TabsContent value="faq">
            <section aria-labelledby="faq-heading">
              <h2 id="faq-heading" className="text-2xl font-semibold mb-6 flex items-center gap-2 text-[#2A3E61]">
                <HelpCircle className="w-6 h-6 text-[#59E2DE]" />
                Preguntas Frecuentes
              </h2>

              <div className="flex flex-wrap gap-2 mb-6">
                {categories.map((category) => (
                  <Button
                    key={category}
                    variant={activeCategory === category ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveCategory(category)}
                    className={`capitalize ${activeCategory === category ? 'bg-[#2A3E61] text-white' : 'border-[#2A3E61]/30 text-[#2A3E61]'}`}
                    data-testid={`button-faq-category-${category.replace(/\s+/g, '-').toLowerCase()}`}
                  >
                    {category === "all" ? "Todas las Preguntas" : category}
                  </Button>
                ))}
              </div>

              <Accordion type="single" collapsible className="space-y-2" data-testid="accordion-faq">
                {filteredFAQs.map((faq, index) => (
                  <AccordionItem 
                    key={index} 
                    value={`faq-${index}`}
                    className="border rounded-lg px-4 border-[#2A3E61]/10 data-[state=open]:border-[#59E2DE]/50 data-[state=open]:bg-[#59E2DE]/5"
                    data-testid={`accordion-item-faq-${index}`}
                  >
                    <AccordionTrigger className="text-left hover:no-underline py-4">
                      <div className="flex items-start gap-3">
                        <HelpCircle className="w-5 h-5 text-[#59E2DE] mt-0.5 flex-shrink-0" />
                        <span className="font-medium text-[#2A3E61]">{faq.question}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-4 pl-8">
                      <p className="text-[#2A3E61]/70 font-paragraph">{faq.answer}</p>
                      <span className="inline-block mt-2 text-xs px-2 py-1 rounded-full bg-[#2A3E61]/10 text-[#2A3E61]">
                        {faq.category}
                      </span>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </section>
          </TabsContent>
        </Tabs>

        <footer className="text-center pt-8 border-t border-[#2A3E61]/10">
          <p className="text-[#2A3E61]/60 text-sm mb-4 font-paragraph" data-testid="text-help-prompt">
            ¿Tienes más preguntas? Consulta la{" "}
            <a 
              href="/api/docs" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[#2A3E61] hover:text-[#59E2DE] transition-colors"
              data-testid="link-api-docs"
            >
              Documentación de API
            </a>
            {" "}para detalles técnicos o contáctanos en{" "}
            <a 
              href="mailto:santiago@satma.mx"
              className="text-[#2A3E61] hover:text-[#59E2DE] transition-colors"
            >
              santiago@satma.mx
            </a>
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <WouterLink href="/">
              <Button variant="outline" className="gap-2 border-[#2A3E61] text-[#2A3E61] hover:bg-[#2A3E61] hover:text-white" data-testid="button-footer-dashboard">
                <ArrowLeft className="w-4 h-4" />
                Regresar al Dashboard
              </Button>
            </WouterLink>
            <a href="https://satma.mx" target="_blank" rel="noopener noreferrer">
              <Button className="gap-2 bg-[#2A3E61] hover:bg-[#2A3E61]/90">
                <Globe className="w-4 h-4" />
                Visitar SATMA
              </Button>
            </a>
          </div>
          <p className="text-xs text-[#2A3E61]/40 mt-6 font-paragraph">
            © 2025 SATMA - Agencia Creativa | Monterrey, Nuevo León, México | +52 (81) 2474 9049
          </p>
        </footer>
      </motion.div>
    </div>
  );
}
