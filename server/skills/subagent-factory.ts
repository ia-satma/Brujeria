import OpenAI from "openai";
import { 
  Skill, 
  DynamicSubagent, 
  createEmptySkill, 
  generateSkillPrompt,
  SkillSchema,
  DynamicSubagentSchema 
} from "./skill-schema";
import { getPCloudClient, getAgentFolderPath } from "../pcloud-client";
import { storage } from "../storage";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY!,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export interface SubagentExecutionResult {
  subagentId: string;
  name: string;
  finding: string;
  score: number;
  details: string[];
  confidence: number;
  appliedKnowledge: string[];
  recommendations: string[];
  executionTime: number;
}

export interface SkillLearning {
  type: 'benchmark' | 'case_study' | 'framework' | 'trend' | 'glossary';
  content: Record<string, unknown>;
  source: string;
  confidence: number;
}

export class SubagentFactory {
  private pcloud = getPCloudClient();
  private skillsCache: Map<string, Skill> = new Map();
  private subagentsCache: Map<string, DynamicSubagent> = new Map();
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;
    console.log("[SubagentFactory] Initializing...");
    this.initialized = true;
  }

  private getSkillsFolderPath(agentName: string): string {
    return `/BenchmarkingCouncil/${agentName}/skills`;
  }

  private getSubagentsFolderPath(agentName: string): string {
    return `/BenchmarkingCouncil/${agentName}/subagents`;
  }

  async createSkill(
    parentAgentId: string,
    name: string,
    domain: string,
    subDomain: string,
    initialKnowledge?: Partial<Skill['knowledgeBase']>
  ): Promise<Skill> {
    const id = `skill_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const skill = createEmptySkill(id, name, parentAgentId, domain, subDomain);
    
    if (initialKnowledge) {
      skill.knowledgeBase = {
        ...skill.knowledgeBase,
        ...initialKnowledge,
      };
    }

    await this.saveSkill(skill);
    
    console.log(`[SubagentFactory] Created skill: ${name} (${id}) for ${parentAgentId}`);
    
    return skill;
  }

  async createDynamicSubagent(
    parentAgentId: string,
    name: string,
    purpose: string,
    skillIds: string[],
    activationConditions: string[] = ["always"]
  ): Promise<DynamicSubagent> {
    const id = `subagent_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const now = new Date().toISOString();

    const skills = await Promise.all(
      skillIds.map(skillId => this.getSkill(parentAgentId, skillId))
    );
    const validSkills = skills.filter((s): s is Skill => s !== null);

    let combinedPrompt = `Eres ${name}, un subagente especializado creado dinámicamente.

PROPÓSITO: ${purpose}

Combinas el conocimiento de ${validSkills.length} skills especializados:
`;

    for (const skill of validSkills) {
      combinedPrompt += `\n--- Skill: ${skill.name} ---\n`;
      combinedPrompt += generateSkillPrompt(skill);
    }

    combinedPrompt += `

Analiza el contenido proporcionado y genera insights valiosos basados en tu conocimiento especializado.

Retorna SOLO JSON válido:
{
  "finding": "Hallazgo principal en una oración",
  "score": 7,
  "details": ["Detalle específico 1", "Detalle específico 2", "Detalle específico 3"],
  "confidence": 0.85,
  "appliedKnowledge": ["Knowledge aplicado del skill"],
  "recommendations": ["Recomendación accionable"]
}`;

    const subagent: DynamicSubagent = {
      id,
      name,
      parentAgentId,
      purpose,
      activationConditions,
      skills: skillIds,
      prompt: combinedPrompt,
      configuration: {
        model: "gpt-4o-mini",
        temperature: 0.7,
        maxTokens: 2000,
        timeout: 30000,
      },
      metadata: {
        createdAt: now,
        createdBy: parentAgentId,
        version: 1,
        isActive: true,
        lastExecuted: null,
        executionCount: 0,
        averageScore: null,
      },
    };

    await this.saveSubagent(subagent);
    
    console.log(`[SubagentFactory] Created dynamic subagent: ${name} (${id}) with ${validSkills.length} skills`);
    
    return subagent;
  }

  async executeSubagent(
    subagentId: string,
    parentAgentId: string,
    context: string,
    log?: (message: string) => void
  ): Promise<SubagentExecutionResult> {
    const startTime = Date.now();
    
    const subagent = await this.getSubagent(parentAgentId, subagentId);
    if (!subagent) {
      throw new Error(`Subagent ${subagentId} not found`);
    }

    log?.(`    > [${subagent.name}] Executing dynamic subagent...`);

    try {
      const completion = await openai.chat.completions.create({
        model: subagent.configuration.model,
        messages: [
          { role: "system", content: subagent.prompt },
          { role: "user", content: context }
        ],
        temperature: subagent.configuration.temperature,
        max_tokens: subagent.configuration.maxTokens,
        response_format: { type: "json_object" }
      });

      const result = JSON.parse(completion.choices[0].message.content || '{}');
      const executionTime = Date.now() - startTime;

      subagent.metadata.lastExecuted = new Date().toISOString();
      subagent.metadata.executionCount++;
      
      const prevAvg = subagent.metadata.averageScore || result.score;
      const prevCount = subagent.metadata.executionCount - 1;
      subagent.metadata.averageScore = (prevAvg * prevCount + result.score) / subagent.metadata.executionCount;
      
      await this.saveSubagent(subagent);

      log?.(`    > [${subagent.name}] Score: ${result.score}/10 - ${result.finding}`);

      return {
        subagentId,
        name: subagent.name,
        finding: result.finding || 'Analysis complete',
        score: result.score || 5,
        details: result.details || [],
        confidence: result.confidence || 0.5,
        appliedKnowledge: result.appliedKnowledge || [],
        recommendations: result.recommendations || [],
        executionTime,
      };
    } catch (error: any) {
      log?.(`    > [${subagent.name}] ERROR: ${error.message}`);
      
      return {
        subagentId,
        name: subagent.name,
        finding: 'Analysis failed',
        score: 5,
        details: [`Error: ${error.message}`],
        confidence: 0,
        appliedKnowledge: [],
        recommendations: [],
        executionTime: Date.now() - startTime,
      };
    }
  }

  async addLearningToSkill(
    parentAgentId: string,
    skillId: string,
    learning: SkillLearning
  ): Promise<Skill | null> {
    const skill = await this.getSkill(parentAgentId, skillId);
    if (!skill) return null;

    const now = new Date().toISOString();

    switch (learning.type) {
      case 'benchmark':
        skill.knowledgeBase.benchmarks.push(learning.content as any);
        break;
      case 'case_study':
        skill.practicalContent.caseStudies.push(learning.content as any);
        break;
      case 'framework':
        skill.knowledgeBase.theoreticalFrameworks.push(learning.content as any);
        break;
      case 'trend':
        skill.contextualInfo.trends.push(learning.content as any);
        break;
      case 'glossary':
        skill.knowledgeBase.glossary.push(learning.content as any);
        break;
    }

    const oldVersion = skill.version;
    const versionParts = skill.version.split('.');
    versionParts[2] = String(parseInt(versionParts[2]) + 1);
    skill.version = versionParts.join('.');
    skill.updatedAt = now;

    skill.evolutionHistory.push({
      version: skill.version,
      date: now,
      changes: [`Added ${learning.type}: ${learning.source}`],
      performanceImpact: 0,
    });

    await this.saveSkill(skill);
    
    console.log(`[SubagentFactory] Added ${learning.type} to skill ${skill.name} (${oldVersion} -> ${skill.version})`);
    
    return skill;
  }

  async evolveSkillExpertise(
    parentAgentId: string,
    skillId: string,
    performanceData: { score: number; successRate: number }
  ): Promise<Skill | null> {
    const skill = await this.getSkill(parentAgentId, skillId);
    if (!skill) return null;

    skill.performanceMetrics.usageCount++;
    skill.performanceMetrics.lastUsed = new Date().toISOString();
    
    const prevAvg = skill.performanceMetrics.averageScore;
    const prevCount = skill.performanceMetrics.usageCount - 1;
    skill.performanceMetrics.averageScore = 
      (prevAvg * prevCount + performanceData.score) / skill.performanceMetrics.usageCount;
    
    skill.performanceMetrics.successRate = 
      (skill.performanceMetrics.successRate * prevCount + performanceData.successRate) / 
      skill.performanceMetrics.usageCount;

    const levels: Array<Skill['specialization']['expertiseLevel']> = 
      ["novice", "intermediate", "advanced", "expert", "master"];
    const currentIndex = levels.indexOf(skill.specialization.expertiseLevel);
    
    if (
      skill.performanceMetrics.usageCount >= 10 &&
      skill.performanceMetrics.averageScore >= 7 &&
      skill.performanceMetrics.successRate >= 0.8 &&
      currentIndex < levels.length - 1
    ) {
      skill.specialization.expertiseLevel = levels[currentIndex + 1];
      
      skill.evolutionHistory.push({
        version: skill.version,
        date: new Date().toISOString(),
        changes: [`Expertise level upgraded to ${skill.specialization.expertiseLevel}`],
        performanceImpact: 0.1,
      });
      
      console.log(`[SubagentFactory] Skill ${skill.name} upgraded to ${skill.specialization.expertiseLevel}`);
    }

    await this.saveSkill(skill);
    return skill;
  }

  async saveSkill(skill: Skill): Promise<void> {
    const folderPath = this.getSkillsFolderPath(skill.parentAgentId);
    const fileName = `${skill.id}.json`;
    
    await this.pcloud.uploadJsonFile(folderPath, fileName, skill);
    this.skillsCache.set(`${skill.parentAgentId}:${skill.id}`, skill);
    
    try {
      await storage.logAgentLearningEvent({
        agentName: skill.parentAgentId,
        eventType: 'skill_saved',
        description: `Saved skill: ${skill.name} v${skill.version}`,
        metadata: {
          skillId: skill.id,
          version: skill.version,
          expertiseLevel: skill.specialization.expertiseLevel,
        },
      });
    } catch (err) {
      console.error('[SubagentFactory] Failed to log skill save:', err);
    }
  }

  async getSkill(parentAgentId: string, skillId: string): Promise<Skill | null> {
    const cacheKey = `${parentAgentId}:${skillId}`;
    
    if (this.skillsCache.has(cacheKey)) {
      return this.skillsCache.get(cacheKey)!;
    }

    try {
      const folderPath = this.getSkillsFolderPath(parentAgentId);
      const filePath = `${folderPath}/${skillId}.json`;
      
      const skill = await this.pcloud.downloadJsonFile<Skill>(filePath);
      const validated = SkillSchema.parse(skill);
      
      this.skillsCache.set(cacheKey, validated);
      return validated;
    } catch (err) {
      console.error(`[SubagentFactory] Failed to load skill ${skillId}:`, err);
      return null;
    }
  }

  async listSkills(parentAgentId: string): Promise<Skill[]> {
    try {
      const folderPath = this.getSkillsFolderPath(parentAgentId);
      const files = await this.pcloud.listJsonFiles(folderPath);
      
      const skills: Skill[] = [];
      for (const file of files) {
        try {
          const filePath = `${folderPath}/${file.name}`;
          const skill = await this.pcloud.downloadJsonFile<Skill>(filePath);
          const validated = SkillSchema.parse(skill);
          skills.push(validated);
          this.skillsCache.set(`${parentAgentId}:${validated.id}`, validated);
        } catch (err) {
          console.error(`[SubagentFactory] Failed to load skill file ${file.name}:`, err);
        }
      }
      
      return skills;
    } catch (err) {
      console.error(`[SubagentFactory] Failed to list skills for ${parentAgentId}:`, err);
      return [];
    }
  }

  async saveSubagent(subagent: DynamicSubagent): Promise<void> {
    const folderPath = this.getSubagentsFolderPath(subagent.parentAgentId);
    const fileName = `${subagent.id}.json`;
    
    await this.pcloud.uploadJsonFile(folderPath, fileName, subagent);
    this.subagentsCache.set(`${subagent.parentAgentId}:${subagent.id}`, subagent);
    
    try {
      await storage.logAgentLearningEvent({
        agentName: subagent.parentAgentId,
        eventType: 'subagent_saved',
        description: `Saved dynamic subagent: ${subagent.name}`,
        metadata: {
          subagentId: subagent.id,
          skillCount: subagent.skills.length,
          executionCount: subagent.metadata.executionCount,
        },
      });
    } catch (err) {
      console.error('[SubagentFactory] Failed to log subagent save:', err);
    }
  }

  async getSubagent(parentAgentId: string, subagentId: string): Promise<DynamicSubagent | null> {
    const cacheKey = `${parentAgentId}:${subagentId}`;
    
    if (this.subagentsCache.has(cacheKey)) {
      return this.subagentsCache.get(cacheKey)!;
    }

    try {
      const folderPath = this.getSubagentsFolderPath(parentAgentId);
      const filePath = `${folderPath}/${subagentId}.json`;
      
      const subagent = await this.pcloud.downloadJsonFile<DynamicSubagent>(filePath);
      const validated = DynamicSubagentSchema.parse(subagent);
      
      this.subagentsCache.set(cacheKey, validated);
      return validated;
    } catch (err) {
      console.error(`[SubagentFactory] Failed to load subagent ${subagentId}:`, err);
      return null;
    }
  }

  async listSubagents(parentAgentId: string): Promise<DynamicSubagent[]> {
    try {
      const folderPath = this.getSubagentsFolderPath(parentAgentId);
      
      let files: Array<{ name: string }> = [];
      try {
        files = await this.pcloud.listJsonFiles(folderPath);
      } catch (listError: any) {
        if (listError.message?.includes('does not exist') || listError.message?.includes('not found')) {
          return [];
        }
        throw listError;
      }
      
      const subagents: DynamicSubagent[] = [];
      for (const file of files) {
        try {
          const filePath = `${folderPath}/${file.name}`;
          const subagent = await this.pcloud.downloadJsonFile<DynamicSubagent>(filePath);
          const validated = DynamicSubagentSchema.parse(subagent);
          subagents.push(validated);
          this.subagentsCache.set(`${parentAgentId}:${validated.id}`, validated);
        } catch (err) {
          console.error(`[SubagentFactory] Failed to load subagent file ${file.name}:`, err);
        }
      }
      
      return subagents;
    } catch (err) {
      console.error(`[SubagentFactory] Failed to list subagents for ${parentAgentId}:`, err);
      return [];
    }
  }

  async getActiveSubagentsForCondition(
    parentAgentId: string,
    condition: string
  ): Promise<DynamicSubagent[]> {
    const allSubagents = await this.listSubagents(parentAgentId);
    
    return allSubagents.filter(subagent => 
      subagent.metadata.isActive && 
      (subagent.activationConditions.includes("always") || 
       subagent.activationConditions.includes(condition))
    );
  }

  async generateSpecializationRecommendations(
    parentAgentId: string,
    analysisHistory: Array<{ domain: string; score: number; frequency: number }>
  ): Promise<Array<{ domain: string; subDomain: string; rationale: string }>> {
    const lowScoreAreas = analysisHistory
      .filter(h => h.score < 6 && h.frequency >= 3)
      .sort((a, b) => a.score - b.score);

    const recommendations: Array<{ domain: string; subDomain: string; rationale: string }> = [];

    for (const area of lowScoreAreas.slice(0, 3)) {
      recommendations.push({
        domain: area.domain,
        subDomain: `${area.domain}_specialist`,
        rationale: `Área con score promedio ${area.score.toFixed(1)} en ${area.frequency} análisis. Crear skill especializado mejoraría la precisión.`,
      });
    }

    return recommendations;
  }
}

const DEFAULT_SKILLS_CONFIG: Record<string, Array<{
  name: string;
  domain: string;
  subDomain: string;
  description: string;
}>> = {
  Visual_Aesthetics_Agent: [
    {
      name: "Color Psychology",
      domain: "visual_design",
      subDomain: "color_analysis",
      description: "Análisis del impacto psicológico y emocional de las paletas de colores"
    },
    {
      name: "Typography Expertise",
      domain: "visual_design", 
      subDomain: "typography",
      description: "Evaluación de tipografías, legibilidad y jerarquía visual"
    },
    {
      name: "Visual Hierarchy",
      domain: "visual_design",
      subDomain: "layout_composition",
      description: "Análisis de composición, whitespace y flujo visual"
    }
  ],
  UX_Navigation_Agent: [
    {
      name: "User Flow Analysis",
      domain: "user_experience",
      subDomain: "navigation_patterns",
      description: "Evaluación de flujos de usuario y arquitectura de información"
    },
    {
      name: "Accessibility Expertise",
      domain: "user_experience",
      subDomain: "wcag_compliance",
      description: "Análisis de accesibilidad y cumplimiento de estándares WCAG"
    },
    {
      name: "Conversion Optimization",
      domain: "user_experience",
      subDomain: "cta_effectiveness",
      description: "Evaluación de CTAs, formularios y puntos de conversión"
    }
  ],
  Content_Storytelling_Agent: [
    {
      name: "Brand Voice Analysis",
      domain: "content_strategy",
      subDomain: "brand_messaging",
      description: "Evaluación de consistencia de voz de marca y messaging"
    },
    {
      name: "SEO Content Expertise",
      domain: "content_strategy",
      subDomain: "seo_optimization",
      description: "Análisis de optimización de contenido para motores de búsqueda"
    },
    {
      name: "Narrative Structure",
      domain: "content_strategy",
      subDomain: "storytelling",
      description: "Evaluación de estructura narrativa y persuasión"
    }
  ],
  Technical_Performance_Agent: [
    {
      name: "Performance Optimization",
      domain: "technical",
      subDomain: "page_speed",
      description: "Análisis de velocidad de carga y optimización de rendimiento"
    },
    {
      name: "SEO Technical Expertise",
      domain: "technical",
      subDomain: "seo_technical",
      description: "Evaluación de aspectos técnicos de SEO y structured data"
    },
    {
      name: "Code Quality Analysis",
      domain: "technical",
      subDomain: "markup_validation",
      description: "Análisis de calidad de código HTML, accesibilidad técnica y best practices"
    }
  ]
};

let factoryInstance: SubagentFactory | null = null;

export function getSubagentFactory(): SubagentFactory {
  if (!factoryInstance) {
    factoryInstance = new SubagentFactory();
  }
  return factoryInstance;
}

export async function initializeDefaultSkills(): Promise<{ 
  skillsCreated: number; 
  skillsExisting: number; 
  subagentsCreated: number;
  subagentsExisting: number;
  errors: string[] 
}> {
  const factory = getSubagentFactory();
  await factory.initialize();
  
  let skillsCreated = 0;
  let skillsExisting = 0;
  let subagentsCreated = 0;
  let subagentsExisting = 0;
  const errors: string[] = [];
  
  console.log("[SubagentFactory] Checking default skills and subagents for all agents...");
  
  for (const [agentName, defaultSkills] of Object.entries(DEFAULT_SKILLS_CONFIG)) {
    try {
      const existingSkills = await factory.listSkills(agentName);
      const existingSkillNames = new Set(existingSkills.map(s => s.name.toLowerCase()));
      const skillIdByName = new Map<string, string>();
      
      for (const skill of existingSkills) {
        skillIdByName.set(skill.name.toLowerCase(), skill.id);
      }
      
      for (const skillConfig of defaultSkills) {
        const skillNameLower = skillConfig.name.toLowerCase();
        
        if (existingSkillNames.has(skillNameLower)) {
          skillsExisting++;
        } else {
          try {
            const newSkill = await factory.createSkill(
              agentName,
              skillConfig.name,
              skillConfig.domain,
              skillConfig.subDomain
            );
            skillIdByName.set(skillNameLower, newSkill.id);
            skillsCreated++;
            console.log(`[SubagentFactory] ✓ Created skill "${skillConfig.name}" for ${agentName}`);
          } catch (skillError: any) {
            const errMsg = `Failed to create skill "${skillConfig.name}" for ${agentName}: ${skillError.message}`;
            errors.push(errMsg);
            console.error(`[SubagentFactory] ✗ ${errMsg}`);
          }
        }
      }
      
      const existingSubagents = await factory.listSubagents(agentName);
      const existingSubagentNames = new Set(existingSubagents.map(s => s.name.toLowerCase()));
      
      for (const skillConfig of defaultSkills) {
        const subagentName = `${skillConfig.name} Specialist`;
        const skillNameLower = skillConfig.name.toLowerCase();
        const skillId = skillIdByName.get(skillNameLower);
        
        if (!skillId) {
          continue;
        }
        
        if (existingSubagentNames.has(subagentName.toLowerCase())) {
          subagentsExisting++;
          continue;
        }
        
        try {
          await factory.createDynamicSubagent(
            agentName,
            subagentName,
            skillConfig.description,
            [skillId],
            ["always"]
          );
          subagentsCreated++;
          console.log(`[SubagentFactory] ✓ Created subagent "${subagentName}" for ${agentName}`);
        } catch (subagentError: any) {
          const errMsg = `Failed to create subagent "${subagentName}" for ${agentName}: ${subagentError.message}`;
          errors.push(errMsg);
          console.error(`[SubagentFactory] ✗ ${errMsg}`);
        }
      }
    } catch (agentError: any) {
      const errMsg = `Failed to process agent ${agentName}: ${agentError.message}`;
      errors.push(errMsg);
      console.error(`[SubagentFactory] ✗ ${errMsg}`);
    }
  }
  
  console.log(`[SubagentFactory] Initialization complete:`);
  console.log(`  - Skills: ${skillsCreated} created, ${skillsExisting} already exist`);
  console.log(`  - Subagents: ${subagentsCreated} created, ${subagentsExisting} already exist`);
  if (errors.length > 0) {
    console.log(`  - Errors: ${errors.length}`);
  }
  
  return { skillsCreated, skillsExisting, subagentsCreated, subagentsExisting, errors };
}
