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
  Network
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
      "Nuestros agentes de IA extraerán y analizarán cada sitio web",
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
    answer: "Nuestra herramienta puede analizar cualquier sitio web accesible públicamente. Esto incluye sitios de e-commerce, sitios corporativos, blogs, plataformas SaaS y más. El sitio debe estar en línea y no estar detrás de un login o paywall para un análisis preciso."
  },
  {
    category: "Primeros Pasos",
    question: "¿Cuánto tiempo toma un análisis?",
    answer: "Un análisis típico toma 2-5 minutos dependiendo del número de sitios web competidores y la complejidad de los sitios analizados. Puedes ver el progreso en tiempo real a través de nuestra consola de análisis."
  },
  {
    category: "Primeros Pasos",
    question: "¿Contra cuántos competidores puedo hacer benchmark?",
    answer: "Puedes hacer benchmark contra hasta 5 sitios web competidores en un solo análisis. Recomendamos incluir 2-3 competidores directos para los insights más accionables."
  },
  {
    category: "Análisis y Puntuación",
    question: "¿Qué aspectos de los sitios web se analizan?",
    answer: "Nuestros agentes de IA analizan cuatro áreas clave: Estética Visual (calidad del diseño, armonía de color, tipografía), UX y Navegación (usabilidad, arquitectura de información, accesibilidad), Contenido y Storytelling (claridad del mensaje, voz de marca, engagement), y Rendimiento Técnico (tiempos de carga, responsividad móvil, factores SEO)."
  },
  {
    category: "Análisis y Puntuación",
    question: "¿Cómo se calcula el sistema de puntuación?",
    answer: "Cada categoría se califica en una escala del 1 al 10 por agentes de IA especializados. El puntaje general es un promedio ponderado de todas las categorías. Los puntajes están calibrados contra benchmarks de la industria y mejores prácticas."
  },
  {
    category: "Análisis y Puntuación",
    question: "¿Puedo confiar en los resultados del análisis de IA?",
    answer: "Nuestro sistema multi-agente usa modelos de IA especializados entrenados en mejores prácticas de diseño web y UX. Aunque el análisis de IA proporciona insights valiosos, recomendamos usarlo como un insumo junto con revisión de expertos humanos para decisiones críticas."
  },
  {
    category: "Reportes y Exportación",
    question: "¿Puedo exportar los resultados del análisis?",
    answer: "¡Sí! Puedes exportar tu análisis completo como un reporte PDF. El PDF incluye todos los puntajes, comparaciones, insights detallados y recomendaciones accionables."
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

interface SubAgent {
  name: string;
  description: string;
}

interface AgentCard {
  icon: React.ReactNode;
  title: string;
  color: string;
  description: string;
  subAgents: SubAgent[];
}

const agentCards: AgentCard[] = [
  {
    icon: <Palette className="w-8 h-8" />,
    title: "Agente de Estética Visual",
    color: "bg-[#2A3E61]",
    description: "Especializado en analizar el diseño visual, paleta de colores, tipografía, composición de imágenes y coherencia de marca.",
    subAgents: [
      {
        name: "Sub-agente de Armonía de Color",
        description: "Analiza paletas, contraste y teoría del color"
      },
      {
        name: "Sub-agente de Evaluación Tipográfica",
        description: "Evalúa legibilidad, jerarquía y selección de fuentes"
      },
      {
        name: "Sub-agente de Composición Visual",
        description: "Examina balance, espaciado y alineación"
      },
      {
        name: "Sub-agente de Consistencia de Marca",
        description: "Verifica coherencia de elementos visuales de marca"
      }
    ]
  },
  {
    icon: <MousePointer className="w-8 h-8" />,
    title: "Agente de UX y Navegación",
    color: "bg-[#59E2DE]",
    description: "Evalúa la usabilidad, arquitectura de información, patrones de navegación y accesibilidad del sitio.",
    subAgents: [
      {
        name: "Sub-agente de Flujo de Usuario",
        description: "Mapea recorridos y detecta puntos de fricción"
      },
      {
        name: "Sub-agente de Arquitectura de Información",
        description: "Evalúa estructura y organización de contenido"
      },
      {
        name: "Sub-agente de Accesibilidad",
        description: "Verifica cumplimiento WCAG y usabilidad inclusiva"
      },
      {
        name: "Sub-agente de Responsividad Móvil",
        description: "Prueba adaptación a diferentes dispositivos"
      }
    ]
  },
  {
    icon: <FileText className="w-8 h-8" />,
    title: "Agente de Contenido y Storytelling",
    color: "bg-[#2A3E61]",
    description: "Analiza la claridad del mensaje, voz de marca, engagement emocional y efectividad de calls-to-action.",
    subAgents: [
      {
        name: "Sub-agente de Claridad de Mensaje",
        description: "Analiza efectividad de comunicación"
      },
      {
        name: "Sub-agente de Voz de Marca",
        description: "Evalúa tono, personalidad y consistencia"
      },
      {
        name: "Sub-agente de Engagement Emocional",
        description: "Mide conexión emocional con usuarios"
      },
      {
        name: "Sub-agente de CTAs",
        description: "Evalúa efectividad de llamadas a la acción"
      }
    ]
  },
  {
    icon: <Gauge className="w-8 h-8" />,
    title: "Agente de Rendimiento Técnico",
    color: "bg-[#59E2DE]",
    description: "Mide velocidad de carga, optimización móvil, fundamentos SEO y calidad del código.",
    subAgents: [
      {
        name: "Sub-agente de Velocidad de Página",
        description: "Mide Core Web Vitals y tiempos de carga"
      },
      {
        name: "Sub-agente de Optimización SEO",
        description: "Verifica meta tags, estructura y keywords"
      },
      {
        name: "Sub-agente de Meta Tags",
        description: "Analiza Open Graph, Twitter Cards y meta información"
      },
      {
        name: "Sub-agente de Estructura HTML",
        description: "Evalúa semántica, accesibilidad y estándares web"
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
    title: "Inteligencia Artificial Avanzada",
    description: "Utilizamos modelos de IA de última generación que aprenden y mejoran continuamente para ofrecer análisis más precisos."
  },
  {
    icon: <Users className="w-6 h-6" />,
    title: "Diseñado para Equipos Creativos",
    description: "Creado específicamente para equipos de desarrollo web y diseñadores que buscan crear sitios excepcionales."
  },
  {
    icon: <Lightbulb className="w-6 h-6" />,
    title: "Insights Accionables",
    description: "No solo identificamos problemas, sino que proporcionamos recomendaciones claras y priorizadas para mejorar."
  },
  {
    icon: <Award className="w-6 h-6" />,
    title: "Estándares de la Industria",
    description: "Todos los análisis están calibrados contra las mejores prácticas y estándares de la industria del diseño web."
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
            Aprende cómo funciona SATMA Web Analyst y cómo nuestra tecnología de agentes de IA 
            ayuda a tu equipo a crear sitios web excepcionales.
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
                <Bot className="w-6 h-6 text-[#59E2DE]" />
                ¿Qué es SATMA Web Analyst?
              </h2>
              
              <Card className="mb-8 border-[#59E2DE]/30 bg-gradient-to-r from-[#59E2DE]/5 to-transparent">
                <CardContent className="pt-6">
                  <div className="grid md:grid-cols-2 gap-6 items-center">
                    <div>
                      <h3 className="text-xl font-semibold mb-4 text-[#2A3E61]">
                        Inteligencia Artificial al Servicio del Diseño Web
                      </h3>
                      <p className="text-[#2A3E61]/70 mb-4 font-paragraph">
                        SATMA Web Analyst es una plataforma de análisis y benchmarking web impulsada por 
                        inteligencia artificial multi-agente. Fue desarrollada por <strong>SATMA - Agencia Creativa</strong> para 
                        ayudar a nuestro equipo de desarrollo a crear las mejores páginas de internet para nuestros clientes.
                      </p>
                      <p className="text-[#2A3E61]/70 font-paragraph">
                        Nuestra tecnología permite comparar cualquier sitio web contra sus competidores, 
                        identificando fortalezas y áreas de mejora en diseño, experiencia de usuario, 
                        contenido y rendimiento técnico.
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
                    <Card className="h-full border-[#2A3E61]/10 hover:border-[#59E2DE]/50 transition-colors">
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
                        esta herramienta: para entender profundamente cada proyecto, analizar la competencia, 
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
                <Network className="w-6 h-6 text-[#59E2DE]" />
                Sistema Multi-Agente de IA
              </h2>
              <p className="text-[#2A3E61]/70 mb-8 font-paragraph" data-testid="text-agents-intro">
                Nuestra plataforma utiliza una arquitectura de agentes especializados que trabajan en paralelo 
                para analizar diferentes aspectos de cada sitio web. Cada agente tiene sub-agentes dedicados 
                para análisis más granulares.
              </p>

              <div className="mb-8">
                <Card className="border-[#59E2DE]/30 bg-gradient-to-r from-[#59E2DE]/10 to-transparent mb-6">
                  <CardContent className="pt-6">
                    <h3 className="text-lg font-semibold mb-4 text-[#2A3E61] flex items-center gap-2">
                      <Layers className="w-5 h-5" />
                      Arquitectura Jerárquica
                    </h3>
                    <div className="grid md:grid-cols-3 gap-4 text-center">
                      <div className="p-4 bg-white rounded-lg border border-[#2A3E61]/10">
                        <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-[#2A3E61] flex items-center justify-center">
                          <Brain className="w-6 h-6 text-white" />
                        </div>
                        <h4 className="font-semibold text-[#2A3E61]">Orquestador</h4>
                        <p className="text-xs text-[#2A3E61]/60 font-paragraph">Coordina todo el análisis</p>
                      </div>
                      <div className="p-4 bg-white rounded-lg border border-[#2A3E61]/10">
                        <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-[#59E2DE] flex items-center justify-center">
                          <Bot className="w-6 h-6 text-[#2A3E61]" />
                        </div>
                        <h4 className="font-semibold text-[#2A3E61]">4 Agentes Principales</h4>
                        <p className="text-xs text-[#2A3E61]/60 font-paragraph">Especialistas por área</p>
                      </div>
                      <div className="p-4 bg-white rounded-lg border border-[#2A3E61]/10">
                        <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-[#2A3E61]/20 flex items-center justify-center">
                          <Zap className="w-6 h-6 text-[#2A3E61]" />
                        </div>
                        <h4 className="font-semibold text-[#2A3E61]">16+ Sub-Agentes</h4>
                        <p className="text-xs text-[#2A3E61]/60 font-paragraph">Análisis granular</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <h3 className="text-xl font-semibold mb-6 text-[#2A3E61]">Agentes Especializados</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {agentCards.map((agent, index) => (
                  <motion.div
                    key={agent.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="h-full border-[#2A3E61]/10 hover:border-[#59E2DE]/50 transition-all hover:shadow-lg" data-testid={`card-agent-${index}`}>
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-4 mb-4">
                          <div className={`p-3 rounded-xl ${agent.color} text-white`}>
                            {agent.icon}
                          </div>
                          <div>
                            <h4 className="font-semibold text-lg text-[#2A3E61]">{agent.title}</h4>
                            <p className="text-sm text-[#2A3E61]/70 font-paragraph">{agent.description}</p>
                          </div>
                        </div>
                        <div className="pl-4 border-l-2 border-[#59E2DE]/30">
                          <p className="text-xs font-semibold text-[#2A3E61]/50 uppercase mb-3">Sub-Agentes:</p>
                          <ul className="space-y-3">
                            {agent.subAgents.map((subAgent, idx) => (
                              <li key={idx} className="text-sm font-paragraph">
                                <div className="flex items-start gap-2">
                                  <span className="w-2 h-2 rounded-full bg-[#59E2DE] mt-1.5 flex-shrink-0"></span>
                                  <div>
                                    <span className="font-medium text-[#2A3E61]">{subAgent.name}</span>
                                    <p className="text-xs text-[#2A3E61]/60 mt-0.5">{subAgent.description}</p>
                                  </div>
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
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
                    Cada agente está configurado con un sistema sofisticado de 9 capas que define su comportamiento, 
                    conocimiento y capacidad de evolución:
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
                        Esta arquitectura de 9 capas permite que cada agente sea altamente especializado, 
                        seguro y capaz de aprender de cada análisis para mejorar continuamente sus resultados.
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
                Sigue estos simples pasos para ejecutar tu primer análisis de benchmarking web.
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
