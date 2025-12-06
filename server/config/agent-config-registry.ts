import { 
  AgentConfig, 
  AgentConfigSchema, 
  IndustryTemplate, 
  IndustryTemplateSchema,
  type ToolDefinition,
  type KnowledgeSource
} from "./agent-config-schema";
import { visualAestheticsConfig } from "./agents/visual-aesthetics";
import { uxNavigationConfig } from "./agents/ux-navigation";
import { contentStorytellingConfig } from "./agents/content-storytelling";
import { technicalPerformanceConfig } from "./agents/technical-performance";
import { industryTemplates } from "./industries";

// ============================================================================
// AGENT CONFIG REGISTRY
// ============================================================================

export type RegisteredAgentName = 
  | "Visual_Aesthetics_Agent"
  | "UX_Navigation_Agent" 
  | "Content_Storytelling_Agent"
  | "Technical_Performance_Agent";

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

interface MergedConfig extends AgentConfig {
  industryEnhancements?: {
    industryId: string;
    additionalKnowledge: KnowledgeSource[];
    scoringModifiers: Record<string, number>;
  };
}

class AgentConfigRegistry {
  private configs: Map<RegisteredAgentName, AgentConfig> = new Map();
  private industryTemplates: Map<string, IndustryTemplate> = new Map();
  private validationCache: Map<string, ValidationResult> = new Map();
  private initialized: boolean = false;

  constructor() {
    this.loadAllConfigs();
  }

  private loadAllConfigs(): void {
    const allConfigs: [RegisteredAgentName, AgentConfig][] = [
      ["Visual_Aesthetics_Agent", visualAestheticsConfig],
      ["UX_Navigation_Agent", uxNavigationConfig],
      ["Content_Storytelling_Agent", contentStorytellingConfig],
      ["Technical_Performance_Agent", technicalPerformanceConfig],
    ];

    for (const [name, config] of allConfigs) {
      const validation = this.validateConfig(config);
      if (validation.valid) {
        this.configs.set(name, config);
        console.log(`[ConfigRegistry] ✓ Loaded config for ${name}`);
      } else {
        console.error(`[ConfigRegistry] ✗ Invalid config for ${name}:`, validation.errors);
        throw new Error(`Invalid agent config: ${name} - ${validation.errors.join(", ")}`);
      }
    }

    this.loadAllIndustryTemplates();
    
    this.initialized = true;
    console.log(`[ConfigRegistry] Loaded ${this.configs.size} agent configurations and ${this.industryTemplates.size} industry templates`);
  }

  private loadAllIndustryTemplates(): void {
    for (const template of industryTemplates) {
      const validation = this.registerIndustryTemplate(template);
      if (!validation.valid) {
        console.error(`[ConfigRegistry] ✗ Invalid industry template ${template.industryId}:`, validation.errors);
      }
    }
  }

  private validateConfig(config: AgentConfig): ValidationResult {
    const result: ValidationResult = {
      valid: true,
      errors: [],
      warnings: []
    };

    try {
      AgentConfigSchema.parse(config);
    } catch (error: any) {
      result.valid = false;
      if (error.errors) {
        result.errors = error.errors.map((e: any) => `${e.path.join(".")}: ${e.message}`);
      } else {
        result.errors = [error.message];
      }
      return result;
    }

    if (config.methodology.chainOfThought.length < 3) {
      result.warnings.push("Chain of thought has less than 3 steps - consider adding more detail");
    }

    if (config.staticKnowledge.corePrinciples.length < 2) {
      result.warnings.push("Static knowledge has few core principles");
    }

    if (config.tools.availableTools.length === 0) {
      result.warnings.push("No tools defined for this agent");
    }

    if (!config.metacognition.confidenceAssessment.enabled) {
      result.warnings.push("Confidence assessment is disabled");
    }

    return result;
  }

  getConfig(agentName: RegisteredAgentName): AgentConfig | undefined {
    return this.configs.get(agentName);
  }

  getConfigRequired(agentName: RegisteredAgentName): AgentConfig {
    const config = this.configs.get(agentName);
    if (!config) {
      throw new Error(`Agent config not found: ${agentName}`);
    }
    return config;
  }

  getAllConfigs(): Map<RegisteredAgentName, AgentConfig> {
    return new Map(this.configs);
  }

  getAllAgentNames(): RegisteredAgentName[] {
    return Array.from(this.configs.keys());
  }

  registerIndustryTemplate(template: IndustryTemplate): ValidationResult {
    const result: ValidationResult = {
      valid: true,
      errors: [],
      warnings: []
    };

    try {
      IndustryTemplateSchema.parse(template);
      this.industryTemplates.set(template.industryId, template);
      console.log(`[ConfigRegistry] ✓ Registered industry template: ${template.industryName}`);
    } catch (error: any) {
      result.valid = false;
      if (error.errors) {
        result.errors = error.errors.map((e: any) => `${e.path.join(".")}: ${e.message}`);
      } else {
        result.errors = [error.message];
      }
    }

    return result;
  }

  getIndustryTemplate(industryId: string): IndustryTemplate | undefined {
    return this.industryTemplates.get(industryId);
  }

  getAllIndustryTemplates(): Map<string, IndustryTemplate> {
    return new Map(this.industryTemplates);
  }

  getMergedConfig(agentName: RegisteredAgentName, industryId?: string): MergedConfig {
    const baseConfig = this.getConfigRequired(agentName);
    
    if (!industryId) {
      return { ...baseConfig };
    }

    const industryTemplate = this.industryTemplates.get(industryId);
    if (!industryTemplate) {
      console.warn(`[ConfigRegistry] Industry template not found: ${industryId}`);
      return { ...baseConfig };
    }

    const mergedConfig: MergedConfig = {
      ...baseConfig,
      staticKnowledge: {
        ...baseConfig.staticKnowledge,
        corePrinciples: [
          ...baseConfig.staticKnowledge.corePrinciples,
          ...industryTemplate.specificKnowledge.filter(k => k.type === "principle")
        ],
        bestPractices: [
          ...baseConfig.staticKnowledge.bestPractices,
          ...industryTemplate.specificKnowledge.filter(k => k.type === "best_practice")
        ]
      },
      dynamicData: {
        ...baseConfig.dynamicData,
        sessionContext: {
          ...baseConfig.dynamicData.sessionContext,
          currentIndustry: industryId
        }
      },
      industryEnhancements: {
        industryId,
        additionalKnowledge: industryTemplate.specificKnowledge,
        scoringModifiers: industryTemplate.scoringAdjustments
      }
    };

    return mergedConfig;
  }

  buildSystemPrompt(agentName: RegisteredAgentName, industryId?: string): string {
    const config = this.getMergedConfig(agentName, industryId);
    
    const sections: string[] = [];

    sections.push(`# ${config.identity.displayName}
**Rol:** ${config.identity.archetype}
**Objetivo Principal:** ${config.identity.primaryObjective}
**Tagline:** "${config.identity.tagline}"

${config.identity.secondaryObjectives.map(obj => `- ${obj}`).join("\n")}

**Personalidad:** ${config.identity.personality.traits.join(", ")}
**Estilo de Comunicación:** ${config.identity.personality.communicationStyle}
**Toma de Decisiones:** ${config.identity.personality.decisionMakingApproach}`);

    sections.push(`## Reglas de Seguridad
**Nivel de Confidencialidad:** ${config.security.confidentialityLevel}

**Acciones Prohibidas:**
${config.security.prohibitedActions.map(p => `- ${p}`).join("\n")}

**Directrices Éticas:**
${config.security.ethicalGuidelines.map(g => `- ${g}`).join("\n")}`);

    sections.push(`## Metodología de Análisis
**Framework:** ${config.methodology.analysisFramework}

**Cadena de Pensamiento:**
${config.methodology.chainOfThought.map(step => 
  `${step.step}. **${step.name}**: ${step.description}`
).join("\n")}

**Escala de Puntuación:** ${config.methodology.scoringRubric.scale.min}-${config.methodology.scoringRubric.scale.max}
- Excepcional: ≥${config.methodology.scoringRubric.thresholds.exceptional}
- Bueno: ≥${config.methodology.scoringRubric.thresholds.good}
- Promedio: ≥${config.methodology.scoringRubric.thresholds.average}
- Pobre: <${config.methodology.scoringRubric.thresholds.poor}

**Nota de Calibración:** ${config.methodology.scoringRubric.calibrationNotes}`);

    sections.push(`## Conocimiento Base

### Principios Fundamentales
${config.staticKnowledge.corePrinciples.map(p => 
  `**${p.title}** (peso: ${p.weight})\n${p.content}`
).join("\n\n")}

### Estándares de la Industria
${config.staticKnowledge.industryStandards.map(s => 
  `**${s.title}**: ${s.content}`
).join("\n\n")}

### Mejores Prácticas
${config.staticKnowledge.bestPractices.map(bp => 
  `- **${bp.title}**: ${bp.content}`
).join("\n")}

### Autoridades de Referencia
${config.staticKnowledge.referenceAuthorities.map(a => 
  `- **${a.name}** (${a.expertise}): ${a.keyContributions.join(", ")}`
).join("\n")}`);

    if (config.industryEnhancements) {
      sections.push(`## Conocimiento Específico de Industria (${config.industryEnhancements.industryId})
${config.industryEnhancements.additionalKnowledge.map(k => 
  `**${k.title}**: ${k.content}`
).join("\n\n")}`);
    }

    sections.push(`## Metacognición
**Auto-evaluación de Confianza:** ${config.metacognition.confidenceAssessment.enabled ? "Activa" : "Inactiva"}
${config.metacognition.confidenceAssessment.factors.map(f => 
  `- ${f.factor} (peso: ${f.weight}): ${f.description}`
).join("\n")}

**Sesgos Conocidos a Evitar:**
${config.metacognition.biasDetection.knownBiases.map(b => 
  `- **${b.type}**: ${b.description}. Mitigación: ${b.mitigationStrategy}`
).join("\n")}

**Auto-verificación:** ${config.metacognition.biasDetection.selfCheckPrompt}

**Limitaciones Declaradas:**
${config.metacognition.limitationsAwareness.declaredLimitations.map(l => `- ${l}`).join("\n")}`);

    sections.push(`## Formato de Salida
**Secciones Requeridas:** ${config.methodology.outputStructure.requiredSections.join(", ")}
**Formato:** ${config.methodology.outputStructure.formatting}
**Requisitos de Evidencia:** ${config.methodology.outputStructure.evidenceRequirements}`);

    return sections.join("\n\n---\n\n");
  }

  getSubagentPrompts(agentName: RegisteredAgentName): ToolDefinition[] {
    const config = this.getConfigRequired(agentName);
    return config.tools.availableTools;
  }

  getMetacognitionConfig(agentName: RegisteredAgentName) {
    const config = this.getConfigRequired(agentName);
    return config.metacognition;
  }

  getEvolutionConfig(agentName: RegisteredAgentName) {
    const config = this.getConfigRequired(agentName);
    return config.evolution;
  }

  getOrchestrationConfig(agentName: RegisteredAgentName) {
    const config = this.getConfigRequired(agentName);
    return config.orchestration;
  }

  getStats(): object {
    return {
      agentsLoaded: this.configs.size,
      agents: Array.from(this.configs.keys()),
      industriesLoaded: this.industryTemplates.size,
      industries: Array.from(this.industryTemplates.keys()),
      initialized: this.initialized
    };
  }

  hotReload(agentName: RegisteredAgentName, newConfig: AgentConfig): ValidationResult {
    const validation = this.validateConfig(newConfig);
    
    if (validation.valid) {
      this.configs.set(agentName, newConfig);
      console.log(`[ConfigRegistry] Hot-reloaded config for ${agentName}`);
    }
    
    return validation;
  }
}

let registryInstance: AgentConfigRegistry | null = null;

export function getAgentConfigRegistry(): AgentConfigRegistry {
  if (!registryInstance) {
    registryInstance = new AgentConfigRegistry();
  }
  return registryInstance;
}

export function resetRegistry(): void {
  registryInstance = null;
}

export { AgentConfigRegistry };
