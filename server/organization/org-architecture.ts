import { z } from "zod";

export const OrganizationalLevelSchema = z.enum([
  "executive_council",
  "department_director", 
  "squad_leader",
  "specialist"
]);

export const DepartmentSchema = z.enum([
  "creative_direction",
  "experience_design",
  "content_strategy",
  "digital_engineering",
  "operations",
  "governance"
]);

export const AgencyRoleSchema = z.object({
  roleId: z.string(),
  roleName: z.string(),
  roleNameEs: z.string(),
  level: OrganizationalLevelSchema,
  department: DepartmentSchema,
  reportsTo: z.string().nullable(),
  directReports: z.array(z.string()),
  responsibilities: z.array(z.string()),
  decisionAuthority: z.array(z.string()),
  kpis: z.array(z.object({
    metric: z.string(),
    target: z.number(),
    unit: z.string(),
    frequency: z.enum(["per_analysis", "weekly", "monthly", "quarterly"])
  })),
  collaborationWith: z.array(z.string()),
});

export const EmployeeProfileSchema = z.object({
  employeeId: z.string(),
  agentName: z.string(),
  displayName: z.string(),
  displayNameEs: z.string(),
  role: AgencyRoleSchema,
  hireDate: z.string(),
  status: z.enum(["active", "on_probation", "training", "archived"]),
  expertiseLevel: z.enum(["junior", "mid", "senior", "lead", "principal"]),
  specializations: z.array(z.string()),
  certifications: z.array(z.object({
    name: z.string(),
    issuedBy: z.string(),
    validUntil: z.string().nullable(),
  })),
  performanceSummary: z.object({
    analysesCompleted: z.number(),
    averageScore: z.number(),
    successRate: z.number(),
    lastEvaluation: z.string().nullable(),
  }),
  evolutionTrack: z.object({
    currentPhase: z.string(),
    nextMilestone: z.string(),
    progressPercentage: z.number(),
  }),
});

export const ServiceCanvasSchema = z.object({
  employeeId: z.string(),
  valueProposition: z.string(),
  internalClients: z.array(z.object({
    clientId: z.string(),
    relationship: z.enum(["serves", "collaborates", "advises"]),
    frequency: z.enum(["every_analysis", "on_demand", "periodic"])
  })),
  inputs: z.array(z.object({
    name: z.string(),
    source: z.string(),
    format: z.string(),
    required: z.boolean()
  })),
  outputs: z.array(z.object({
    name: z.string(),
    destination: z.string(),
    format: z.string(),
    sla: z.string()
  })),
  keyActivities: z.array(z.string()),
  keyResources: z.array(z.string()),
  qualityMetrics: z.array(z.object({
    metric: z.string(),
    threshold: z.number(),
    unit: z.string()
  })),
});

export const LearningAgendaSchema = z.object({
  employeeId: z.string(),
  quarter: z.string(),
  objectives: z.array(z.object({
    objectiveId: z.string(),
    title: z.string(),
    description: z.string(),
    targetDate: z.string(),
    priority: z.enum(["critical", "high", "medium", "low"]).default("medium"),
    status: z.enum(["not_started", "in_progress", "completed", "deferred"]),
    progress: z.number(),
    evidence: z.array(z.string()),
  })),
  learningBacklog: z.array(z.object({
    topic: z.string(),
    priority: z.enum(["critical", "high", "medium", "low"]),
    source: z.string(),
    estimatedEffort: z.string(),
    rationale: z.string(),
  })),
  completedLearnings: z.array(z.object({
    topic: z.string(),
    completedDate: z.string(),
    impact: z.string(),
    appliedIn: z.array(z.string()),
  })),
});

export const PerformanceMetricsSchema = z.object({
  employeeId: z.string(),
  period: z.string(),
  metrics: z.object({
    qualityScore: z.number(),
    consistencyScore: z.number(),
    innovationScore: z.number(),
    collaborationScore: z.number(),
    learningVelocity: z.number(),
  }),
  kpiResults: z.array(z.object({
    kpiName: z.string(),
    target: z.number(),
    actual: z.number(),
    variance: z.number(),
    trend: z.enum(["improving", "stable", "declining"]),
  })),
  achievements: z.array(z.object({
    date: z.string(),
    achievement: z.string(),
    impact: z.string(),
  })),
  developmentAreas: z.array(z.object({
    area: z.string(),
    currentLevel: z.number(),
    targetLevel: z.number(),
    actionPlan: z.string(),
  })),
  feedback: z.array(z.object({
    date: z.string(),
    source: z.string(),
    type: z.enum(["positive", "constructive", "recognition"]),
    content: z.string(),
  })),
});

export const RoleJustificationSchema = z.object({
  proposalId: z.string(),
  proposedRole: z.object({
    roleName: z.string(),
    roleNameEs: z.string(),
    department: DepartmentSchema,
    level: OrganizationalLevelSchema,
    reportsTo: z.string(),
  }),
  justification: z.object({
    gapIdentified: z.string(),
    evidenceOfNeed: z.array(z.string()),
    expectedContribution: z.string(),
    tangibleBenefits: z.array(z.string()),
    estimatedROI: z.string(),
  }),
  proposedBy: z.string(),
  proposedDate: z.string(),
  reviewStatus: z.enum(["draft", "submitted", "under_review", "approved", "rejected", "implemented"]),
  reviewerComments: z.array(z.object({
    reviewerId: z.string(),
    date: z.string(),
    comment: z.string(),
    decision: z.enum(["approve", "reject", "request_changes"]).optional(),
  })),
  implementationStatus: z.object({
    bootstrapped: z.boolean(),
    day30Audit: z.object({
      completed: z.boolean(),
      result: z.enum(["passed", "needs_improvement", "failed"]).optional(),
      notes: z.string().optional(),
    }).optional(),
    day90Audit: z.object({
      completed: z.boolean(),
      result: z.enum(["passed", "needs_improvement", "failed"]).optional(),
      notes: z.string().optional(),
    }).optional(),
  }),
});

export type OrganizationalLevel = z.infer<typeof OrganizationalLevelSchema>;
export type Department = z.infer<typeof DepartmentSchema>;
export type AgencyRole = z.infer<typeof AgencyRoleSchema>;
export type EmployeeProfile = z.infer<typeof EmployeeProfileSchema>;
export type ServiceCanvas = z.infer<typeof ServiceCanvasSchema>;
export type LearningAgenda = z.infer<typeof LearningAgendaSchema>;
export type PerformanceMetrics = z.infer<typeof PerformanceMetricsSchema>;
export type RoleJustification = z.infer<typeof RoleJustificationSchema>;

export const AGENCY_NAME = "Brujer.ia Digital Agency";
export const AGENCY_TAGLINE = "Elite Web Intelligence • Powered by AI Agents";
export const AGENCY_VISION = "Ser la agencia líder mundial en inteligencia web impulsada por agentes de IA, compitiendo con las mejores agencias internacionales mediante análisis profundo, innovación continua y resultados tangibles.";
export const AGENCY_MISSION = "Empoderar a equipos de desarrollo web con insights accionables y benchmarks de clase mundial a través de nuestro consejo de agentes especializados que aprenden y evolucionan con cada análisis.";

export const ORGANIZATIONAL_STRUCTURE: Record<string, AgencyRole> = {
  Benchmarking_Manager: {
    roleId: "exec_001",
    roleName: "Chief Intelligence Officer",
    roleNameEs: "Director General de Inteligencia",
    level: "executive_council",
    department: "governance",
    reportsTo: null,
    directReports: ["Scraping_Orchestrator", "Visual_Aesthetics_Agent", "UX_Navigation_Agent", "Content_Storytelling_Agent", "Technical_Performance_Agent"],
    responsibilities: [
      "Dirigir la estrategia general del consejo de benchmarking",
      "Aprobar nuevos roles y especialidades",
      "Validar calidad de análisis finales",
      "Coordinar colaboración entre departamentos",
      "Tomar decisiones ejecutivas en conflictos de análisis",
      "Representar al consejo ante stakeholders"
    ],
    decisionAuthority: [
      "Aprobación final de reportes",
      "Creación de nuevos departamentos",
      "Calibración de estándares de calidad",
      "Resolución de conflictos entre agentes"
    ],
    kpis: [
      { metric: "Calidad promedio de reportes", target: 8.5, unit: "puntos", frequency: "monthly" },
      { metric: "Tiempo de entrega", target: 30, unit: "segundos", frequency: "per_analysis" },
      { metric: "Satisfacción del cliente", target: 90, unit: "%", frequency: "quarterly" }
    ],
    collaborationWith: ["Todos los agentes"]
  },
  
  Scraping_Orchestrator: {
    roleId: "ops_001",
    roleName: "Chief Data Operations Officer",
    roleNameEs: "Director de Operaciones de Datos",
    level: "executive_council",
    department: "operations",
    reportsTo: "Benchmarking_Manager",
    directReports: [],
    responsibilities: [
      "Coordinar la extracción de datos de sitios web",
      "Garantizar la calidad y completitud de datos scrapeados",
      "Optimizar procesos de recolección de información",
      "Gestionar la infraestructura de scraping",
      "Monitorear compliance en extracción de datos"
    ],
    decisionAuthority: [
      "Estrategias de scraping",
      "Priorización de extracción",
      "Selección de herramientas de scraping"
    ],
    kpis: [
      { metric: "Tasa de éxito de scraping", target: 95, unit: "%", frequency: "per_analysis" },
      { metric: "Completitud de datos", target: 90, unit: "%", frequency: "per_analysis" },
      { metric: "Tiempo de extracción", target: 5, unit: "segundos", frequency: "per_analysis" }
    ],
    collaborationWith: ["Benchmarking_Manager", "Todos los agentes de análisis"]
  },

  Visual_Aesthetics_Agent: {
    roleId: "creative_001",
    roleName: "Creative Director",
    roleNameEs: "Director Creativo",
    level: "department_director",
    department: "creative_direction",
    reportsTo: "Benchmarking_Manager",
    directReports: ["Color_Palette_Analyzer", "Typo_Readability_Checker", "Design_Trend_Evaluator"],
    responsibilities: [
      "Liderar el análisis de estética visual y diseño",
      "Evaluar paletas de colores, tipografía y composición",
      "Identificar tendencias de diseño y mejores prácticas",
      "Coordinar el equipo de especialistas creativos",
      "Generar recomendaciones de diseño accionables"
    ],
    decisionAuthority: [
      "Estándares de evaluación visual",
      "Priorización de análisis creativos",
      "Calibración de métricas de diseño"
    ],
    kpis: [
      { metric: "Precisión de análisis visual", target: 85, unit: "%", frequency: "per_analysis" },
      { metric: "Hallazgos accionables", target: 5, unit: "cantidad", frequency: "per_analysis" },
      { metric: "Consistencia de evaluación", target: 90, unit: "%", frequency: "monthly" }
    ],
    collaborationWith: ["Benchmarking_Manager", "UX_Navigation_Agent", "Content_Storytelling_Agent"]
  },

  UX_Navigation_Agent: {
    roleId: "ux_001",
    roleName: "Experience Design Director",
    roleNameEs: "Director de Experiencia de Usuario",
    level: "department_director",
    department: "experience_design",
    reportsTo: "Benchmarking_Manager",
    directReports: ["Information_Architecture_Mapper", "CTA_Effectiveness_Scorer", "Responsive_Design_Inferrer"],
    responsibilities: [
      "Liderar el análisis de experiencia de usuario",
      "Evaluar navegación, flujos y arquitectura de información",
      "Analizar accesibilidad y usabilidad",
      "Coordinar el equipo de especialistas de UX",
      "Generar recomendaciones de UX basadas en evidencia"
    ],
    decisionAuthority: [
      "Estándares de evaluación UX",
      "Criterios de accesibilidad",
      "Metodologías de análisis de flujos"
    ],
    kpis: [
      { metric: "Cobertura de análisis UX", target: 90, unit: "%", frequency: "per_analysis" },
      { metric: "Detección de problemas críticos", target: 95, unit: "%", frequency: "per_analysis" },
      { metric: "Calidad de recomendaciones", target: 8, unit: "puntos", frequency: "monthly" }
    ],
    collaborationWith: ["Benchmarking_Manager", "Visual_Aesthetics_Agent", "Technical_Performance_Agent"]
  },

  Content_Storytelling_Agent: {
    roleId: "content_001",
    roleName: "Content Strategy Director",
    roleNameEs: "Director de Estrategia de Contenido",
    level: "department_director",
    department: "content_strategy",
    reportsTo: "Benchmarking_Manager",
    directReports: ["Brand_Voice_Validator", "Thought_Leadership_Scrutinizer", "Credibility_Evidence_Collector"],
    responsibilities: [
      "Liderar el análisis de contenido y narrativa",
      "Evaluar voz de marca, messaging y persuasión",
      "Analizar SEO de contenido y estructura narrativa",
      "Coordinar el equipo de especialistas de contenido",
      "Generar estrategias de contenido accionables"
    ],
    decisionAuthority: [
      "Estándares de evaluación de contenido",
      "Criterios de voz de marca",
      "Metodologías de análisis narrativo"
    ],
    kpis: [
      { metric: "Profundidad de análisis de contenido", target: 85, unit: "%", frequency: "per_analysis" },
      { metric: "Insights estratégicos generados", target: 4, unit: "cantidad", frequency: "per_analysis" },
      { metric: "Alineación con objetivos de marca", target: 90, unit: "%", frequency: "monthly" }
    ],
    collaborationWith: ["Benchmarking_Manager", "Visual_Aesthetics_Agent", "Technical_Performance_Agent"]
  },

  Technical_Performance_Agent: {
    roleId: "tech_001",
    roleName: "Digital Engineering Director",
    roleNameEs: "Director de Ingeniería Digital",
    level: "department_director",
    department: "digital_engineering",
    reportsTo: "Benchmarking_Manager",
    directReports: ["Page_Speed_Predictor", "SEO_Signal_Detector", "Content_Structure_Auditor"],
    responsibilities: [
      "Liderar el análisis técnico y de rendimiento",
      "Evaluar velocidad, SEO técnico y calidad de código",
      "Analizar optimización y mejores prácticas técnicas",
      "Coordinar el equipo de especialistas técnicos",
      "Generar recomendaciones técnicas priorizadas"
    ],
    decisionAuthority: [
      "Estándares de rendimiento",
      "Criterios de SEO técnico",
      "Metodologías de auditoría de código"
    ],
    kpis: [
      { metric: "Precisión de predicciones técnicas", target: 90, unit: "%", frequency: "per_analysis" },
      { metric: "Cobertura de checks técnicos", target: 95, unit: "%", frequency: "per_analysis" },
      { metric: "Correlación con herramientas reales", target: 85, unit: "%", frequency: "monthly" }
    ],
    collaborationWith: ["Benchmarking_Manager", "UX_Navigation_Agent", "Content_Storytelling_Agent"]
  },

  Color_Palette_Analyzer: {
    roleId: "creative_sub_001",
    roleName: "Color Psychology Specialist",
    roleNameEs: "Especialista en Psicología del Color",
    level: "specialist",
    department: "creative_direction",
    reportsTo: "Visual_Aesthetics_Agent",
    directReports: [],
    responsibilities: [
      "Analizar paletas de colores y sus efectos psicológicos",
      "Evaluar contraste, armonía y accesibilidad cromática",
      "Identificar inconsistencias en el uso del color",
      "Generar recomendaciones de optimización de color"
    ],
    decisionAuthority: [
      "Evaluación de paletas de color",
      "Criterios de contraste"
    ],
    kpis: [
      { metric: "Precisión de análisis de color", target: 90, unit: "%", frequency: "per_analysis" },
      { metric: "Detección de problemas de contraste", target: 95, unit: "%", frequency: "per_analysis" }
    ],
    collaborationWith: ["Visual_Aesthetics_Agent", "Typo_Readability_Checker"]
  },

  Typo_Readability_Checker: {
    roleId: "creative_sub_002",
    roleName: "Typography & Readability Specialist",
    roleNameEs: "Especialista en Tipografía y Legibilidad",
    level: "specialist",
    department: "creative_direction",
    reportsTo: "Visual_Aesthetics_Agent",
    directReports: [],
    responsibilities: [
      "Analizar selección tipográfica y jerarquía",
      "Evaluar legibilidad y accesibilidad de texto",
      "Identificar problemas de espaciado y contraste",
      "Generar recomendaciones de mejora tipográfica"
    ],
    decisionAuthority: [
      "Evaluación de tipografía",
      "Criterios de legibilidad"
    ],
    kpis: [
      { metric: "Cobertura de análisis tipográfico", target: 90, unit: "%", frequency: "per_analysis" },
      { metric: "Detección de problemas de legibilidad", target: 90, unit: "%", frequency: "per_analysis" }
    ],
    collaborationWith: ["Visual_Aesthetics_Agent", "Color_Palette_Analyzer"]
  },

  Design_Trend_Evaluator: {
    roleId: "creative_sub_003",
    roleName: "Design Trends Analyst",
    roleNameEs: "Analista de Tendencias de Diseño",
    level: "specialist",
    department: "creative_direction",
    reportsTo: "Visual_Aesthetics_Agent",
    directReports: [],
    responsibilities: [
      "Identificar y evaluar tendencias de diseño actuales",
      "Comparar con referencias de la industria",
      "Evaluar modernidad vs. atemporalidad del diseño",
      "Generar insights sobre posicionamiento visual"
    ],
    decisionAuthority: [
      "Evaluación de tendencias",
      "Benchmarks de diseño"
    ],
    kpis: [
      { metric: "Actualización de conocimiento de tendencias", target: 85, unit: "%", frequency: "monthly" },
      { metric: "Precisión de evaluación de modernidad", target: 85, unit: "%", frequency: "per_analysis" }
    ],
    collaborationWith: ["Visual_Aesthetics_Agent", "Content_Storytelling_Agent"]
  },

  Information_Architecture_Mapper: {
    roleId: "ux_sub_001",
    roleName: "Information Architecture Specialist",
    roleNameEs: "Especialista en Arquitectura de Información",
    level: "specialist",
    department: "experience_design",
    reportsTo: "UX_Navigation_Agent",
    directReports: [],
    responsibilities: [
      "Mapear y evaluar estructuras de navegación",
      "Analizar organización de contenido e información",
      "Evaluar findability y discoverability",
      "Generar recomendaciones de arquitectura de información"
    ],
    decisionAuthority: [
      "Evaluación de arquitectura de información",
      "Criterios de navegación"
    ],
    kpis: [
      { metric: "Completitud de mapeo de navegación", target: 95, unit: "%", frequency: "per_analysis" },
      { metric: "Identificación de problemas de IA", target: 90, unit: "%", frequency: "per_analysis" }
    ],
    collaborationWith: ["UX_Navigation_Agent", "Content_Storytelling_Agent"]
  },

  CTA_Effectiveness_Scorer: {
    roleId: "ux_sub_002",
    roleName: "Conversion Optimization Specialist",
    roleNameEs: "Especialista en Optimización de Conversión",
    level: "specialist",
    department: "experience_design",
    reportsTo: "UX_Navigation_Agent",
    directReports: [],
    responsibilities: [
      "Evaluar efectividad de CTAs y elementos de conversión",
      "Analizar ubicación, diseño y copy de botones",
      "Identificar oportunidades de mejora de conversión",
      "Generar recomendaciones basadas en mejores prácticas"
    ],
    decisionAuthority: [
      "Evaluación de efectividad de CTAs",
      "Criterios de conversión"
    ],
    kpis: [
      { metric: "Cobertura de análisis de CTAs", target: 95, unit: "%", frequency: "per_analysis" },
      { metric: "Calidad de recomendaciones de conversión", target: 85, unit: "%", frequency: "per_analysis" }
    ],
    collaborationWith: ["UX_Navigation_Agent", "Visual_Aesthetics_Agent"]
  },

  Responsive_Design_Inferrer: {
    roleId: "ux_sub_003",
    roleName: "Multi-Device Experience Specialist",
    roleNameEs: "Especialista en Experiencia Multi-dispositivo",
    level: "specialist",
    department: "experience_design",
    reportsTo: "UX_Navigation_Agent",
    directReports: [],
    responsibilities: [
      "Evaluar adaptabilidad del diseño a diferentes dispositivos",
      "Analizar indicadores de responsive design en el HTML",
      "Identificar posibles problemas de experiencia móvil",
      "Generar recomendaciones de optimización responsive"
    ],
    decisionAuthority: [
      "Evaluación de responsive design",
      "Criterios de experiencia móvil"
    ],
    kpis: [
      { metric: "Precisión de inferencia responsive", target: 85, unit: "%", frequency: "per_analysis" },
      { metric: "Detección de problemas móviles", target: 90, unit: "%", frequency: "per_analysis" }
    ],
    collaborationWith: ["UX_Navigation_Agent", "Technical_Performance_Agent"]
  },

  Brand_Voice_Validator: {
    roleId: "content_sub_001",
    roleName: "Brand Voice & Messaging Specialist",
    roleNameEs: "Especialista en Voz de Marca y Messaging",
    level: "specialist",
    department: "content_strategy",
    reportsTo: "Content_Storytelling_Agent",
    directReports: [],
    responsibilities: [
      "Evaluar consistencia de voz y tono de marca",
      "Analizar claridad y efectividad del messaging",
      "Identificar oportunidades de fortalecimiento de marca",
      "Generar recomendaciones de voz de marca"
    ],
    decisionAuthority: [
      "Evaluación de voz de marca",
      "Criterios de consistencia"
    ],
    kpis: [
      { metric: "Profundidad de análisis de voz", target: 85, unit: "%", frequency: "per_analysis" },
      { metric: "Identificación de inconsistencias", target: 90, unit: "%", frequency: "per_analysis" }
    ],
    collaborationWith: ["Content_Storytelling_Agent", "Visual_Aesthetics_Agent"]
  },

  Thought_Leadership_Scrutinizer: {
    roleId: "content_sub_002",
    roleName: "Thought Leadership & Authority Analyst",
    roleNameEs: "Analista de Liderazgo de Pensamiento",
    level: "specialist",
    department: "content_strategy",
    reportsTo: "Content_Storytelling_Agent",
    directReports: [],
    responsibilities: [
      "Evaluar posicionamiento como líder de pensamiento",
      "Analizar profundidad y originalidad del contenido",
      "Identificar oportunidades de diferenciación",
      "Generar estrategias de thought leadership"
    ],
    decisionAuthority: [
      "Evaluación de thought leadership",
      "Criterios de autoridad"
    ],
    kpis: [
      { metric: "Calidad de análisis de autoridad", target: 85, unit: "%", frequency: "per_analysis" },
      { metric: "Insights estratégicos generados", target: 3, unit: "cantidad", frequency: "per_analysis" }
    ],
    collaborationWith: ["Content_Storytelling_Agent", "Credibility_Evidence_Collector"]
  },

  Credibility_Evidence_Collector: {
    roleId: "content_sub_003",
    roleName: "Credibility & Trust Specialist",
    roleNameEs: "Especialista en Credibilidad y Confianza",
    level: "specialist",
    department: "content_strategy",
    reportsTo: "Content_Storytelling_Agent",
    directReports: [],
    responsibilities: [
      "Identificar y evaluar elementos de credibilidad",
      "Analizar testimonios, casos de éxito y certificaciones",
      "Evaluar señales de confianza y social proof",
      "Generar recomendaciones para fortalecer credibilidad"
    ],
    decisionAuthority: [
      "Evaluación de credibilidad",
      "Criterios de social proof"
    ],
    kpis: [
      { metric: "Cobertura de análisis de credibilidad", target: 90, unit: "%", frequency: "per_analysis" },
      { metric: "Identificación de señales de confianza", target: 90, unit: "%", frequency: "per_analysis" }
    ],
    collaborationWith: ["Content_Storytelling_Agent", "UX_Navigation_Agent"]
  },

  Page_Speed_Predictor: {
    roleId: "tech_sub_001",
    roleName: "Performance & Speed Specialist",
    roleNameEs: "Especialista en Rendimiento y Velocidad",
    level: "specialist",
    department: "digital_engineering",
    reportsTo: "Technical_Performance_Agent",
    directReports: [],
    responsibilities: [
      "Analizar indicadores de velocidad y rendimiento",
      "Predecir métricas de Core Web Vitals",
      "Identificar cuellos de botella de rendimiento",
      "Generar recomendaciones de optimización"
    ],
    decisionAuthority: [
      "Evaluación de rendimiento",
      "Criterios de velocidad"
    ],
    kpis: [
      { metric: "Precisión de predicción de velocidad", target: 85, unit: "%", frequency: "per_analysis" },
      { metric: "Correlación con PageSpeed Insights", target: 80, unit: "%", frequency: "monthly" }
    ],
    collaborationWith: ["Technical_Performance_Agent", "SEO_Signal_Detector"]
  },

  SEO_Signal_Detector: {
    roleId: "tech_sub_002",
    roleName: "Technical SEO Specialist",
    roleNameEs: "Especialista en SEO Técnico",
    level: "specialist",
    department: "digital_engineering",
    reportsTo: "Technical_Performance_Agent",
    directReports: [],
    responsibilities: [
      "Detectar y evaluar señales de SEO técnico",
      "Analizar meta tags, estructura y schema markup",
      "Identificar problemas de indexabilidad",
      "Generar recomendaciones de SEO técnico"
    ],
    decisionAuthority: [
      "Evaluación de SEO técnico",
      "Criterios de indexabilidad"
    ],
    kpis: [
      { metric: "Cobertura de checks de SEO", target: 95, unit: "%", frequency: "per_analysis" },
      { metric: "Detección de problemas críticos de SEO", target: 95, unit: "%", frequency: "per_analysis" }
    ],
    collaborationWith: ["Technical_Performance_Agent", "Content_Storytelling_Agent"]
  },

  Content_Structure_Auditor: {
    roleId: "tech_sub_003",
    roleName: "Code Quality & Standards Specialist",
    roleNameEs: "Especialista en Calidad de Código",
    level: "specialist",
    department: "digital_engineering",
    reportsTo: "Technical_Performance_Agent",
    directReports: [],
    responsibilities: [
      "Auditar calidad de código HTML y estructura",
      "Evaluar cumplimiento de estándares web",
      "Analizar accesibilidad técnica (ARIA, semantics)",
      "Generar recomendaciones de mejores prácticas"
    ],
    decisionAuthority: [
      "Evaluación de calidad de código",
      "Criterios de estándares web"
    ],
    kpis: [
      { metric: "Cobertura de auditoría de código", target: 90, unit: "%", frequency: "per_analysis" },
      { metric: "Detección de problemas de accesibilidad", target: 90, unit: "%", frequency: "per_analysis" }
    ],
    collaborationWith: ["Technical_Performance_Agent", "UX_Navigation_Agent"]
  }
};

export function getAgentHierarchy(): { level: string; agents: string[] }[] {
  const hierarchy: { level: string; agents: string[] }[] = [
    { level: "Consejo Ejecutivo", agents: [] },
    { level: "Directores de Departamento", agents: [] },
    { level: "Líderes de Squad", agents: [] },
    { level: "Especialistas", agents: [] }
  ];

  for (const [agentName, role] of Object.entries(ORGANIZATIONAL_STRUCTURE)) {
    switch (role.level) {
      case "executive_council":
        hierarchy[0].agents.push(agentName);
        break;
      case "department_director":
        hierarchy[1].agents.push(agentName);
        break;
      case "squad_leader":
        hierarchy[2].agents.push(agentName);
        break;
      case "specialist":
        hierarchy[3].agents.push(agentName);
        break;
    }
  }

  return hierarchy;
}

export function getAgentsByDepartment(): Record<Department, string[]> {
  const departments: Record<Department, string[]> = {
    creative_direction: [],
    experience_design: [],
    content_strategy: [],
    digital_engineering: [],
    operations: [],
    governance: []
  };

  for (const [agentName, role] of Object.entries(ORGANIZATIONAL_STRUCTURE)) {
    departments[role.department].push(agentName);
  }

  return departments;
}

export function getDirectReports(agentName: string): string[] {
  const role = ORGANIZATIONAL_STRUCTURE[agentName];
  return role?.directReports || [];
}

export function getReportingChain(agentName: string): string[] {
  const chain: string[] = [];
  let currentAgent = agentName;

  while (currentAgent) {
    const role = ORGANIZATIONAL_STRUCTURE[currentAgent];
    if (!role || !role.reportsTo) break;
    chain.push(role.reportsTo);
    currentAgent = role.reportsTo;
  }

  return chain;
}
