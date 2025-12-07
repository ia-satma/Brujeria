import { Skill } from "./skill-schema";

type PartialSkillKnowledge = {
  knowledgeBase: Skill['knowledgeBase'];
  practicalContent: Skill['practicalContent'];
  contextualInfo: Skill['contextualInfo'];
  toneGuidelines: Skill['toneGuidelines'];
};

export const COLOR_PSYCHOLOGY_KNOWLEDGE: PartialSkillKnowledge = {
  knowledgeBase: {
    theoreticalFrameworks: [
      {
        name: "Teoría del Color de Itten",
        description: "Sistema de armonías cromáticas basado en el círculo cromático de 12 colores",
        principles: [
          "Colores complementarios generan máximo contraste",
          "Triadas armónicas crean balance visual",
          "Análogos transmiten cohesión y serenidad",
          "Saturación afecta la energía percibida",
          "Valor (luminosidad) determina jerarquía visual"
        ],
        applications: [
          "Selección de paletas de marca",
          "Diseño de interfaces accesibles",
          "Creación de sistemas de color escalables"
        ]
      },
      {
        name: "Psicología del Color en Marketing",
        description: "Estudio de cómo los colores influyen en percepciones y comportamientos de compra",
        principles: [
          "Azul transmite confianza y profesionalismo",
          "Rojo genera urgencia y emoción",
          "Verde asociado a naturaleza y crecimiento",
          "Amarillo atrae atención y optimismo",
          "Negro comunica lujo y sofisticación"
        ],
        applications: [
          "Branding de servicios profesionales",
          "E-commerce y conversión",
          "Diseño de CTAs efectivos"
        ]
      },
      {
        name: "WCAG Color Guidelines",
        description: "Estándares de accesibilidad para contraste y uso de color",
        principles: [
          "Ratio mínimo 4.5:1 para texto normal",
          "Ratio mínimo 3:1 para texto grande",
          "No usar color como único indicador de información",
          "Considerar daltonismo en elección de paletas"
        ],
        applications: [
          "Verificación de accesibilidad",
          "Diseño inclusivo",
          "Compliance legal"
        ]
      }
    ],
    glossary: [
      { term: "Contraste", definition: "Diferencia perceptual entre dos colores adyacentes", category: "fundamentos" },
      { term: "Saturación", definition: "Intensidad o pureza de un color", category: "propiedades" },
      { term: "Valor", definition: "Luminosidad u oscuridad relativa de un color", category: "propiedades" },
      { term: "Tono (Hue)", definition: "El color puro en el espectro cromático", category: "propiedades" },
      { term: "Paleta análoga", definition: "Colores adyacentes en el círculo cromático", category: "armonías" },
      { term: "Colores complementarios", definition: "Colores opuestos en el círculo cromático", category: "armonías" },
      { term: "Ratio de contraste", definition: "Medida numérica de la diferencia de luminancia entre colores", category: "accesibilidad" }
    ],
    benchmarks: [
      { metric: "Ratio de contraste texto/fondo", category: "accesibilidad", goodRange: { min: 4.5, max: 7 }, excellentThreshold: 7, poorThreshold: 3, source: "WCAG 2.1" },
      { metric: "Colores en paleta principal", category: "branding", goodRange: { min: 3, max: 5 }, excellentThreshold: 4 },
      { metric: "Consistencia de uso de color", category: "sistema", goodThreshold: 90, excellentThreshold: 98 },
      { metric: "Colores de acento por página", category: "jerarquía", goodRange: { min: 1, max: 2 } }
    ],
    industryStandards: [
      { standard: "WCAG 2.1 AA", description: "Estándar de accesibilidad web para contraste de color", authority: "W3C", compliance: "required" },
      { standard: "Material Design Color System", description: "Sistema de color de Google para interfaces digitales", authority: "Google", compliance: "recommended" },
      { standard: "Apple Human Interface Guidelines", description: "Guías de color para ecosistema Apple", authority: "Apple", compliance: "recommended" }
    ]
  },
  practicalContent: {
    implementationGuides: [
      {
        title: "Evaluación de Paleta de Color",
        objective: "Analizar sistemáticamente el uso del color en un sitio web",
        steps: [
          { step: 1, action: "Identificar colores primarios", details: "Extraer los 3-5 colores principales de la marca", validation: "Colores identificados coinciden con branding" },
          { step: 2, action: "Verificar contraste", details: "Usar herramienta de contraste para texto/fondo", validation: "Ratio ≥ 4.5:1 para todo texto" },
          { step: 3, action: "Evaluar consistencia", details: "Revisar uso de colores en todas las páginas", validation: "Mismo color = mismo significado" },
          { step: 4, action: "Analizar jerarquía", details: "Verificar que el color refuerza la importancia visual", validation: "CTA más prominente que elementos secundarios" },
          { step: 5, action: "Considerar contexto cultural", details: "Evaluar significados culturales de los colores", validation: "Sin connotaciones negativas para audiencia" }
        ],
        estimatedTime: "15-20 minutos",
        difficulty: "intermediate"
      }
    ],
    templates: [
      {
        name: "Reporte de Análisis de Color",
        type: "evaluation",
        structure: { primaryColors: [], secondaryColors: [], contrastRatios: [], issues: [], recommendations: [] },
        example: "Paleta: Azul #2A3E61 (primario), Cyan #59E2DE (acento). Contraste principal: 8.2:1 ✓",
        useCases: ["Auditoría de marca", "Rediseño web", "Análisis competitivo"]
      }
    ],
    caseStudies: [
      {
        title: "Rediseño de paleta para despacho legal",
        industry: "Servicios Legales",
        problem: "Sitio web usaba colores brillantes que no transmitían seriedad profesional",
        strategy: "Implementar paleta de azules oscuros con acentos dorados sutiles",
        actions: ["Análisis de competidores", "Test A/B de paletas", "Implementación gradual"],
        results: {
          metrics: [
            { metric: "Percepción de profesionalismo", before: "62%", after: "89%", improvement: "+27%" },
            { metric: "Tiempo en página", before: "1:30", after: "2:45", improvement: "+83%" }
          ],
          summary: "Paleta más sobria aumentó confianza y engagement"
        },
        lessonsLearned: [
          "El azul oscuro es universalmente asociado con confianza en servicios profesionales",
          "Los acentos dorados comunican éxito y prestigio",
          "Evitar colores brillantes en nichos serios"
        ],
        applicablePatterns: ["Servicios profesionales", "B2B", "Finanzas"]
      }
    ],
    checklists: [
      {
        name: "Checklist de Evaluación de Color",
        context: "Análisis completo de uso de color en sitio web",
        items: [
          { item: "¿El contraste texto/fondo cumple WCAG 2.1 AA?", priority: "critical", rationale: "Accesibilidad y legibilidad son fundamentales" },
          { item: "¿La paleta refleja la personalidad de marca?", priority: "critical", rationale: "El color es el elemento más memorable de una marca" },
          { item: "¿El color de CTA destaca claramente?", priority: "high", rationale: "Impacto directo en conversiones" },
          { item: "¿Se usa el color consistentemente?", priority: "high", rationale: "Consistencia refuerza reconocimiento de marca" },
          { item: "¿La paleta funciona en modo oscuro?", priority: "medium", rationale: "Tendencia creciente en preferencias de usuario" },
          { item: "¿Los enlaces son distinguibles del texto?", priority: "high", rationale: "Usabilidad y accesibilidad" },
          { item: "¿Se evita el uso de color como único indicador?", priority: "critical", rationale: "Accesibilidad para daltónicos" }
        ]
      }
    ]
  },
  contextualInfo: {
    trends: [
      {
        trend: "Modo Oscuro",
        description: "Diseño de paletas que funcionen en light y dark mode",
        startDate: "2019",
        maturityLevel: "mature",
        industries: ["Tecnología", "Medios", "E-commerce", "Todos"],
        relevanceScore: 9
      },
      {
        trend: "Gradientes Vibrantes",
        description: "Uso de transiciones de color para fondos y elementos destacados",
        startDate: "2020",
        maturityLevel: "mature",
        industries: ["Tecnología", "Creativos", "Startups"],
        relevanceScore: 7
      },
      {
        trend: "Colores Neón y Cyberpunk",
        description: "Paletas con colores eléctricos y contrastes extremos",
        startDate: "2022",
        maturityLevel: "growing",
        industries: ["Gaming", "Entretenimiento", "Tech startups"],
        relevanceScore: 6
      }
    ],
    platformUpdates: [],
    regionalData: [
      { region: "LATAM", dataType: "Preferencias de color", value: "Azul y verde más confiables", source: "Estudios regionales", lastUpdated: "2024" },
      { region: "México", dataType: "Colores a evitar", value: "Rosa para servicios serios (excepto causa social)", source: "Investigación de mercado", lastUpdated: "2024" }
    ],
    toolIntegrations: [
      {
        toolName: "Contrast Checker",
        purpose: "Verificar ratios de contraste WCAG",
        capabilities: ["Calcular ratio de contraste", "Verificar cumplimiento AA/AAA", "Sugerir alternativas accesibles"],
        limitations: ["No considera contexto visual completo"],
        usageInstructions: "Ingresar colores de texto y fondo en formato hex"
      },
      {
        toolName: "Coolors",
        purpose: "Generar y explorar paletas de color",
        capabilities: ["Generar paletas armónicas", "Extraer colores de imágenes", "Verificar accesibilidad"],
        limitations: ["Requiere interpretación para aplicación estratégica"],
        usageInstructions: "Útil para inspiración y variaciones de paleta"
      }
    ],
    competitorIntelligence: []
  },
  toneGuidelines: {
    voiceCharacteristics: {
      personality: ["analítico", "preciso", "visual"],
      tone: "professional",
      formality: "semi-formal"
    },
    communicationStyle: {
      preferredStructures: ["evaluación por aspecto", "métricas primero"],
      formatPatterns: ["bullet points", "comparativas"],
      useEmojis: false,
      useTechnicalJargon: true,
      maxComplexity: "technical"
    },
    responsePatterns: {
      openingStyle: "Directo a la evaluación de la paleta",
      closingStyle: "Recomendaciones priorizadas por impacto",
      transitionPhrases: ["En términos de contraste", "Respecto a la armonía", "Considerando accesibilidad"],
      emphasisTechniques: ["métricas numéricas", "referencias a estándares"]
    },
    prohibitedPatterns: [
      { pattern: "Los colores son bonitos", reason: "Subjetivo y no profesional", alternative: "La paleta cumple con armonías triádicas" },
      { pattern: "Me gusta/No me gusta", reason: "Opinión personal irrelevante", alternative: "El contraste cumple/no cumple el estándar WCAG" }
    ]
  }
};

export const TYPOGRAPHY_EXPERTISE_KNOWLEDGE: PartialSkillKnowledge = {
  knowledgeBase: {
    theoreticalFrameworks: [
      {
        name: "Jerarquía Tipográfica",
        description: "Sistema de organización visual del texto mediante tamaño, peso y espaciado",
        principles: [
          "Escala modular para tamaños consistentes (1.25, 1.333, 1.5)",
          "Máximo 3 niveles de jerarquía claramente distinguibles",
          "Contraste de peso para diferenciar importancia",
          "Espacio blanco como elemento de separación"
        ],
        applications: [
          "Diseño de sistemas tipográficos",
          "Arquitectura de información",
          "Diseño de contenido editorial"
        ]
      },
      {
        name: "Legibilidad y Lecturabilidad",
        description: "Principios para optimizar la facilidad de lectura del texto",
        principles: [
          "Longitud de línea óptima: 45-75 caracteres",
          "Line-height de 1.4-1.6 para cuerpo de texto",
          "Tamaño mínimo de 16px para texto base en web",
          "Sans-serif para pantallas, serif para impreso largo"
        ],
        applications: [
          "Diseño de blogs y artículos",
          "Interfaces de lectura intensiva",
          "Accesibilidad tipográfica"
        ]
      }
    ],
    glossary: [
      { term: "Kerning", definition: "Ajuste del espacio entre pares específicos de letras", category: "espaciado" },
      { term: "Leading (Line-height)", definition: "Espacio vertical entre líneas de texto", category: "espaciado" },
      { term: "Tracking", definition: "Espaciado uniforme entre todos los caracteres", category: "espaciado" },
      { term: "X-height", definition: "Altura de las letras minúsculas sin ascendentes", category: "anatomía" },
      { term: "Peso tipográfico", definition: "Grosor de los trazos de la fuente (light, regular, bold)", category: "propiedades" },
      { term: "Font stack", definition: "Lista de fuentes alternativas para fallback", category: "técnico" },
      { term: "Variable fonts", definition: "Fuentes con ejes ajustables de peso, ancho, etc.", category: "tecnología" }
    ],
    benchmarks: [
      { metric: "Tamaño de texto base", category: "legibilidad", goodRange: { min: 16, max: 18 }, excellentThreshold: 18, poorThreshold: 14, source: "WCAG" },
      { metric: "Line-height para párrafos", category: "legibilidad", goodRange: { min: 1.4, max: 1.6 }, excellentThreshold: 1.5 },
      { metric: "Caracteres por línea", category: "legibilidad", goodRange: { min: 45, max: 75 }, excellentThreshold: 65 },
      { metric: "Familias tipográficas por sitio", category: "consistencia", goodRange: { min: 1, max: 3 }, excellentThreshold: 2 },
      { metric: "Niveles de jerarquía", category: "estructura", goodRange: { min: 3, max: 5 } }
    ],
    industryStandards: [
      { standard: "WCAG 2.1 Text Spacing", description: "Permitir ajuste de espaciado sin pérdida de contenido", authority: "W3C", compliance: "required" },
      { standard: "Google Fonts Best Practices", description: "Optimización de carga y uso de fuentes web", authority: "Google", compliance: "recommended" }
    ]
  },
  practicalContent: {
    implementationGuides: [
      {
        title: "Auditoría Tipográfica Completa",
        objective: "Evaluar sistemáticamente el uso de tipografía en un sitio",
        steps: [
          { step: 1, action: "Identificar fuentes utilizadas", details: "Listar todas las familias y pesos tipográficos", validation: "Máximo 3 familias identificadas" },
          { step: 2, action: "Verificar tamaños base", details: "Medir tamaño de párrafos en desktop y móvil", validation: "≥16px en todos los viewports" },
          { step: 3, action: "Evaluar jerarquía", details: "Revisar diferenciación entre H1-H6 y párrafos", validation: "Escala consistente y distinguible" },
          { step: 4, action: "Medir longitud de línea", details: "Contar caracteres en contenedores principales", validation: "45-75 caracteres" },
          { step: 5, action: "Revisar responsividad", details: "Verificar adaptación en diferentes breakpoints", validation: "Legible en todos los tamaños" }
        ],
        estimatedTime: "20-30 minutos",
        difficulty: "intermediate"
      }
    ],
    templates: [],
    caseStudies: [
      {
        title: "Optimización tipográfica para clínica médica",
        industry: "Servicios Médicos",
        problem: "Texto pequeño y difícil de leer para audiencia senior",
        strategy: "Aumentar tamaños base y mejorar contraste tipográfico",
        actions: ["Aumentar base a 18px", "Implementar escala 1.333", "Mejorar line-height a 1.6"],
        results: {
          metrics: [
            { metric: "Tasa de rebote", before: "65%", after: "42%", improvement: "-35%" },
            { metric: "Tiempo de lectura", before: "45s", after: "2:10", improvement: "+189%" }
          ],
          summary: "Tipografía más legible redujo abandono significativamente"
        },
        lessonsLearned: [
          "Audiencias mayores necesitan tipografía más grande",
          "Line-height generoso mejora comprensión",
          "Menos columnas = mejor lecturabilidad"
        ],
        applicablePatterns: ["Servicios de salud", "Finanzas", "Gobierno", "Audiencias senior"]
      }
    ],
    checklists: [
      {
        name: "Checklist de Tipografía Web",
        context: "Evaluación de calidad tipográfica",
        items: [
          { item: "¿El texto base es ≥16px?", priority: "critical", rationale: "Legibilidad básica en pantallas" },
          { item: "¿Hay máximo 3 familias tipográficas?", priority: "high", rationale: "Consistencia y rendimiento" },
          { item: "¿La jerarquía es clara y consistente?", priority: "critical", rationale: "Usabilidad y escaneabilidad" },
          { item: "¿Las líneas tienen 45-75 caracteres?", priority: "high", rationale: "Lecturabilidad óptima" },
          { item: "¿Las fuentes cargan correctamente?", priority: "critical", rationale: "Experiencia visual consistente" },
          { item: "¿Hay fallbacks definidos?", priority: "medium", rationale: "Robustez del diseño" },
          { item: "¿El texto es escalable (no usa px fijos)?", priority: "high", rationale: "Accesibilidad" }
        ]
      }
    ]
  },
  contextualInfo: {
    trends: [
      {
        trend: "Variable Fonts",
        description: "Fuentes con múltiples ejes ajustables en un solo archivo",
        startDate: "2018",
        maturityLevel: "mature",
        industries: ["Todos"],
        relevanceScore: 8
      },
      {
        trend: "Tipografía Expresiva",
        description: "Uso de fuentes display grandes y creativas",
        startDate: "2021",
        maturityLevel: "growing",
        industries: ["Creativos", "Moda", "Entretenimiento"],
        relevanceScore: 6
      }
    ],
    platformUpdates: [],
    regionalData: [],
    toolIntegrations: [
      {
        toolName: "Google Fonts",
        purpose: "Biblioteca de fuentes web gratuitas",
        capabilities: ["Hosting optimizado", "Subsets para idiomas", "Variable fonts"],
        limitations: ["Requiere conexión para cargar"],
        usageInstructions: "Seleccionar solo pesos necesarios para optimizar rendimiento"
      }
    ],
    competitorIntelligence: []
  },
  toneGuidelines: {
    voiceCharacteristics: {
      personality: ["detallista", "técnico", "preciso"],
      tone: "analytical",
      formality: "semi-formal"
    },
    communicationStyle: {
      preferredStructures: ["métricas específicas", "comparativas con estándares"],
      formatPatterns: ["medidas numéricas", "ejemplos visuales"],
      useEmojis: false,
      useTechnicalJargon: true,
      maxComplexity: "technical"
    },
    responsePatterns: {
      openingStyle: "Análisis de la escala tipográfica",
      closingStyle: "Recomendaciones con métricas específicas",
      transitionPhrases: ["En cuanto a legibilidad", "Respecto a la jerarquía", "Considerando responsive"],
      emphasisTechniques: ["medidas exactas", "referencias a buenas prácticas"]
    },
    prohibitedPatterns: [
      { pattern: "La fuente es linda", reason: "Subjetivo", alternative: "La fuente tiene buena x-height para lectura" }
    ]
  }
};

export const VISUAL_HIERARCHY_KNOWLEDGE: PartialSkillKnowledge = {
  knowledgeBase: {
    theoreticalFrameworks: [
      {
        name: "Principios Gestalt",
        description: "Leyes de percepción visual que explican cómo agrupamos elementos",
        principles: [
          "Proximidad: elementos cercanos se perciben como grupo",
          "Similitud: elementos similares se asocian",
          "Continuidad: el ojo sigue líneas y curvas",
          "Cierre: completamos formas incompletas",
          "Figura-fondo: distinguimos objeto de fondo"
        ],
        applications: [
          "Diseño de layouts",
          "Agrupación de navegación",
          "Diseño de formularios",
          "Cards y contenedores"
        ]
      },
      {
        name: "Regla de los Tercios",
        description: "División de composición en 9 partes para ubicación de elementos clave",
        principles: [
          "Puntos de interés en intersecciones",
          "Elementos clave fuera del centro",
          "Balance asimétrico más dinámico"
        ],
        applications: ["Hero sections", "Ubicación de CTAs", "Composición de imágenes"]
      },
      {
        name: "Patrones F y Z de Lectura",
        description: "Patrones naturales de escaneo visual en páginas web",
        principles: [
          "Patrón F para contenido textual denso",
          "Patrón Z para páginas con menos texto",
          "Esquina superior izquierda = máxima atención",
          "Lado derecho inferior = menor atención"
        ],
        applications: ["Ubicación de elementos clave", "Diseño de headers", "Posicionamiento de CTAs"]
      }
    ],
    glossary: [
      { term: "White space (espacio negativo)", definition: "Áreas vacías que dan respiro al diseño", category: "composición" },
      { term: "Above the fold", definition: "Contenido visible sin hacer scroll", category: "layout" },
      { term: "Visual weight", definition: "Importancia percibida de un elemento por tamaño, color o posición", category: "jerarquía" },
      { term: "Grid system", definition: "Sistema de columnas para organizar contenido", category: "estructura" },
      { term: "Breakpoint", definition: "Punto donde el layout cambia según tamaño de pantalla", category: "responsive" }
    ],
    benchmarks: [
      { metric: "Elementos above the fold", category: "priorización", goodRange: { min: 3, max: 7 }, excellentThreshold: 5 },
      { metric: "Niveles de profundidad visual", category: "jerarquía", goodRange: { min: 3, max: 5 } },
      { metric: "Ratio de whitespace", category: "densidad", goodThreshold: 40, excellentThreshold: 50 },
      { metric: "Consistencia de grid", category: "estructura", goodThreshold: 90, excellentThreshold: 98 }
    ],
    industryStandards: [
      { standard: "8px Grid System", description: "Sistema de espaciado basado en múltiplos de 8", authority: "Industria", compliance: "recommended" },
      { standard: "12-Column Grid", description: "Grid estándar para layouts responsivos", authority: "Bootstrap/Industria", compliance: "recommended" }
    ]
  },
  practicalContent: {
    implementationGuides: [],
    templates: [],
    caseStudies: [],
    checklists: [
      {
        name: "Checklist de Jerarquía Visual",
        context: "Evaluación de composición y layout",
        items: [
          { item: "¿El elemento más importante es inmediatamente visible?", priority: "critical", rationale: "Primera impresión crítica" },
          { item: "¿Hay suficiente whitespace entre secciones?", priority: "high", rationale: "Legibilidad y respiración visual" },
          { item: "¿La navegación es claramente identificable?", priority: "critical", rationale: "Usabilidad fundamental" },
          { item: "¿Los CTAs destacan del resto del contenido?", priority: "critical", rationale: "Conversión depende de visibilidad" },
          { item: "¿El layout sigue patrones de lectura naturales?", priority: "high", rationale: "Flujo de atención optimizado" },
          { item: "¿Hay consistencia en espaciados y alineaciones?", priority: "high", rationale: "Profesionalismo y cohesión" },
          { item: "¿Los grupos de contenido están claramente definidos?", priority: "medium", rationale: "Gestalt de proximidad" }
        ]
      }
    ]
  },
  contextualInfo: {
    trends: [
      {
        trend: "Bento Grid",
        description: "Layouts asimétricos inspirados en cajas bento japonesas",
        startDate: "2022",
        maturityLevel: "growing",
        industries: ["Tech", "SaaS", "Portfolios"],
        relevanceScore: 7
      },
      {
        trend: "Scroll-based Animations",
        description: "Animaciones activadas por posición de scroll",
        startDate: "2020",
        maturityLevel: "mature",
        industries: ["Creativos", "Tech", "Marketing"],
        relevanceScore: 6
      }
    ],
    platformUpdates: [],
    regionalData: [],
    toolIntegrations: [],
    competitorIntelligence: []
  },
  toneGuidelines: {
    voiceCharacteristics: {
      personality: ["observador", "estructurado", "visual"],
      tone: "analytical",
      formality: "semi-formal"
    },
    communicationStyle: {
      preferredStructures: ["análisis por zona", "flujo visual"],
      formatPatterns: ["descripciones espaciales", "referencias a principios"],
      useEmojis: false,
      useTechnicalJargon: true,
      maxComplexity: "technical"
    },
    responsePatterns: {
      openingStyle: "Análisis del flujo visual y puntos focales",
      closingStyle: "Recomendaciones de restructuración priorizadas",
      transitionPhrases: ["En términos de composición", "Respecto al flujo visual", "Considerando Gestalt"],
      emphasisTechniques: ["referencias a principios", "descripciones de atención"]
    },
    prohibitedPatterns: []
  }
};

export const USER_FLOW_ANALYSIS_KNOWLEDGE: PartialSkillKnowledge = {
  knowledgeBase: {
    theoreticalFrameworks: [
      {
        name: "Modelo de Comportamiento de Fogg",
        description: "Framework para entender qué motiva la acción del usuario",
        principles: [
          "Comportamiento = Motivación × Habilidad × Trigger",
          "Reducir fricción aumenta probabilidad de acción",
          "Triggers deben aparecer en momento de alta motivación",
          "Simplificar tareas aumenta completion rate"
        ],
        applications: ["Diseño de onboarding", "Optimización de funnels", "CTAs efectivos"]
      },
      {
        name: "Jobs To Be Done (JTBD)",
        description: "Framework para entender las tareas que usuarios buscan completar",
        principles: [
          "Usuarios 'contratan' productos para trabajos específicos",
          "Entender el progreso que busca el usuario",
          "Contexto determina el job a resolver"
        ],
        applications: ["Arquitectura de información", "Priorización de features", "Copy de navegación"]
      },
      {
        name: "Ley de Hick",
        description: "El tiempo de decisión aumenta con el número de opciones",
        principles: [
          "Menos opciones = decisiones más rápidas",
          "Agrupar opciones reduce carga cognitiva",
          "Progressive disclosure para complejidad"
        ],
        applications: ["Diseño de menús", "Flujos de checkout", "Formularios"]
      }
    ],
    glossary: [
      { term: "Funnel", definition: "Secuencia de pasos hacia una conversión", category: "conversión" },
      { term: "Drop-off", definition: "Punto donde usuarios abandonan un flujo", category: "métricas" },
      { term: "Friction", definition: "Obstáculos que dificultan completar una tarea", category: "usabilidad" },
      { term: "Progressive disclosure", definition: "Revelar información gradualmente según necesidad", category: "diseño" },
      { term: "Breadcrumbs", definition: "Navegación que muestra ubicación actual en la estructura", category: "navegación" },
      { term: "Affordance", definition: "Indicación visual de cómo usar un elemento", category: "interacción" }
    ],
    benchmarks: [
      { metric: "Clics para tarea principal", category: "eficiencia", goodRange: { min: 1, max: 3 }, excellentThreshold: 2, poorThreshold: 5 },
      { metric: "Opciones en navegación principal", category: "complejidad", goodRange: { min: 5, max: 7 }, excellentThreshold: 6 },
      { metric: "Formulario de contacto - campos", category: "conversión", goodRange: { min: 3, max: 5 }, excellentThreshold: 4, poorThreshold: 8 },
      { metric: "Tiempo para encontrar información clave", category: "eficiencia", goodThreshold: 10, excellentThreshold: 5 }
    ],
    industryStandards: [
      { standard: "Nielsen's 10 Heuristics", description: "Principios fundamentales de usabilidad", authority: "Nielsen Norman Group", compliance: "required" },
      { standard: "WCAG 2.1 Navigation", description: "Estándares de accesibilidad para navegación", authority: "W3C", compliance: "required" }
    ]
  },
  practicalContent: {
    implementationGuides: [],
    templates: [],
    caseStudies: [
      {
        title: "Simplificación de navegación para bufete de abogados",
        industry: "Servicios Legales",
        problem: "Menú con 15 opciones causaba parálisis de decisión",
        strategy: "Reducir a 5 categorías principales con submenús lógicos",
        actions: ["Card sorting con usuarios", "Reorganización por área de práctica", "Mega menu con descripciones"],
        results: {
          metrics: [
            { metric: "Tasa de contacto", before: "1.2%", after: "3.8%", improvement: "+217%" },
            { metric: "Páginas por sesión", before: "2.1", after: "4.3", improvement: "+105%" }
          ],
          summary: "Navegación simplificada triplicó conversiones"
        },
        lessonsLearned: [
          "7±2 es el límite de opciones procesables",
          "Descripciones en menú ayudan a usuarios indecisos",
          "Card sorting revela modelos mentales reales"
        ],
        applicablePatterns: ["Sitios de servicios", "E-commerce", "B2B"]
      }
    ],
    checklists: [
      {
        name: "Checklist de Navegación y Flujos",
        context: "Evaluación de arquitectura de información y flujos de usuario",
        items: [
          { item: "¿El usuario puede identificar dónde está?", priority: "critical", rationale: "Orientación básica" },
          { item: "¿Las tareas principales requieren ≤3 clics?", priority: "critical", rationale: "Eficiencia de conversión" },
          { item: "¿La navegación es consistente en todas las páginas?", priority: "critical", rationale: "Predictibilidad" },
          { item: "¿Hay breadcrumbs en páginas internas?", priority: "medium", rationale: "Contexto y navegación" },
          { item: "¿Los labels de navegación son claros?", priority: "high", rationale: "Comprensión inmediata" },
          { item: "¿El CTA principal es visible sin scroll?", priority: "high", rationale: "Acceso a conversión" },
          { item: "¿Los formularios tienen validación en tiempo real?", priority: "medium", rationale: "Reducción de errores" },
          { item: "¿Hay estados de error claros?", priority: "high", rationale: "Recuperación de errores" }
        ]
      }
    ]
  },
  contextualInfo: {
    trends: [
      {
        trend: "Conversational UX",
        description: "Interfaces basadas en diálogo y chatbots",
        startDate: "2020",
        maturityLevel: "growing",
        industries: ["E-commerce", "Soporte", "Servicios"],
        relevanceScore: 7
      },
      {
        trend: "Micro-interactions",
        description: "Pequeñas animaciones que confirman acciones del usuario",
        startDate: "2018",
        maturityLevel: "mature",
        industries: ["Todos"],
        relevanceScore: 8
      }
    ],
    platformUpdates: [],
    regionalData: [],
    toolIntegrations: [],
    competitorIntelligence: []
  },
  toneGuidelines: {
    voiceCharacteristics: {
      personality: ["empático", "centrado en usuario", "práctico"],
      tone: "analytical",
      formality: "semi-formal"
    },
    communicationStyle: {
      preferredStructures: ["flujos paso a paso", "puntos de fricción"],
      formatPatterns: ["descripciones de journey", "métricas de eficiencia"],
      useEmojis: false,
      useTechnicalJargon: true,
      maxComplexity: "technical"
    },
    responsePatterns: {
      openingStyle: "Análisis del flujo de usuario principal",
      closingStyle: "Recomendaciones para reducir fricción",
      transitionPhrases: ["En el flujo de usuario", "Respecto a la navegación", "Considerando la fricción"],
      emphasisTechniques: ["conteo de clics", "puntos de drop-off"]
    },
    prohibitedPatterns: []
  }
};

export const ACCESSIBILITY_EXPERTISE_KNOWLEDGE: PartialSkillKnowledge = {
  knowledgeBase: {
    theoreticalFrameworks: [
      {
        name: "WCAG 2.1 POUR Principles",
        description: "Los 4 principios fundamentales de accesibilidad web",
        principles: [
          "Perceivable: contenido perceptible por todos los sentidos",
          "Operable: interfaz navegable por todos los métodos de input",
          "Understandable: contenido y operación comprensibles",
          "Robust: compatible con tecnologías asistivas"
        ],
        applications: ["Auditorías de accesibilidad", "Diseño inclusivo", "Cumplimiento legal"]
      },
      {
        name: "Inclusive Design Principles",
        description: "Diseño que funciona para la mayor diversidad de usuarios",
        principles: [
          "Proporcionar experiencias comparables",
          "Considerar situaciones variadas",
          "Ser consistente",
          "Dar control al usuario",
          "Ofrecer alternativas"
        ],
        applications: ["Diseño de productos", "Contenido multimedia", "Formularios"]
      }
    ],
    glossary: [
      { term: "Screen reader", definition: "Software que lee contenido en voz alta para usuarios ciegos", category: "tecnología asistiva" },
      { term: "Alt text", definition: "Texto alternativo que describe imágenes", category: "contenido" },
      { term: "ARIA", definition: "Accessible Rich Internet Applications - atributos para mejorar accesibilidad", category: "técnico" },
      { term: "Focus indicator", definition: "Indicador visual del elemento con foco de teclado", category: "navegación" },
      { term: "Skip links", definition: "Enlaces para saltar navegación repetitiva", category: "navegación" },
      { term: "Semantic HTML", definition: "Uso de etiquetas HTML según su significado", category: "estructura" }
    ],
    benchmarks: [
      { metric: "Contraste de texto", category: "visual", goodThreshold: 4.5, excellentThreshold: 7, source: "WCAG 2.1 AA" },
      { metric: "Imágenes con alt text", category: "contenido", goodThreshold: 100, source: "WCAG 2.1" },
      { metric: "Focus visible en interactivos", category: "navegación", goodThreshold: 100, source: "WCAG 2.1" },
      { metric: "Labels en formularios", category: "formularios", goodThreshold: 100 },
      { metric: "Errores de accesibilidad críticos", category: "cumplimiento", goodThreshold: 0, poorThreshold: 1 }
    ],
    industryStandards: [
      { standard: "WCAG 2.1 Level AA", description: "Estándar internacionalmente aceptado de accesibilidad", authority: "W3C", compliance: "required" },
      { standard: "Section 508", description: "Requisitos de accesibilidad para gobierno de EEUU", authority: "US Government", compliance: "required" },
      { standard: "ADA Compliance", description: "Americans with Disabilities Act aplicado a web", authority: "US DOJ", compliance: "required" }
    ]
  },
  practicalContent: {
    implementationGuides: [],
    templates: [],
    caseStudies: [],
    checklists: [
      {
        name: "Checklist de Accesibilidad WCAG 2.1 AA",
        context: "Auditoría rápida de accesibilidad web",
        items: [
          { item: "¿Todas las imágenes tienen alt text descriptivo?", priority: "critical", rationale: "Usuarios de screen reader necesitan contexto" },
          { item: "¿El contraste de texto es ≥4.5:1?", priority: "critical", rationale: "Legibilidad para baja visión" },
          { item: "¿La navegación por teclado funciona?", priority: "critical", rationale: "Usuarios sin mouse" },
          { item: "¿Hay indicador de foco visible?", priority: "critical", rationale: "Navegación por teclado" },
          { item: "¿Los formularios tienen labels asociados?", priority: "critical", rationale: "Screen readers y usabilidad" },
          { item: "¿Se puede pausar contenido en movimiento?", priority: "high", rationale: "Control del usuario" },
          { item: "¿Los videos tienen subtítulos?", priority: "high", rationale: "Usuarios sordos o en ambientes sin audio" },
          { item: "¿El HTML es semántico (h1, nav, main, etc.)?", priority: "high", rationale: "Estructura para tecnologías asistivas" },
          { item: "¿Los errores de formulario son claros?", priority: "high", rationale: "Recuperación de errores" },
          { item: "¿El sitio funciona al 200% de zoom?", priority: "high", rationale: "Usuarios con baja visión" }
        ]
      }
    ]
  },
  contextualInfo: {
    trends: [
      {
        trend: "Accesibilidad Cognitiva",
        description: "Diseño considerando discapacidades cognitivas y de aprendizaje",
        startDate: "2021",
        maturityLevel: "emerging",
        industries: ["Gobierno", "Educación", "Salud"],
        relevanceScore: 8
      }
    ],
    platformUpdates: [],
    regionalData: [
      { region: "México", dataType: "Regulación", value: "Ley General para la Inclusión de las Personas con Discapacidad", source: "Gobierno de México", lastUpdated: "2023" }
    ],
    toolIntegrations: [
      {
        toolName: "axe DevTools",
        purpose: "Detectar problemas de accesibilidad automáticamente",
        capabilities: ["Escaneo automático", "Priorización de issues", "Guías de remediación"],
        limitations: ["Solo detecta ~30% de issues", "Requiere validación manual"],
        usageInstructions: "Ejecutar en cada página para identificar issues críticos"
      },
      {
        toolName: "WAVE",
        purpose: "Evaluador visual de accesibilidad web",
        capabilities: ["Overlay visual de issues", "Análisis de estructura", "Contraste checker"],
        limitations: ["Requiere interpretación humana"],
        usageInstructions: "Útil para visualizar problemas en contexto"
      }
    ],
    competitorIntelligence: []
  },
  toneGuidelines: {
    voiceCharacteristics: {
      personality: ["inclusivo", "riguroso", "empático"],
      tone: "authoritative",
      formality: "semi-formal"
    },
    communicationStyle: {
      preferredStructures: ["prioridad por nivel de impacto", "referencias a estándares"],
      formatPatterns: ["WCAG criterion references", "severidad de issues"],
      useEmojis: false,
      useTechnicalJargon: true,
      maxComplexity: "expert"
    },
    responsePatterns: {
      openingStyle: "Resumen de cumplimiento y issues críticos",
      closingStyle: "Priorización de remediación por impacto",
      transitionPhrases: ["Según WCAG 2.1", "Para usuarios de screen reader", "Considerando accesibilidad"],
      emphasisTechniques: ["referencias a criterios WCAG", "impacto en usuarios"]
    },
    prohibitedPatterns: [
      { pattern: "Es accesible suficiente", reason: "Accesibilidad no es opcional", alternative: "Cumple/no cumple el criterio X de WCAG" }
    ]
  }
};

export const CONVERSION_OPTIMIZATION_KNOWLEDGE: PartialSkillKnowledge = {
  knowledgeBase: {
    theoreticalFrameworks: [
      {
        name: "AIDA Model",
        description: "Framework clásico de conversión: Atención, Interés, Deseo, Acción",
        principles: [
          "Capturar atención con headline fuerte",
          "Generar interés con beneficios claros",
          "Crear deseo con prueba social y urgencia",
          "Facilitar acción con CTA claro"
        ],
        applications: ["Landing pages", "Páginas de producto", "Emails de venta"]
      },
      {
        name: "Principio de Escasez",
        description: "La percepción de disponibilidad limitada aumenta valor percibido",
        principles: [
          "Limitaciones de tiempo crean urgencia",
          "Limitaciones de cantidad crean exclusividad",
          "La escasez debe ser genuina"
        ],
        applications: ["CTAs", "Ofertas", "Formularios"]
      },
      {
        name: "Prueba Social",
        description: "Las personas siguen las acciones de otros en situaciones de incertidumbre",
        principles: [
          "Testimonios de clientes similares",
          "Números de usuarios/clientes",
          "Logos de clientes conocidos",
          "Reviews y calificaciones"
        ],
        applications: ["Páginas de servicios", "E-commerce", "SaaS"]
      }
    ],
    glossary: [
      { term: "CTA (Call to Action)", definition: "Elemento que invita al usuario a realizar una acción específica", category: "conversión" },
      { term: "Above the fold", definition: "Contenido visible sin hacer scroll", category: "layout" },
      { term: "Bounce rate", definition: "Porcentaje de visitantes que abandonan sin interactuar", category: "métricas" },
      { term: "Conversion rate", definition: "Porcentaje de visitantes que completan objetivo deseado", category: "métricas" },
      { term: "Lead magnet", definition: "Oferta de valor a cambio de datos de contacto", category: "estrategia" },
      { term: "Value proposition", definition: "Declaración clara del beneficio único ofrecido", category: "messaging" }
    ],
    benchmarks: [
      { metric: "Tasa de conversión landing page", industry: "B2B Servicios", category: "conversión", goodRange: { min: 2.5, max: 5 }, excellentThreshold: 5, poorThreshold: 1, source: "Unbounce 2023" },
      { metric: "Tasa de conversión landing page", industry: "Legal", category: "conversión", goodRange: { min: 3, max: 7 }, excellentThreshold: 7, source: "Industry benchmarks" },
      { metric: "CTAs above the fold", category: "visibilidad", goodRange: { min: 1, max: 2 }, excellentThreshold: 1 },
      { metric: "Campos en formulario de contacto", category: "fricción", goodRange: { min: 3, max: 5 }, excellentThreshold: 4, poorThreshold: 8 },
      { metric: "Tiempo de carga para conversión", category: "rendimiento", goodThreshold: 3, excellentThreshold: 2, poorThreshold: 5 }
    ],
    industryStandards: []
  },
  practicalContent: {
    implementationGuides: [],
    templates: [],
    caseStudies: [
      {
        title: "Optimización de formulario de contacto para consultora",
        industry: "Servicios Profesionales",
        problem: "Formulario de 12 campos tenía 0.8% de conversión",
        strategy: "Reducir a 4 campos esenciales + validación en tiempo real",
        actions: ["Eliminar campos opcionales", "Agregar indicadores de progreso", "Mejorar CTA copy"],
        results: {
          metrics: [
            { metric: "Tasa de conversión", before: "0.8%", after: "4.2%", improvement: "+425%" },
            { metric: "Leads calificados", before: "12/mes", after: "58/mes", improvement: "+383%" }
          ],
          summary: "Reducción de fricción multiplicó leads por 5"
        },
        lessonsLearned: [
          "Cada campo adicional reduce conversión ~10%",
          "Los campos obligatorios deben justificar su existencia",
          "El copy del CTA impacta más que su color"
        ],
        applicablePatterns: ["B2B", "Servicios profesionales", "Lead generation"]
      }
    ],
    checklists: [
      {
        name: "Checklist de Optimización de Conversión",
        context: "Evaluación de elementos de conversión en landing pages",
        items: [
          { item: "¿Hay un CTA claro above the fold?", priority: "critical", rationale: "Primera oportunidad de conversión" },
          { item: "¿El value proposition es claro en 5 segundos?", priority: "critical", rationale: "Retención de visitantes" },
          { item: "¿Hay prueba social visible (testimonios, logos)?", priority: "high", rationale: "Construcción de confianza" },
          { item: "¿El formulario tiene máximo 5 campos?", priority: "high", rationale: "Reducción de fricción" },
          { item: "¿El CTA usa lenguaje de beneficio (no 'Enviar')?", priority: "high", rationale: "Motivación a la acción" },
          { item: "¿Hay información de contacto visible?", priority: "high", rationale: "Confianza y alternativas" },
          { item: "¿La página carga en <3 segundos?", priority: "critical", rationale: "Cada segundo = -7% conversión" },
          { item: "¿El CTA contrasta con el fondo?", priority: "medium", rationale: "Visibilidad del call to action" }
        ]
      }
    ]
  },
  contextualInfo: {
    trends: [
      {
        trend: "Chatbots de conversión",
        description: "Uso de chat para calificar leads y agendar",
        startDate: "2019",
        maturityLevel: "mature",
        industries: ["B2B", "Servicios", "E-commerce"],
        relevanceScore: 7
      },
      {
        trend: "Video testimonials",
        description: "Testimonios en video para mayor credibilidad",
        startDate: "2020",
        maturityLevel: "growing",
        industries: ["Todos"],
        relevanceScore: 8
      }
    ],
    platformUpdates: [],
    regionalData: [
      { region: "México", dataType: "Preferencia de contacto", value: "WhatsApp preferido sobre formularios tradicionales", source: "Estudios de mercado", lastUpdated: "2024" }
    ],
    toolIntegrations: [],
    competitorIntelligence: []
  },
  toneGuidelines: {
    voiceCharacteristics: {
      personality: ["orientado a resultados", "persuasivo", "analítico"],
      tone: "persuasive",
      formality: "semi-formal"
    },
    communicationStyle: {
      preferredStructures: ["métricas de conversión", "oportunidades de mejora"],
      formatPatterns: ["porcentajes", "comparativas de benchmark"],
      useEmojis: false,
      useTechnicalJargon: true,
      maxComplexity: "technical"
    },
    responsePatterns: {
      openingStyle: "Análisis del funnel de conversión principal",
      closingStyle: "Quick wins y recomendaciones de alto impacto",
      transitionPhrases: ["En términos de conversión", "Para optimizar leads", "Respecto al CTA"],
      emphasisTechniques: ["porcentajes de mejora potencial", "benchmark comparisons"]
    },
    prohibitedPatterns: []
  }
};

export const BRAND_VOICE_ANALYSIS_KNOWLEDGE: PartialSkillKnowledge = {
  knowledgeBase: {
    theoreticalFrameworks: [
      {
        name: "Brand Voice Dimensions",
        description: "Las 4 dimensiones que definen una voz de marca",
        principles: [
          "Tono: actitud emocional del mensaje",
          "Lenguaje: vocabulario y nivel de formalidad",
          "Propósito: intención detrás de cada comunicación",
          "Personalidad: rasgos humanos de la marca"
        ],
        applications: ["Auditoría de copy", "Guías de estilo", "Consistencia de messaging"]
      },
      {
        name: "Arquetipos de Marca",
        description: "12 patrones universales de personalidad de marca basados en Jung",
        principles: [
          "Sabio: expertise y conocimiento",
          "Cuidador: protección y servicio",
          "Héroe: superación y logro",
          "Mago: transformación e innovación"
        ],
        applications: ["Posicionamiento", "Diferenciación", "Copywriting"]
      }
    ],
    glossary: [
      { term: "Brand voice", definition: "Personalidad distintiva expresada en comunicaciones", category: "branding" },
      { term: "Tone of voice", definition: "Modulación del brand voice según contexto", category: "comunicación" },
      { term: "Value proposition", definition: "Declaración de beneficio único y diferenciador", category: "posicionamiento" },
      { term: "USP", definition: "Unique Selling Proposition - lo que diferencia de competidores", category: "estrategia" },
      { term: "Copywriting", definition: "Escritura persuasiva con objetivo de conversión", category: "contenido" }
    ],
    benchmarks: [
      { metric: "Claridad de propuesta de valor", category: "messaging", goodThreshold: 8, excellentThreshold: 9 },
      { metric: "Consistencia de tono", category: "branding", goodThreshold: 85, excellentThreshold: 95 },
      { metric: "Diferenciación de competidores", category: "posicionamiento", goodThreshold: 7, excellentThreshold: 9 }
    ],
    industryStandards: []
  },
  practicalContent: {
    implementationGuides: [],
    templates: [],
    caseStudies: [],
    checklists: [
      {
        name: "Checklist de Voz de Marca",
        context: "Evaluación de consistencia y efectividad de messaging",
        items: [
          { item: "¿La propuesta de valor es clara en el homepage?", priority: "critical", rationale: "Primera impresión de marca" },
          { item: "¿El tono es consistente en todas las páginas?", priority: "high", rationale: "Coherencia de marca" },
          { item: "¿El lenguaje refleja la personalidad de marca?", priority: "high", rationale: "Autenticidad" },
          { item: "¿El copy habla de beneficios (no solo características)?", priority: "high", rationale: "Conexión con audiencia" },
          { item: "¿Se diferencia claramente de competidores?", priority: "high", rationale: "Posicionamiento" },
          { item: "¿El nivel de formalidad es apropiado para la audiencia?", priority: "medium", rationale: "Resonancia con target" },
          { item: "¿Hay un CTA claro y motivador?", priority: "critical", rationale: "Conversión" }
        ]
      }
    ]
  },
  contextualInfo: {
    trends: [
      {
        trend: "Humanización de marca",
        description: "Comunicación más personal y menos corporativa",
        startDate: "2018",
        maturityLevel: "mature",
        industries: ["Todos"],
        relevanceScore: 8
      },
      {
        trend: "Storytelling de impacto social",
        description: "Marcas comunicando propósito más allá del producto",
        startDate: "2019",
        maturityLevel: "growing",
        industries: ["B2C", "Retail", "Servicios"],
        relevanceScore: 7
      }
    ],
    platformUpdates: [],
    regionalData: [
      { region: "México", dataType: "Preferencias de comunicación", value: "Tono cálido pero profesional, evitar frialdad corporativa", source: "Estudios de mercado", lastUpdated: "2024" }
    ],
    toolIntegrations: [],
    competitorIntelligence: []
  },
  toneGuidelines: {
    voiceCharacteristics: {
      personality: ["empático", "estratégico", "perceptivo"],
      tone: "analytical",
      formality: "semi-formal"
    },
    communicationStyle: {
      preferredStructures: ["análisis de messaging", "comparativas de tono"],
      formatPatterns: ["citas directas", "ejemplos de copy"],
      useEmojis: false,
      useTechnicalJargon: true,
      maxComplexity: "technical"
    },
    responsePatterns: {
      openingStyle: "Análisis de la identidad de marca comunicada",
      closingStyle: "Recomendaciones para fortalecer voz de marca",
      transitionPhrases: ["En términos de messaging", "Respecto al tono", "Considerando la audiencia"],
      emphasisTechniques: ["citas del sitio", "comparativas con arquetipos"]
    },
    prohibitedPatterns: []
  }
};

export const SEO_CONTENT_EXPERTISE_KNOWLEDGE: PartialSkillKnowledge = {
  knowledgeBase: {
    theoreticalFrameworks: [
      {
        name: "E-E-A-T Framework",
        description: "Experience, Expertise, Authoritativeness, Trustworthiness - factores de calidad de Google",
        principles: [
          "Demostrar experiencia real en el tema",
          "Establecer expertise con credenciales",
          "Construir autoridad con citas y backlinks",
          "Generar confianza con transparencia"
        ],
        applications: ["Contenido YMYL", "Páginas de servicios", "Blogs profesionales"]
      },
      {
        name: "Pillar-Cluster Model",
        description: "Arquitectura de contenido para SEO mediante temas relacionados",
        principles: [
          "Pillar pages cubren temas amplios",
          "Cluster pages profundizan subtemas",
          "Links internos conectan pillar y clusters"
        ],
        applications: ["Arquitectura de blog", "Páginas de servicio", "Content hubs"]
      }
    ],
    glossary: [
      { term: "Meta title", definition: "Título que aparece en resultados de búsqueda", category: "on-page" },
      { term: "Meta description", definition: "Descripción que aparece bajo el título en SERPs", category: "on-page" },
      { term: "H1", definition: "Heading principal de la página, crítico para SEO", category: "estructura" },
      { term: "Keyword density", definition: "Frecuencia de palabra clave en el contenido", category: "contenido" },
      { term: "Internal linking", definition: "Enlaces entre páginas del mismo sitio", category: "arquitectura" },
      { term: "SERP", definition: "Search Engine Results Page - página de resultados", category: "SEO" },
      { term: "Schema markup", definition: "Datos estructurados para enriquecer resultados", category: "técnico" }
    ],
    benchmarks: [
      { metric: "Longitud de meta title", category: "on-page", goodRange: { min: 50, max: 60 }, excellentThreshold: 55 },
      { metric: "Longitud de meta description", category: "on-page", goodRange: { min: 140, max: 160 }, excellentThreshold: 155 },
      { metric: "Palabras en página de servicio", category: "contenido", goodRange: { min: 500, max: 1500 }, excellentThreshold: 1000 },
      { metric: "H1 único por página", category: "estructura", goodThreshold: 100 },
      { metric: "Imágenes con alt text", category: "accesibilidad/SEO", goodThreshold: 100 }
    ],
    industryStandards: [
      { standard: "Google Search Essentials", description: "Requisitos básicos para indexación y ranking", authority: "Google", compliance: "required" }
    ]
  },
  practicalContent: {
    implementationGuides: [],
    templates: [],
    caseStudies: [],
    checklists: [
      {
        name: "Checklist de SEO On-Page",
        context: "Evaluación de optimización de contenido para búsquedas",
        items: [
          { item: "¿El title tag es único y descriptivo (50-60 chars)?", priority: "critical", rationale: "Factor de ranking principal" },
          { item: "¿La meta description es persuasiva (140-160 chars)?", priority: "high", rationale: "CTR desde SERPs" },
          { item: "¿Hay un solo H1 que incluye keyword principal?", priority: "critical", rationale: "Estructura y relevancia" },
          { item: "¿Los headings siguen jerarquía lógica (H1>H2>H3)?", priority: "high", rationale: "Estructura para crawlers" },
          { item: "¿Las imágenes tienen alt text descriptivo?", priority: "high", rationale: "Accesibilidad y SEO de imágenes" },
          { item: "¿Hay internal links a páginas relacionadas?", priority: "medium", rationale: "Distribución de autoridad" },
          { item: "¿El contenido tiene suficiente profundidad (+500 palabras)?", priority: "medium", rationale: "Cobertura de tema" },
          { item: "¿La URL es corta y descriptiva?", priority: "medium", rationale: "Claridad y CTR" }
        ]
      }
    ]
  },
  contextualInfo: {
    trends: [
      {
        trend: "Search Generative Experience (SGE)",
        description: "IA generativa integrada en resultados de Google",
        startDate: "2023",
        maturityLevel: "emerging",
        industries: ["Todos"],
        relevanceScore: 9
      },
      {
        trend: "Helpful Content Update",
        description: "Google prioriza contenido escrito para humanos, no bots",
        startDate: "2022",
        maturityLevel: "mature",
        industries: ["Todos"],
        relevanceScore: 10
      }
    ],
    platformUpdates: [],
    regionalData: [],
    toolIntegrations: [
      {
        toolName: "Google Search Console",
        purpose: "Monitorear rendimiento en búsquedas de Google",
        capabilities: ["Ver queries que traen tráfico", "Identificar errores de indexación", "Enviar sitemaps"],
        limitations: ["Solo muestra datos de Google"],
        usageInstructions: "Verificar propiedad y monitorear semanalmente"
      }
    ],
    competitorIntelligence: []
  },
  toneGuidelines: {
    voiceCharacteristics: {
      personality: ["analítico", "orientado a datos", "estratégico"],
      tone: "analytical",
      formality: "semi-formal"
    },
    communicationStyle: {
      preferredStructures: ["métricas específicas", "checklist de elementos"],
      formatPatterns: ["longitudes exactas", "presencia/ausencia"],
      useEmojis: false,
      useTechnicalJargon: true,
      maxComplexity: "expert"
    },
    responsePatterns: {
      openingStyle: "Análisis de elementos SEO on-page críticos",
      closingStyle: "Recomendaciones priorizadas por impacto SEO",
      transitionPhrases: ["En términos de SEO", "Para mejorar ranking", "Según best practices"],
      emphasisTechniques: ["métricas exactas", "referencias a Google guidelines"]
    },
    prohibitedPatterns: []
  }
};

export const NARRATIVE_STRUCTURE_KNOWLEDGE: PartialSkillKnowledge = {
  knowledgeBase: {
    theoreticalFrameworks: [
      {
        name: "StoryBrand Framework",
        description: "Estructura narrativa donde el cliente es el héroe y la marca es el guía",
        principles: [
          "El cliente es el héroe, no la marca",
          "El héroe tiene un problema",
          "La marca es el guía con empatía y autoridad",
          "El guía da un plan claro",
          "Llamada a la acción",
          "Evitar el fracaso",
          "Alcanzar el éxito"
        ],
        applications: ["Websites de servicios", "Landing pages", "Copywriting de marca"]
      },
      {
        name: "PAS Formula",
        description: "Problem-Agitate-Solution - estructura persuasiva de copywriting",
        principles: [
          "Problem: Identificar el dolor del usuario",
          "Agitate: Amplificar las consecuencias del problema",
          "Solution: Presentar la solución como alivio"
        ],
        applications: ["Headlines", "Páginas de venta", "Emails"]
      }
    ],
    glossary: [
      { term: "Hero section", definition: "Sección principal de una página que captura atención", category: "diseño" },
      { term: "Pain points", definition: "Problemas o frustraciones específicas del usuario", category: "estrategia" },
      { term: "Social proof", definition: "Evidencia de que otros confían en la marca", category: "persuasión" },
      { term: "Objection handling", definition: "Anticipar y resolver dudas del usuario", category: "conversión" }
    ],
    benchmarks: [
      { metric: "Claridad del problema que resuelve", category: "messaging", goodThreshold: 8, excellentThreshold: 9 },
      { metric: "Presencia de elementos de prueba social", category: "persuasión", goodThreshold: 3, excellentThreshold: 5 },
      { metric: "Plan/proceso claramente comunicado", category: "estructura", goodThreshold: 8, excellentThreshold: 9 }
    ],
    industryStandards: []
  },
  practicalContent: {
    implementationGuides: [],
    templates: [],
    caseStudies: [],
    checklists: [
      {
        name: "Checklist de Estructura Narrativa",
        context: "Evaluación de storytelling y persuasión en web",
        items: [
          { item: "¿Se identifica claramente el problema del usuario?", priority: "critical", rationale: "Conexión emocional inicial" },
          { item: "¿La marca se posiciona como guía (no héroe)?", priority: "high", rationale: "StoryBrand best practice" },
          { item: "¿Hay un proceso/plan claro comunicado?", priority: "high", rationale: "Reduce ansiedad de decisión" },
          { item: "¿Se muestran resultados/transformación posible?", priority: "high", rationale: "Motivación a la acción" },
          { item: "¿Hay testimonios/casos de éxito?", priority: "high", rationale: "Prueba social" },
          { item: "¿Se abordan objeciones comunes?", priority: "medium", rationale: "Superar barreras mentales" },
          { item: "¿El CTA es claro y específico?", priority: "critical", rationale: "Conversión" }
        ]
      }
    ]
  },
  contextualInfo: {
    trends: [],
    platformUpdates: [],
    regionalData: [],
    toolIntegrations: [],
    competitorIntelligence: []
  },
  toneGuidelines: {
    voiceCharacteristics: {
      personality: ["narrativo", "empático", "estratégico"],
      tone: "analytical",
      formality: "semi-formal"
    },
    communicationStyle: {
      preferredStructures: ["análisis de estructura narrativa", "elementos de StoryBrand"],
      formatPatterns: ["citas de copy", "análisis de secciones"],
      useEmojis: false,
      useTechnicalJargon: true,
      maxComplexity: "technical"
    },
    responsePatterns: {
      openingStyle: "Análisis de la narrativa general del sitio",
      closingStyle: "Recomendaciones para fortalecer el storytelling",
      transitionPhrases: ["En la narrativa", "Respecto al storytelling", "Como guía de la historia"],
      emphasisTechniques: ["referencias a StoryBrand", "análisis de estructura"]
    },
    prohibitedPatterns: []
  }
};

export const PERFORMANCE_OPTIMIZATION_KNOWLEDGE: PartialSkillKnowledge = {
  knowledgeBase: {
    theoreticalFrameworks: [
      {
        name: "Core Web Vitals",
        description: "Métricas de Google para medir experiencia de usuario",
        principles: [
          "LCP (Largest Contentful Paint): carga visual <2.5s",
          "INP (Interaction to Next Paint): interactividad <200ms",
          "CLS (Cumulative Layout Shift): estabilidad visual <0.1"
        ],
        applications: ["Optimización de rendimiento", "SEO técnico", "UX"]
      },
      {
        name: "Critical Rendering Path",
        description: "Secuencia de pasos para renderizar una página",
        principles: [
          "Minimizar recursos bloqueantes",
          "Priorizar contenido above the fold",
          "Diferir JavaScript no crítico",
          "Precargar recursos esenciales"
        ],
        applications: ["Optimización de carga", "Mejora de FCP/LCP"]
      }
    ],
    glossary: [
      { term: "LCP", definition: "Largest Contentful Paint - tiempo hasta que el elemento más grande es visible", category: "core web vitals" },
      { term: "INP", definition: "Interaction to Next Paint - responsividad a interacciones", category: "core web vitals" },
      { term: "CLS", definition: "Cumulative Layout Shift - estabilidad visual durante carga", category: "core web vitals" },
      { term: "TTFB", definition: "Time To First Byte - tiempo de respuesta del servidor", category: "rendimiento" },
      { term: "FCP", definition: "First Contentful Paint - primer contenido visible", category: "rendimiento" },
      { term: "Lazy loading", definition: "Cargar imágenes/recursos solo cuando son necesarios", category: "optimización" },
      { term: "CDN", definition: "Content Delivery Network - distribución geográfica de contenido", category: "infraestructura" }
    ],
    benchmarks: [
      { metric: "LCP", category: "core web vitals", goodThreshold: 2.5, excellentThreshold: 1.5, poorThreshold: 4, source: "Google" },
      { metric: "INP", category: "core web vitals", goodThreshold: 200, excellentThreshold: 100, poorThreshold: 500, source: "Google" },
      { metric: "CLS", category: "core web vitals", goodThreshold: 0.1, excellentThreshold: 0.05, poorThreshold: 0.25, source: "Google" },
      { metric: "TTFB", category: "servidor", goodThreshold: 600, excellentThreshold: 200, poorThreshold: 1000 },
      { metric: "Peso de página total", category: "optimización", goodThreshold: 2000, excellentThreshold: 1000, poorThreshold: 4000 }
    ],
    industryStandards: [
      { standard: "Core Web Vitals (Google)", description: "Métricas de experiencia de usuario que afectan ranking", authority: "Google", compliance: "required" }
    ]
  },
  practicalContent: {
    implementationGuides: [],
    templates: [],
    caseStudies: [
      {
        title: "Optimización de velocidad para e-commerce",
        industry: "Retail",
        problem: "LCP de 6.2s causaba alta tasa de abandono",
        strategy: "Optimizar imágenes, implementar lazy loading, CDN",
        actions: ["Comprimir imágenes", "Implementar WebP", "Lazy load bajo el fold", "Configurar CDN"],
        results: {
          metrics: [
            { metric: "LCP", before: "6.2s", after: "1.8s", improvement: "-71%" },
            { metric: "Tasa de conversión", before: "1.2%", after: "2.8%", improvement: "+133%" }
          ],
          summary: "Mejora de velocidad más que duplicó conversiones"
        },
        lessonsLearned: [
          "Cada segundo de mejora en LCP = ~7% más conversiones",
          "WebP reduce tamaño de imagen 30-50%",
          "CDN crítico para audiencias distribuidas"
        ],
        applicablePatterns: ["E-commerce", "Sitios con muchas imágenes", "Audiencias móviles"]
      }
    ],
    checklists: [
      {
        name: "Checklist de Rendimiento Web",
        context: "Evaluación de Core Web Vitals y optimización",
        items: [
          { item: "¿LCP es menor a 2.5 segundos?", priority: "critical", rationale: "Core Web Vital crítico para SEO y UX" },
          { item: "¿INP es menor a 200ms?", priority: "critical", rationale: "Responsividad de interacciones" },
          { item: "¿CLS es menor a 0.1?", priority: "critical", rationale: "Estabilidad visual" },
          { item: "¿Las imágenes están optimizadas (WebP, comprimidas)?", priority: "high", rationale: "Mayor impacto en peso de página" },
          { item: "¿Hay lazy loading para imágenes below the fold?", priority: "high", rationale: "Reducir carga inicial" },
          { item: "¿JavaScript no crítico está diferido?", priority: "high", rationale: "No bloquear renderizado" },
          { item: "¿Se usa compresión (gzip/brotli)?", priority: "medium", rationale: "Reducir transferencia" },
          { item: "¿Hay caching apropiado configurado?", priority: "medium", rationale: "Visitas repetidas más rápidas" }
        ]
      }
    ]
  },
  contextualInfo: {
    trends: [
      {
        trend: "INP reemplaza FID",
        description: "Google cambió First Input Delay por Interaction to Next Paint",
        startDate: "2024",
        maturityLevel: "mature",
        industries: ["Todos"],
        relevanceScore: 10
      },
      {
        trend: "Edge Computing",
        description: "Procesamiento en servidores más cercanos al usuario",
        startDate: "2021",
        maturityLevel: "growing",
        industries: ["Tecnología", "E-commerce"],
        relevanceScore: 7
      }
    ],
    platformUpdates: [],
    regionalData: [
      { region: "México", dataType: "Conexión promedio", value: "25-50 Mbps móvil, importante optimizar", source: "Speedtest Global Index", lastUpdated: "2024" }
    ],
    toolIntegrations: [
      {
        toolName: "PageSpeed Insights",
        purpose: "Medir Core Web Vitals y obtener recomendaciones",
        capabilities: ["Medir LCP/INP/CLS", "Lab y field data", "Recomendaciones específicas"],
        limitations: ["Datos de lab pueden diferir de producción"],
        usageInstructions: "Probar versión móvil y desktop de páginas principales"
      },
      {
        toolName: "Lighthouse",
        purpose: "Auditoría completa de rendimiento web",
        capabilities: ["Métricas de rendimiento", "Accesibilidad", "SEO", "Best practices"],
        limitations: ["Variabilidad entre ejecuciones"],
        usageInstructions: "Ejecutar múltiples veces y promediar resultados"
      }
    ],
    competitorIntelligence: []
  },
  toneGuidelines: {
    voiceCharacteristics: {
      personality: ["técnico", "preciso", "orientado a métricas"],
      tone: "analytical",
      formality: "semi-formal"
    },
    communicationStyle: {
      preferredStructures: ["métricas con thresholds", "prioridad por impacto"],
      formatPatterns: ["números exactos", "comparativas con estándares"],
      useEmojis: false,
      useTechnicalJargon: true,
      maxComplexity: "expert"
    },
    responsePatterns: {
      openingStyle: "Resumen de Core Web Vitals y métricas críticas",
      closingStyle: "Recomendaciones técnicas priorizadas por impacto",
      transitionPhrases: ["En términos de rendimiento", "Respecto a Core Web Vitals", "Para optimizar"],
      emphasisTechniques: ["métricas exactas con unidades", "thresholds de Google"]
    },
    prohibitedPatterns: [
      { pattern: "El sitio es lento", reason: "Vago y no accionable", alternative: "LCP de 4.2s excede el threshold de 2.5s" }
    ]
  }
};

export const SEO_TECHNICAL_EXPERTISE_KNOWLEDGE: PartialSkillKnowledge = {
  knowledgeBase: {
    theoreticalFrameworks: [
      {
        name: "Technical SEO Pillars",
        description: "Los pilares fundamentales del SEO técnico",
        principles: [
          "Crawlability: Google puede encontrar las páginas",
          "Indexability: Google puede indexar el contenido",
          "Renderability: JavaScript se ejecuta correctamente",
          "Rankability: señales técnicas positivas"
        ],
        applications: ["Auditorías técnicas", "Arquitectura de sitio", "Debugging SEO"]
      }
    ],
    glossary: [
      { term: "robots.txt", definition: "Archivo que indica qué páginas pueden rastrear los bots", category: "crawling" },
      { term: "sitemap.xml", definition: "Mapa del sitio para facilitar indexación", category: "indexación" },
      { term: "Canonical URL", definition: "URL preferida cuando hay contenido duplicado", category: "duplicados" },
      { term: "Schema markup", definition: "Datos estructurados para rich snippets", category: "structured data" },
      { term: "Hreflang", definition: "Etiqueta para indicar idioma/región de páginas", category: "internacional" },
      { term: "301 redirect", definition: "Redirección permanente que transfiere autoridad", category: "redirecciones" },
      { term: "404 error", definition: "Página no encontrada", category: "errores" }
    ],
    benchmarks: [
      { metric: "Páginas indexadas vs enviadas", category: "indexación", goodThreshold: 95, excellentThreshold: 99 },
      { metric: "Errores de rastreo", category: "salud", goodThreshold: 0, poorThreshold: 5 },
      { metric: "Páginas con schema markup", category: "structured data", goodThreshold: 50, excellentThreshold: 80 },
      { metric: "Links rotos internos", category: "salud", goodThreshold: 0, poorThreshold: 3 },
      { metric: "HTTPS implementado", category: "seguridad", goodThreshold: 100 }
    ],
    industryStandards: [
      { standard: "HTTPS Everywhere", description: "Conexión segura para todo el sitio", authority: "Google", compliance: "required" },
      { standard: "Mobile-First Indexing", description: "Google indexa primariamente versión móvil", authority: "Google", compliance: "required" }
    ]
  },
  practicalContent: {
    implementationGuides: [],
    templates: [],
    caseStudies: [],
    checklists: [
      {
        name: "Checklist de SEO Técnico",
        context: "Auditoría de aspectos técnicos que afectan SEO",
        items: [
          { item: "¿El sitio usa HTTPS en todas las páginas?", priority: "critical", rationale: "Factor de ranking y seguridad" },
          { item: "¿Existe y es válido el sitemap.xml?", priority: "high", rationale: "Facilita indexación" },
          { item: "¿El robots.txt permite indexación apropiada?", priority: "critical", rationale: "Bloqueo accidental = desastre" },
          { item: "¿Hay tags canónicos en páginas principales?", priority: "high", rationale: "Evitar duplicados" },
          { item: "¿El sitio es mobile-friendly?", priority: "critical", rationale: "Mobile-first indexing" },
          { item: "¿Hay schema markup implementado?", priority: "medium", rationale: "Rich snippets en SERPs" },
          { item: "¿Las URLs son limpias y descriptivas?", priority: "medium", rationale: "UX y claridad" },
          { item: "¿Hay redirecciones 301 para páginas movidas?", priority: "high", rationale: "Preservar autoridad" }
        ]
      }
    ]
  },
  contextualInfo: {
    trends: [
      {
        trend: "AI-Generated Content Guidelines",
        description: "Google evalúa calidad independiente del autor (humano o IA)",
        startDate: "2023",
        maturityLevel: "mature",
        industries: ["Todos"],
        relevanceScore: 9
      }
    ],
    platformUpdates: [],
    regionalData: [],
    toolIntegrations: [
      {
        toolName: "Google Search Console",
        purpose: "Monitorear salud de indexación y rendimiento",
        capabilities: ["Ver errores de rastreo", "Inspeccionar URLs", "Monitorear Core Web Vitals"],
        limitations: ["Solo datos de Google"],
        usageInstructions: "Verificar propiedad y revisar semanalmente"
      },
      {
        toolName: "Screaming Frog",
        purpose: "Crawler para auditorías técnicas completas",
        capabilities: ["Detectar errores", "Analizar estructura", "Encontrar duplicados"],
        limitations: ["Versión gratis limitada a 500 URLs"],
        usageInstructions: "Crawl completo mensual para sitios grandes"
      }
    ],
    competitorIntelligence: []
  },
  toneGuidelines: {
    voiceCharacteristics: {
      personality: ["técnico", "diagnóstico", "sistemático"],
      tone: "analytical",
      formality: "semi-formal"
    },
    communicationStyle: {
      preferredStructures: ["lista de issues", "prioridad por severidad"],
      formatPatterns: ["códigos de estado HTTP", "referencias a herramientas"],
      useEmojis: false,
      useTechnicalJargon: true,
      maxComplexity: "expert"
    },
    responsePatterns: {
      openingStyle: "Resumen de salud técnica del sitio",
      closingStyle: "Issues críticos y plan de remediación",
      transitionPhrases: ["En términos técnicos", "Para la indexación", "Respecto a crawlability"],
      emphasisTechniques: ["códigos HTTP", "herramientas de diagnóstico"]
    },
    prohibitedPatterns: []
  }
};

export const CODE_QUALITY_ANALYSIS_KNOWLEDGE: PartialSkillKnowledge = {
  knowledgeBase: {
    theoreticalFrameworks: [
      {
        name: "HTML5 Semantic Structure",
        description: "Uso de etiquetas HTML según su significado semántico",
        principles: [
          "header, nav, main, footer para estructura",
          "article y section para contenido",
          "aside para contenido relacionado",
          "figure y figcaption para medios"
        ],
        applications: ["Accesibilidad", "SEO", "Mantenibilidad"]
      }
    ],
    glossary: [
      { term: "Semantic HTML", definition: "Uso de etiquetas según su significado, no solo presentación", category: "estructura" },
      { term: "DOCTYPE", definition: "Declaración del tipo de documento HTML", category: "validación" },
      { term: "Viewport meta", definition: "Configuración de escala para dispositivos móviles", category: "responsive" },
      { term: "rel=noopener", definition: "Atributo de seguridad para links externos", category: "seguridad" },
      { term: "Inline styles", definition: "Estilos CSS directamente en elementos HTML", category: "bad practice" }
    ],
    benchmarks: [
      { metric: "Errores de validación HTML", category: "calidad", goodThreshold: 0, poorThreshold: 10 },
      { metric: "Uso de HTML semántico", category: "estructura", goodThreshold: 80, excellentThreshold: 95 },
      { metric: "Imágenes con dimensiones definidas", category: "rendimiento", goodThreshold: 100 },
      { metric: "Links externos con rel=noopener", category: "seguridad", goodThreshold: 100 }
    ],
    industryStandards: [
      { standard: "W3C HTML Validation", description: "Estándar de markup HTML válido", authority: "W3C", compliance: "recommended" },
      { standard: "HTML5 Specification", description: "Especificación actual de HTML", authority: "WHATWG", compliance: "required" }
    ]
  },
  practicalContent: {
    implementationGuides: [],
    templates: [],
    caseStudies: [],
    checklists: [
      {
        name: "Checklist de Calidad de Código Web",
        context: "Evaluación de markup y best practices",
        items: [
          { item: "¿El HTML es válido según W3C?", priority: "high", rationale: "Compatibilidad cross-browser" },
          { item: "¿Se usa HTML semántico (header, main, nav, etc.)?", priority: "high", rationale: "Accesibilidad y SEO" },
          { item: "¿Hay viewport meta configurado?", priority: "critical", rationale: "Responsive design" },
          { item: "¿Los links externos tienen rel=noopener?", priority: "medium", rationale: "Seguridad" },
          { item: "¿Las imágenes tienen width/height definidos?", priority: "medium", rationale: "Evitar CLS" },
          { item: "¿Se evitan inline styles excesivos?", priority: "low", rationale: "Mantenibilidad" },
          { item: "¿El lang attribute está definido en html?", priority: "high", rationale: "Accesibilidad y SEO" },
          { item: "¿Hay favicon configurado?", priority: "low", rationale: "Profesionalismo" }
        ]
      }
    ]
  },
  contextualInfo: {
    trends: [],
    platformUpdates: [],
    regionalData: [],
    toolIntegrations: [
      {
        toolName: "W3C Validator",
        purpose: "Validar markup HTML contra estándar",
        capabilities: ["Detectar errores de sintaxis", "Verificar cierre de tags", "Validar atributos"],
        limitations: ["No evalúa semántica contextual"],
        usageInstructions: "Validar página principal y plantillas únicas"
      }
    ],
    competitorIntelligence: []
  },
  toneGuidelines: {
    voiceCharacteristics: {
      personality: ["metódico", "técnico", "orientado a estándares"],
      tone: "analytical",
      formality: "semi-formal"
    },
    communicationStyle: {
      preferredStructures: ["lista de issues", "referencias a especificaciones"],
      formatPatterns: ["ejemplos de código", "before/after"],
      useEmojis: false,
      useTechnicalJargon: true,
      maxComplexity: "expert"
    },
    responsePatterns: {
      openingStyle: "Análisis de calidad de markup y estructura",
      closingStyle: "Recomendaciones de mejora con ejemplos",
      transitionPhrases: ["En el markup", "Respecto a semántica", "Según el estándar"],
      emphasisTechniques: ["referencias a W3C", "ejemplos de código"]
    },
    prohibitedPatterns: []
  }
};

export const SKILL_KNOWLEDGE_MAP: Record<string, PartialSkillKnowledge> = {
  "Color Psychology": COLOR_PSYCHOLOGY_KNOWLEDGE,
  "Typography Expertise": TYPOGRAPHY_EXPERTISE_KNOWLEDGE,
  "Visual Hierarchy": VISUAL_HIERARCHY_KNOWLEDGE,
  "User Flow Analysis": USER_FLOW_ANALYSIS_KNOWLEDGE,
  "Accessibility Expertise": ACCESSIBILITY_EXPERTISE_KNOWLEDGE,
  "Conversion Optimization": CONVERSION_OPTIMIZATION_KNOWLEDGE,
  "Brand Voice Analysis": BRAND_VOICE_ANALYSIS_KNOWLEDGE,
  "SEO Content Expertise": SEO_CONTENT_EXPERTISE_KNOWLEDGE,
  "Narrative Structure": NARRATIVE_STRUCTURE_KNOWLEDGE,
  "Performance Optimization": PERFORMANCE_OPTIMIZATION_KNOWLEDGE,
  "SEO Technical Expertise": SEO_TECHNICAL_EXPERTISE_KNOWLEDGE,
  "Code Quality Analysis": CODE_QUALITY_ANALYSIS_KNOWLEDGE,
};
