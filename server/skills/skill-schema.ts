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
    industry: z.string().optional(),
    category: z.string().optional(),
    goodRange: z.object({
      min: z.number(),
      max: z.number(),
    }).optional(),
    goodThreshold: z.number().optional(),
    excellentThreshold: z.number().optional(),
    poorThreshold: z.number().optional(),
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
  const { knowledgeBase, practicalContent, contextualInfo, toneGuidelines, specialization } = skill;
  
  let prompt = `Eres ${skill.name}, un experto hiperespecializado en ${specialization.subDomain} dentro del dominio ${specialization.domain}.

Tu nivel de expertise es: ${specialization.expertiseLevel}
${specialization.industryFocus.length > 0 ? `Industrias de enfoque: ${specialization.industryFocus.join(", ")}` : ""}

══════════════════════════════════════════════════════════════
                    BASE DE CONOCIMIENTO
══════════════════════════════════════════════════════════════
`;

  if (knowledgeBase.theoreticalFrameworks.length > 0) {
    prompt += `\n📚 MARCOS TEÓRICOS:\n`;
    for (const framework of knowledgeBase.theoreticalFrameworks.slice(0, 5)) {
      prompt += `• ${framework.name}: ${framework.description}\n`;
      if (framework.principles.length > 0) {
        prompt += `  Principios: ${framework.principles.slice(0, 5).join("; ")}\n`;
      }
      if (framework.applications.length > 0) {
        prompt += `  Aplicaciones: ${framework.applications.slice(0, 3).join("; ")}\n`;
      }
    }
  }

  if (knowledgeBase.glossary.length > 0) {
    prompt += `\n📖 GLOSARIO TÉCNICO:\n`;
    for (const term of knowledgeBase.glossary.slice(0, 10)) {
      prompt += `• ${term.term} [${term.category}]: ${term.definition}\n`;
    }
  }

  if (knowledgeBase.benchmarks.length > 0) {
    prompt += `\n📊 BENCHMARKS DE REFERENCIA:\n`;
    for (const benchmark of knowledgeBase.benchmarks.slice(0, 8)) {
      let benchmarkLine = `• ${benchmark.metric}`;
      if (benchmark.industry) benchmarkLine += ` (${benchmark.industry})`;
      if (benchmark.category) benchmarkLine += ` [${benchmark.category}]`;
      benchmarkLine += `: `;
      
      if (benchmark.goodRange) {
        benchmarkLine += `Bueno ${benchmark.goodRange.min}-${benchmark.goodRange.max}`;
      } else if (benchmark.goodThreshold) {
        benchmarkLine += `Bueno >${benchmark.goodThreshold}`;
      }
      if (benchmark.excellentThreshold) {
        benchmarkLine += `, Excelente >${benchmark.excellentThreshold}`;
      }
      if (benchmark.poorThreshold) {
        benchmarkLine += `, Malo <${benchmark.poorThreshold}`;
      }
      if (benchmark.source) {
        benchmarkLine += ` (Fuente: ${benchmark.source})`;
      }
      prompt += benchmarkLine + '\n';
    }
  }

  if (knowledgeBase.industryStandards.length > 0) {
    prompt += `\n📋 ESTÁNDARES DE INDUSTRIA:\n`;
    for (const standard of knowledgeBase.industryStandards.slice(0, 5)) {
      const complianceEmoji = standard.compliance === 'required' ? '🔴' : 
                              standard.compliance === 'recommended' ? '🟡' : '🟢';
      prompt += `${complianceEmoji} ${standard.standard} (${standard.authority}): ${standard.description} [${standard.compliance.toUpperCase()}]\n`;
    }
  }

  if (practicalContent.checklists.length > 0) {
    prompt += `\n══════════════════════════════════════════════════════════════
                    CHECKLISTS DE EVALUACIÓN
══════════════════════════════════════════════════════════════\n`;
    for (const checklist of practicalContent.checklists.slice(0, 3)) {
      prompt += `\n✅ ${checklist.name} (${checklist.context}):\n`;
      for (const item of checklist.items.slice(0, 8)) {
        const priorityIcon = item.priority === 'critical' ? '🔴' :
                            item.priority === 'high' ? '🟠' :
                            item.priority === 'medium' ? '🟡' : '🟢';
        prompt += `   ${priorityIcon} ${item.item}\n`;
        if (item.rationale) {
          prompt += `      → ${item.rationale}\n`;
        }
      }
    }
  }

  if (practicalContent.implementationGuides.length > 0) {
    prompt += `\n══════════════════════════════════════════════════════════════
                    GUÍAS DE IMPLEMENTACIÓN
══════════════════════════════════════════════════════════════\n`;
    for (const guide of practicalContent.implementationGuides.slice(0, 2)) {
      prompt += `\n📝 ${guide.title} [${guide.difficulty}]\n`;
      prompt += `   Objetivo: ${guide.objective}\n`;
      if (guide.estimatedTime) {
        prompt += `   Tiempo estimado: ${guide.estimatedTime}\n`;
      }
      prompt += `   Pasos:\n`;
      for (const step of guide.steps.slice(0, 5)) {
        prompt += `   ${step.step}. ${step.action}: ${step.details}\n`;
        if (step.validation) {
          prompt += `      ✓ Validación: ${step.validation}\n`;
        }
      }
    }
  }

  if (practicalContent.templates.length > 0) {
    prompt += `\n══════════════════════════════════════════════════════════════
                    TEMPLATES Y PATRONES
══════════════════════════════════════════════════════════════\n`;
    for (const template of practicalContent.templates.slice(0, 3)) {
      prompt += `\n📄 ${template.name} (${template.type})\n`;
      prompt += `   Casos de uso: ${template.useCases.slice(0, 3).join(", ")}\n`;
      prompt += `   Ejemplo: ${template.example.slice(0, 200)}${template.example.length > 200 ? '...' : ''}\n`;
    }
  }

  if (practicalContent.caseStudies.length > 0) {
    prompt += `\n══════════════════════════════════════════════════════════════
                    CASOS DE ESTUDIO
══════════════════════════════════════════════════════════════\n`;
    for (const caseStudy of practicalContent.caseStudies.slice(0, 3)) {
      prompt += `\n🔍 ${caseStudy.title} (${caseStudy.industry})\n`;
      prompt += `   Problema: ${caseStudy.problem}\n`;
      prompt += `   Estrategia: ${caseStudy.strategy}\n`;
      prompt += `   Resultado: ${caseStudy.results.summary}\n`;
      if (caseStudy.lessonsLearned.length > 0) {
        prompt += `   Lecciones aprendidas:\n`;
        for (const lesson of caseStudy.lessonsLearned.slice(0, 3)) {
          prompt += `   • ${lesson}\n`;
        }
      }
      if (caseStudy.applicablePatterns.length > 0) {
        prompt += `   Patrones aplicables: ${caseStudy.applicablePatterns.slice(0, 4).join(", ")}\n`;
      }
    }
  }

  if (contextualInfo.trends.length > 0) {
    prompt += `\n══════════════════════════════════════════════════════════════
                    TENDENCIAS ACTUALES
══════════════════════════════════════════════════════════════\n`;
    for (const trend of contextualInfo.trends.slice(0, 5)) {
      const maturityIcon = trend.maturityLevel === 'emerging' ? '🌱' :
                          trend.maturityLevel === 'growing' ? '📈' :
                          trend.maturityLevel === 'mature' ? '🏛️' : '📉';
      prompt += `${maturityIcon} ${trend.trend} [${trend.maturityLevel}] (Relevancia: ${trend.relevanceScore}/10)\n`;
      prompt += `   ${trend.description}\n`;
      if (trend.industries.length > 0) {
        prompt += `   Industrias: ${trend.industries.slice(0, 4).join(", ")}\n`;
      }
    }
  }

  if (contextualInfo.toolIntegrations.length > 0) {
    prompt += `\n══════════════════════════════════════════════════════════════
                    HERRAMIENTAS Y RECURSOS
══════════════════════════════════════════════════════════════\n`;
    for (const tool of contextualInfo.toolIntegrations.slice(0, 4)) {
      prompt += `\n🔧 ${tool.toolName}: ${tool.purpose}\n`;
      prompt += `   Capacidades: ${tool.capabilities.slice(0, 4).join(", ")}\n`;
      if (tool.limitations.length > 0) {
        prompt += `   Limitaciones: ${tool.limitations.slice(0, 2).join(", ")}\n`;
      }
      prompt += `   Uso: ${tool.usageInstructions}\n`;
    }
  }

  if (contextualInfo.competitorIntelligence.length > 0) {
    prompt += `\n══════════════════════════════════════════════════════════════
                    INTELIGENCIA COMPETITIVA
══════════════════════════════════════════════════════════════\n`;
    for (const competitor of contextualInfo.competitorIntelligence.slice(0, 3)) {
      prompt += `\n🎯 ${competitor.competitor}\n`;
      if (competitor.strengths.length > 0) {
        prompt += `   ✓ Fortalezas: ${competitor.strengths.slice(0, 3).join("; ")}\n`;
      }
      if (competitor.weaknesses.length > 0) {
        prompt += `   ✗ Debilidades: ${competitor.weaknesses.slice(0, 3).join("; ")}\n`;
      }
      if (competitor.strategies.length > 0) {
        prompt += `   ► Estrategias: ${competitor.strategies.slice(0, 2).join("; ")}\n`;
      }
    }
  }

  prompt += `\n══════════════════════════════════════════════════════════════
                    METODOLOGÍA DE ANÁLISIS
══════════════════════════════════════════════════════════════

Tu ENFOQUE de análisis debe ser:
1. Evaluar usando los BENCHMARKS específicos de tu dominio
2. Aplicar los MARCOS TEÓRICOS para estructurar el análisis
3. Verificar contra los CHECKLISTS para no omitir aspectos críticos
4. Considerar las TENDENCIAS actuales en tu evaluación
5. Comparar con las mejores prácticas de los CASOS DE ESTUDIO
6. Aplicar los ESTÁNDARES DE INDUSTRIA cuando corresponda

Tu COMPORTAMIENTO debe ser:
- Sé específico y cuantitativo cuando sea posible
- Basa tus hallazgos en evidencia observable
- Aplica tu conocimiento especializado en cada evaluación
- Identifica tanto fortalezas como áreas de mejora
- Proporciona recomendaciones accionables y priorizadas
`;

  prompt += `\n══════════════════════════════════════════════════════════════
                    ESTILO DE COMUNICACIÓN
══════════════════════════════════════════════════════════════
Tono: ${toneGuidelines.voiceCharacteristics.tone}
Personalidad: ${toneGuidelines.voiceCharacteristics.personality.join(", ")}
Formalidad: ${toneGuidelines.voiceCharacteristics.formality}
Complejidad: ${toneGuidelines.communicationStyle.maxComplexity}
${toneGuidelines.communicationStyle.useTechnicalJargon ? 'Usar terminología técnica cuando sea apropiado' : 'Evitar jerga técnica innecesaria'}
`;

  if (toneGuidelines.responsePatterns.transitionPhrases.length > 0) {
    prompt += `Frases de transición: ${toneGuidelines.responsePatterns.transitionPhrases.slice(0, 4).join(", ")}\n`;
  }

  if (toneGuidelines.prohibitedPatterns.length > 0) {
    prompt += `\n⚠️ PATRONES PROHIBIDOS:\n`;
    for (const prohibited of toneGuidelines.prohibitedPatterns.slice(0, 3)) {
      prompt += `• Evitar: "${prohibited.pattern}" → Usar: "${prohibited.alternative}"\n`;
    }
  }

  prompt += `
══════════════════════════════════════════════════════════════
                    FORMATO DE RESPUESTA
══════════════════════════════════════════════════════════════

Retorna SOLO JSON válido con tu análisis:
{
  "finding": "Hallazgo principal basado en tu expertise especializada",
  "score": 7,
  "details": [
    "Detalle específico con evidencia",
    "Otro hallazgo con métricas cuando aplique",
    "Observación técnica relevante"
  ],
  "confidence": 0.85,
  "appliedKnowledge": [
    "Framework/benchmark/estándar específico que aplicaste"
  ],
  "recommendations": [
    "Recomendación accionable y priorizada basada en tu expertise"
  ],
  "methodology": "Descripción breve de cómo aplicaste tu metodología"
}`;

  return prompt;
}
