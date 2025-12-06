import { z } from "zod";

export const KnowledgeBaseSchema = z.object({
  theoreticalFrameworks: z.array(z.object({
    name: z.string(),
    description: z.string(),
    principles: z.array(z.string()),
    applications: z.array(z.string()),
  })),
  
  glossary: z.array(z.object({
    term: z.string(),
    definition: z.string(),
    category: z.string(),
    relatedTerms: z.array(z.string()).optional(),
  })),
  
  benchmarks: z.array(z.object({
    metric: z.string(),
    industry: z.string(),
    goodRange: z.object({
      min: z.number(),
      max: z.number(),
    }),
    excellentThreshold: z.number(),
    poorThreshold: z.number(),
    source: z.string().optional(),
  })),
  
  industryStandards: z.array(z.object({
    standard: z.string(),
    description: z.string(),
    authority: z.string(),
    compliance: z.enum(["required", "recommended", "optional"]),
  })),
});

export const PracticalContentSchema = z.object({
  implementationGuides: z.array(z.object({
    title: z.string(),
    objective: z.string(),
    steps: z.array(z.object({
      step: z.number(),
      action: z.string(),
      details: z.string(),
      validation: z.string().optional(),
    })),
    estimatedTime: z.string().optional(),
    difficulty: z.enum(["basic", "intermediate", "advanced"]),
  })),
  
  templates: z.array(z.object({
    name: z.string(),
    type: z.string(),
    structure: z.record(z.string(), z.unknown()),
    example: z.string(),
    useCases: z.array(z.string()),
  })),
  
  caseStudies: z.array(z.object({
    title: z.string(),
    industry: z.string(),
    problem: z.string(),
    strategy: z.string(),
    actions: z.array(z.string()),
    results: z.object({
      metrics: z.array(z.object({
        metric: z.string(),
        before: z.string(),
        after: z.string(),
        improvement: z.string(),
      })),
      summary: z.string(),
    }),
    lessonsLearned: z.array(z.string()),
    applicablePatterns: z.array(z.string()),
  })),
  
  checklists: z.array(z.object({
    name: z.string(),
    context: z.string(),
    items: z.array(z.object({
      item: z.string(),
      priority: z.enum(["critical", "high", "medium", "low"]),
      rationale: z.string(),
    })),
  })),
});

export const ContextualInfoSchema = z.object({
  trends: z.array(z.object({
    trend: z.string(),
    description: z.string(),
    startDate: z.string(),
    maturityLevel: z.enum(["emerging", "growing", "mature", "declining"]),
    industries: z.array(z.string()),
    relevanceScore: z.number().min(0).max(10),
  })),
  
  platformUpdates: z.array(z.object({
    platform: z.string(),
    update: z.string(),
    date: z.string(),
    impact: z.enum(["high", "medium", "low"]),
    actionRequired: z.boolean(),
    details: z.string(),
  })),
  
  regionalData: z.array(z.object({
    region: z.string(),
    dataType: z.string(),
    value: z.unknown(),
    source: z.string(),
    lastUpdated: z.string(),
    notes: z.string().optional(),
  })),
  
  toolIntegrations: z.array(z.object({
    toolName: z.string(),
    purpose: z.string(),
    capabilities: z.array(z.string()),
    limitations: z.array(z.string()),
    usageInstructions: z.string(),
    apiEndpoint: z.string().optional(),
  })),
  
  competitorIntelligence: z.array(z.object({
    competitor: z.string(),
    strengths: z.array(z.string()),
    weaknesses: z.array(z.string()),
    strategies: z.array(z.string()),
    lastAnalyzed: z.string(),
  })),
});

export const ToneGuidelinesSchema = z.object({
  voiceCharacteristics: z.object({
    personality: z.array(z.string()),
    tone: z.enum([
      "professional",
      "friendly",
      "authoritative",
      "empathetic",
      "inspiring",
      "analytical",
      "persuasive",
      "educational"
    ]),
    formality: z.enum(["formal", "semi-formal", "casual"]),
  }),
  
  communicationStyle: z.object({
    preferredStructures: z.array(z.string()),
    formatPatterns: z.array(z.string()),
    useEmojis: z.boolean(),
    useTechnicalJargon: z.boolean(),
    maxComplexity: z.enum(["simple", "moderate", "technical", "expert"]),
  }),
  
  responsePatterns: z.object({
    openingStyle: z.string(),
    closingStyle: z.string(),
    transitionPhrases: z.array(z.string()),
    emphasisTechniques: z.array(z.string()),
  }),
  
  prohibitedPatterns: z.array(z.object({
    pattern: z.string(),
    reason: z.string(),
    alternative: z.string(),
  })),
});

export const SkillSchema = z.object({
  id: z.string(),
  name: z.string(),
  version: z.string(),
  description: z.string(),
  
  parentAgentId: z.string(),
  createdBy: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  
  specialization: z.object({
    domain: z.string(),
    subDomain: z.string(),
    expertiseLevel: z.enum(["novice", "intermediate", "advanced", "expert", "master"]),
    industryFocus: z.array(z.string()),
  }),
  
  knowledgeBase: KnowledgeBaseSchema,
  practicalContent: PracticalContentSchema,
  contextualInfo: ContextualInfoSchema,
  toneGuidelines: ToneGuidelinesSchema,
  
  performanceMetrics: z.object({
    usageCount: z.number(),
    averageScore: z.number(),
    lastUsed: z.string().nullable(),
    successRate: z.number(),
    improvementTrend: z.number(),
  }),
  
  evolutionHistory: z.array(z.object({
    version: z.string(),
    date: z.string(),
    changes: z.array(z.string()),
    performanceImpact: z.number(),
  })),
});

export type Skill = z.infer<typeof SkillSchema>;
export type KnowledgeBase = z.infer<typeof KnowledgeBaseSchema>;
export type PracticalContent = z.infer<typeof PracticalContentSchema>;
export type ContextualInfo = z.infer<typeof ContextualInfoSchema>;
export type ToneGuidelines = z.infer<typeof ToneGuidelinesSchema>;

export const DynamicSubagentSchema = z.object({
  id: z.string(),
  name: z.string(),
  parentAgentId: z.string(),
  
  purpose: z.string(),
  activationConditions: z.array(z.string()),
  
  skills: z.array(z.string()),
  
  prompt: z.string(),
  
  configuration: z.object({
    model: z.string().default("gpt-4o-mini"),
    temperature: z.number().min(0).max(2).default(0.7),
    maxTokens: z.number().default(2000),
    timeout: z.number().default(30000),
  }),
  
  metadata: z.object({
    createdAt: z.string(),
    createdBy: z.string(),
    version: z.number(),
    isActive: z.boolean(),
    lastExecuted: z.string().nullable(),
    executionCount: z.number(),
    averageScore: z.number().nullable(),
  }),
});

export type DynamicSubagent = z.infer<typeof DynamicSubagentSchema>;

export function createEmptySkill(
  id: string,
  name: string,
  parentAgentId: string,
  domain: string,
  subDomain: string
): Skill {
  const now = new Date().toISOString();
  
  return {
    id,
    name,
    version: "1.0.0",
    description: `Skill especializado en ${subDomain} dentro del dominio ${domain}`,
    
    parentAgentId,
    createdBy: parentAgentId,
    createdAt: now,
    updatedAt: now,
    
    specialization: {
      domain,
      subDomain,
      expertiseLevel: "novice",
      industryFocus: [],
    },
    
    knowledgeBase: {
      theoreticalFrameworks: [],
      glossary: [],
      benchmarks: [],
      industryStandards: [],
    },
    
    practicalContent: {
      implementationGuides: [],
      templates: [],
      caseStudies: [],
      checklists: [],
    },
    
    contextualInfo: {
      trends: [],
      platformUpdates: [],
      regionalData: [],
      toolIntegrations: [],
      competitorIntelligence: [],
    },
    
    toneGuidelines: {
      voiceCharacteristics: {
        personality: ["profesional", "analítico"],
        tone: "professional",
        formality: "semi-formal",
      },
      communicationStyle: {
        preferredStructures: ["listas", "jerarquías"],
        formatPatterns: ["bullet points", "headers"],
        useEmojis: false,
        useTechnicalJargon: true,
        maxComplexity: "technical",
      },
      responsePatterns: {
        openingStyle: "Directo y enfocado en el problema",
        closingStyle: "Recomendaciones accionables",
        transitionPhrases: ["Además", "Por otro lado", "En consecuencia"],
        emphasisTechniques: ["negritas", "numeración"],
      },
      prohibitedPatterns: [],
    },
    
    performanceMetrics: {
      usageCount: 0,
      averageScore: 0,
      lastUsed: null,
      successRate: 0,
      improvementTrend: 0,
    },
    
    evolutionHistory: [{
      version: "1.0.0",
      date: now,
      changes: ["Skill creado"],
      performanceImpact: 0,
    }],
  };
}

export function generateSkillPrompt(skill: Skill): string {
  const { knowledgeBase, practicalContent, toneGuidelines, specialization } = skill;
  
  let prompt = `Eres ${skill.name}, un experto hiperespecializado en ${specialization.subDomain} dentro del dominio ${specialization.domain}.

Tu nivel de expertise es: ${specialization.expertiseLevel}
${specialization.industryFocus.length > 0 ? `Industrias de enfoque: ${specialization.industryFocus.join(", ")}` : ""}

=== BASE DE CONOCIMIENTO ===
`;

  if (knowledgeBase.theoreticalFrameworks.length > 0) {
    prompt += `\nMARCOS TEÓRICOS:\n`;
    for (const framework of knowledgeBase.theoreticalFrameworks.slice(0, 3)) {
      prompt += `- ${framework.name}: ${framework.description}\n`;
      prompt += `  Principios: ${framework.principles.slice(0, 3).join(", ")}\n`;
    }
  }

  if (knowledgeBase.benchmarks.length > 0) {
    prompt += `\nBENCHMARKS DE REFERENCIA:\n`;
    for (const benchmark of knowledgeBase.benchmarks.slice(0, 5)) {
      prompt += `- ${benchmark.metric} (${benchmark.industry}): Bueno ${benchmark.goodRange.min}-${benchmark.goodRange.max}, Excelente >${benchmark.excellentThreshold}\n`;
    }
  }

  if (practicalContent.caseStudies.length > 0) {
    prompt += `\n=== CASOS DE ESTUDIO ===\n`;
    for (const caseStudy of practicalContent.caseStudies.slice(0, 2)) {
      prompt += `- ${caseStudy.title} (${caseStudy.industry}): ${caseStudy.results.summary}\n`;
    }
  }

  prompt += `\n=== ESTILO DE COMUNICACIÓN ===
Tono: ${toneGuidelines.voiceCharacteristics.tone}
Personalidad: ${toneGuidelines.voiceCharacteristics.personality.join(", ")}
Complejidad: ${toneGuidelines.communicationStyle.maxComplexity}

Retorna SOLO JSON válido con tu análisis:
{
  "finding": "Hallazgo principal en una oración",
  "score": 7,
  "details": ["Detalle 1", "Detalle 2", "Detalle 3"],
  "confidence": 0.85,
  "appliedKnowledge": ["framework o benchmark aplicado"],
  "recommendations": ["Recomendación específica basada en tu expertise"]
}`;

  return prompt;
}
