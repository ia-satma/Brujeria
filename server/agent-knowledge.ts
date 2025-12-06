import { 
  getPCloudClient, 
  getAgentFolderPath, 
  getCurrentMonthFolder,
  type PCloudFileMetadata 
} from "./pcloud-client";
import { storage } from "./storage";
import type { 
  AgentKnowledgeDocument,
  InsertAgentKnowledgeDocument,
  AgentState,
  AgentLearningEvent
} from "@shared/schema";

export const AGENT_NAMES = {
  BENCHMARKING_MANAGER: "Benchmarking_Manager",
  SCRAPING_ORCHESTRATOR: "Scraping_Orchestrator",
  VISUAL_AESTHETICS_AGENT: "Visual_Aesthetics_Agent",
  UX_NAVIGATION_AGENT: "UX_Navigation_Agent",
  CONTENT_STORYTELLING_AGENT: "Content_Storytelling_Agent",
  TECHNICAL_PERFORMANCE_AGENT: "Technical_Performance_Agent",
  COLOR_PALETTE_ANALYZER: "Color_Palette_Analyzer",
  TYPO_READABILITY_CHECKER: "Typo_Readability_Checker",
  DESIGN_TREND_EVALUATOR: "Design_Trend_Evaluator",
  INFORMATION_ARCHITECTURE_MAPPER: "Information_Architecture_Mapper",
  CTA_EFFECTIVENESS_SCORER: "CTA_Effectiveness_Scorer",
  RESPONSIVE_DESIGN_INFERRER: "Responsive_Design_Inferrer",
  BRAND_VOICE_VALIDATOR: "Brand_Voice_Validator",
  THOUGHT_LEADERSHIP_SCRUTINIZER: "Thought_Leadership_Scrutinizer",
  CREDIBILITY_EVIDENCE_COLLECTOR: "Credibility_Evidence_Collector",
  PAGE_SPEED_PREDICTOR: "Page_Speed_Predictor",
  SEO_SIGNAL_DETECTOR: "SEO_Signal_Detector",
  CONTENT_STRUCTURE_AUDITOR: "Content_Structure_Auditor",
} as const;

export type AgentName = typeof AGENT_NAMES[keyof typeof AGENT_NAMES];

export const ORCHESTRATOR_AGENTS: AgentName[] = [
  AGENT_NAMES.BENCHMARKING_MANAGER,
  AGENT_NAMES.SCRAPING_ORCHESTRATOR,
];

export const PRIMARY_AGENTS: AgentName[] = [
  AGENT_NAMES.VISUAL_AESTHETICS_AGENT,
  AGENT_NAMES.UX_NAVIGATION_AGENT,
  AGENT_NAMES.CONTENT_STORYTELLING_AGENT,
  AGENT_NAMES.TECHNICAL_PERFORMANCE_AGENT,
];

export const SUB_AGENTS: Record<AgentName, AgentName[]> = {
  [AGENT_NAMES.BENCHMARKING_MANAGER]: [],
  [AGENT_NAMES.SCRAPING_ORCHESTRATOR]: [],
  [AGENT_NAMES.VISUAL_AESTHETICS_AGENT]: [
    AGENT_NAMES.COLOR_PALETTE_ANALYZER,
    AGENT_NAMES.TYPO_READABILITY_CHECKER,
    AGENT_NAMES.DESIGN_TREND_EVALUATOR,
  ],
  [AGENT_NAMES.UX_NAVIGATION_AGENT]: [
    AGENT_NAMES.INFORMATION_ARCHITECTURE_MAPPER,
    AGENT_NAMES.CTA_EFFECTIVENESS_SCORER,
    AGENT_NAMES.RESPONSIVE_DESIGN_INFERRER,
  ],
  [AGENT_NAMES.CONTENT_STORYTELLING_AGENT]: [
    AGENT_NAMES.BRAND_VOICE_VALIDATOR,
    AGENT_NAMES.THOUGHT_LEADERSHIP_SCRUTINIZER,
    AGENT_NAMES.CREDIBILITY_EVIDENCE_COLLECTOR,
  ],
  [AGENT_NAMES.TECHNICAL_PERFORMANCE_AGENT]: [
    AGENT_NAMES.PAGE_SPEED_PREDICTOR,
    AGENT_NAMES.SEO_SIGNAL_DETECTOR,
    AGENT_NAMES.CONTENT_STRUCTURE_AUDITOR,
  ],
  [AGENT_NAMES.COLOR_PALETTE_ANALYZER]: [],
  [AGENT_NAMES.TYPO_READABILITY_CHECKER]: [],
  [AGENT_NAMES.DESIGN_TREND_EVALUATOR]: [],
  [AGENT_NAMES.INFORMATION_ARCHITECTURE_MAPPER]: [],
  [AGENT_NAMES.CTA_EFFECTIVENESS_SCORER]: [],
  [AGENT_NAMES.RESPONSIVE_DESIGN_INFERRER]: [],
  [AGENT_NAMES.BRAND_VOICE_VALIDATOR]: [],
  [AGENT_NAMES.THOUGHT_LEADERSHIP_SCRUTINIZER]: [],
  [AGENT_NAMES.CREDIBILITY_EVIDENCE_COLLECTOR]: [],
  [AGENT_NAMES.PAGE_SPEED_PREDICTOR]: [],
  [AGENT_NAMES.SEO_SIGNAL_DETECTOR]: [],
  [AGENT_NAMES.CONTENT_STRUCTURE_AUDITOR]: [],
};

export const ALL_AGENTS: AgentName[] = Object.values(AGENT_NAMES);

export interface KnowledgeDocument {
  id: string;
  agentName: AgentName;
  documentType: 'analysis' | 'pattern' | 'learning' | 'recommendation';
  title: string;
  content: object;
  sourceUrl?: string;
  tags: string[];
  createdAt: string;
  version: number;
}

export interface AgentKnowledgeStats {
  agentName: AgentName;
  folderPath: string;
  documentCount: number;
  lastUpdated: string | null;
  monthlyBreakdown: Record<string, number>;
}

export class AgentKnowledgeService {
  private pcloud = getPCloudClient();
  private initialized = false;
  private initPromise: Promise<void> | null = null;

  async initialize(): Promise<void> {
    if (this.initialized) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = this.initializeAllFolders();
    await this.initPromise;
    this.initialized = true;
  }

  private async initializeAllFolders(): Promise<void> {
    console.log("[AgentKnowledge] Initializing folder structure for all agents...");
    
    const results = await Promise.allSettled(
      ALL_AGENTS.map(agentName => this.ensureAgentFolder(agentName))
    );

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;
    
    console.log(`[AgentKnowledge] Initialized ${successful} agent folders (${failed} failed)`);
  }

  async ensureAgentFolder(agentName: AgentName): Promise<string> {
    const folderPath = getAgentFolderPath(agentName);
    await this.pcloud.ensureFolderPath(folderPath);
    return folderPath;
  }

  async saveKnowledge(
    agentName: AgentName,
    documentType: KnowledgeDocument['documentType'],
    title: string,
    content: object,
    options: {
      sourceUrl?: string;
      tags?: string[];
      score?: number;
    } = {}
  ): Promise<{ filePath: string; fileId: number; documentId: string }> {
    await this.initialize();

    const folderPath = getAgentFolderPath(agentName);
    const timestamp = new Date().toISOString();
    const id = `${documentType}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    
    const document: KnowledgeDocument = {
      id,
      agentName,
      documentType,
      title,
      content,
      sourceUrl: options.sourceUrl,
      tags: options.tags || [],
      createdAt: timestamp,
      version: 1,
    };

    const fileName = `${id}.json`;
    const result = await this.pcloud.uploadJsonFile(folderPath, fileName, document);
    const filePath = `${folderPath}/${fileName}`;

    try {
      const dbDoc: InsertAgentKnowledgeDocument = {
        documentId: id,
        agentName,
        documentType,
        title,
        pcloudFilePath: filePath,
        pcloudFileId: String(result.fileid),
        sourceUrl: options.sourceUrl || null,
        tags: options.tags || [],
        score: options.score || null,
        version: 1,
      };
      await storage.saveKnowledgeDocument(dbDoc);
      
      const docTypeKey = documentType === 'analysis' ? 'analysis' : 
                         documentType === 'pattern' ? 'pattern' : 'learning';
      await storage.incrementAgentStats(agentName, docTypeKey);
      
      await storage.logAgentLearningEvent({
        agentName,
        eventType: `saved_${documentType}`,
        description: `Saved ${documentType}: ${title}`,
        metadata: { 
          documentId: id, 
          sourceUrl: options.sourceUrl,
          score: options.score 
        },
        sourceDocumentId: id,
      });
      
      console.log(`[AgentKnowledge] Saved ${documentType} for ${agentName}: ${fileName} (DB synced)`);
    } catch (dbError) {
      console.error(`[AgentKnowledge] DB sync failed for ${id}:`, dbError);
    }
    
    return {
      filePath,
      fileId: result.fileid,
      documentId: id,
    };
  }

  async saveAnalysisResult(
    agentName: AgentName,
    analysisData: {
      url: string;
      score: number;
      observations: string;
      strengths: string[];
      weaknesses: string[];
      subagentResults?: Array<{
        name: string;
        finding: string;
        score: number;
        details: string[];
      }>;
    }
  ): Promise<{ filePath: string; fileId: number; documentId: string }> {
    const domain = new URL(analysisData.url).hostname.replace('www.', '');
    const title = `Analysis of ${domain}`;
    
    return this.saveKnowledge(agentName, 'analysis', title, analysisData, {
      sourceUrl: analysisData.url,
      tags: ['analysis', domain],
      score: analysisData.score,
    });
  }

  async saveLearnedPattern(
    agentName: AgentName,
    patternData: {
      patternType: string;
      description: string;
      examples: string[];
      confidence: number;
      applicableIndustries?: string[];
    }
  ): Promise<{ filePath: string; fileId: number; documentId: string }> {
    const title = `Pattern: ${patternData.patternType}`;
    const tags = ['pattern', patternData.patternType];
    if (patternData.applicableIndustries) {
      tags.push(...patternData.applicableIndustries);
    }
    
    return this.saveKnowledge(agentName, 'pattern', title, patternData, {
      tags,
      score: patternData.confidence * 10,
    });
  }

  async getAgentDocuments(
    agentName: AgentName,
    options: {
      documentType?: KnowledgeDocument['documentType'];
      limit?: number;
    } = {}
  ): Promise<KnowledgeDocument[]> {
    await this.initialize();

    const folderPath = getAgentFolderPath(agentName);
    
    try {
      const files = await this.pcloud.listJsonFiles(folderPath);
      
      let filteredFiles = files;
      if (options.documentType) {
        filteredFiles = files.filter(f => f.name.startsWith(options.documentType!));
      }

      const sortedFiles = filteredFiles.sort((a, b) => 
        new Date(b.modified).getTime() - new Date(a.modified).getTime()
      );

      const limitedFiles = options.limit 
        ? sortedFiles.slice(0, options.limit) 
        : sortedFiles;

      const documents: KnowledgeDocument[] = [];
      
      for (const file of limitedFiles) {
        try {
          const doc = await this.pcloud.downloadJsonFile<KnowledgeDocument>(
            `${folderPath}/${file.name}`
          );
          documents.push(doc);
        } catch (err) {
          console.error(`[AgentKnowledge] Failed to load ${file.name}:`, err);
        }
      }

      return documents;
    } catch (err) {
      console.error(`[AgentKnowledge] Failed to list documents for ${agentName}:`, err);
      return [];
    }
  }

  async getAgentStats(agentName: AgentName): Promise<AgentKnowledgeStats> {
    const baseFolderPath = `/BenchmarkingCouncil/${agentName}`;
    
    try {
      const dbState = await storage.getAgentState(agentName);
      if (dbState) {
        return {
          agentName,
          folderPath: baseFolderPath,
          documentCount: dbState.totalDocuments,
          lastUpdated: dbState.lastActivityAt?.toISOString() || null,
          monthlyBreakdown: {},
        };
      }
    } catch (err) {
      console.error(`[AgentKnowledge] Failed to get DB stats for ${agentName}:`, err);
    }

    const monthlyBreakdown: Record<string, number> = {};
    let totalDocuments = 0;
    let lastUpdated: string | null = null;

    try {
      const monthFolders = await this.pcloud.listFolder(baseFolderPath);
      
      for (const folder of monthFolders) {
        if (folder.isfolder) {
          try {
            const files = await this.pcloud.listJsonFiles(`${baseFolderPath}/${folder.name}`);
            monthlyBreakdown[folder.name] = files.length;
            totalDocuments += files.length;
            
            for (const file of files) {
              if (!lastUpdated || new Date(file.modified) > new Date(lastUpdated)) {
                lastUpdated = file.modified;
              }
            }
          } catch {
          }
        }
      }
    } catch {
    }

    return {
      agentName,
      folderPath: baseFolderPath,
      documentCount: totalDocuments,
      lastUpdated,
      monthlyBreakdown,
    };
  }

  async getAgentStateFromDB(agentName: AgentName): Promise<AgentState | null> {
    try {
      const state = await storage.getAgentState(agentName);
      return state || null;
    } catch {
      return null;
    }
  }

  async getAgentLearningHistory(agentName: AgentName, limit: number = 20): Promise<AgentLearningEvent[]> {
    try {
      return await storage.getAgentLearningEvents(agentName, limit);
    } catch {
      return [];
    }
  }

  async getAllAgentStates(): Promise<Map<AgentName, AgentState | null>> {
    const states = new Map<AgentName, AgentState | null>();
    await Promise.allSettled(
      ALL_AGENTS.map(async (agentName) => {
        const state = await this.getAgentStateFromDB(agentName);
        states.set(agentName, state);
      })
    );
    return states;
  }

  async searchKnowledge(
    query: string,
    options: {
      agentNames?: AgentName[];
      documentTypes?: KnowledgeDocument['documentType'][];
      limit?: number;
    } = {}
  ): Promise<KnowledgeDocument[]> {
    try {
      const dbDocs = await storage.searchKnowledgeDocuments({
        agentName: options.agentNames?.[0],
        documentType: options.documentTypes?.[0],
      }, options.limit || 50);
      
      const queryLower = query.toLowerCase();
      const filteredDbDocs = dbDocs.filter(doc => {
        const titleMatch = doc.title.toLowerCase().includes(queryLower);
        const tagMatch = (doc.tags as string[]).some(tag => tag.toLowerCase().includes(queryLower));
        return titleMatch || tagMatch;
      });

      const fullDocuments: KnowledgeDocument[] = [];
      for (const dbDoc of filteredDbDocs.slice(0, options.limit || 20)) {
        try {
          const fullDoc = await this.pcloud.downloadJsonFile<KnowledgeDocument>(dbDoc.pcloudFilePath);
          fullDocuments.push(fullDoc);
        } catch (err) {
          console.error(`[AgentKnowledge] Failed to fetch content for ${dbDoc.documentId}:`, err);
        }
      }
      
      if (fullDocuments.length > 0) {
        return fullDocuments;
      }
    } catch (dbError) {
      console.error('[AgentKnowledge] DB search failed, falling back to pCloud:', dbError);
    }

    const agents = options.agentNames || ALL_AGENTS;
    const allDocuments: KnowledgeDocument[] = [];

    for (const agentName of agents) {
      const docs = await this.getAgentDocuments(agentName, {
        documentType: options.documentTypes?.[0],
        limit: options.limit,
      });
      allDocuments.push(...docs);
    }

    const queryLower = query.toLowerCase();
    const filtered = allDocuments.filter(doc => {
      const titleMatch = doc.title.toLowerCase().includes(queryLower);
      const tagMatch = doc.tags.some(tag => tag.toLowerCase().includes(queryLower));
      const contentStr = JSON.stringify(doc.content).toLowerCase();
      const contentMatch = contentStr.includes(queryLower);
      
      return titleMatch || tagMatch || contentMatch;
    });

    return filtered.slice(0, options.limit || 50);
  }

  async searchKnowledgeByTags(
    tags: string[],
    options: {
      agentNames?: AgentName[];
      documentTypes?: KnowledgeDocument['documentType'][];
      limit?: number;
    } = {}
  ): Promise<AgentKnowledgeDocument[]> {
    try {
      return await storage.searchKnowledgeDocuments({
        agentName: options.agentNames?.[0],
        documentType: options.documentTypes?.[0],
        tags,
      }, options.limit || 50);
    } catch {
      return [];
    }
  }

  async getDocumentMetadataFromDB(agentName: AgentName, limit: number = 50): Promise<AgentKnowledgeDocument[]> {
    try {
      return await storage.getAgentKnowledgeDocuments(agentName, limit);
    } catch {
      return [];
    }
  }

  async getRelatedKnowledge(
    agentName: AgentName,
    context: {
      url?: string;
      industry?: string;
      tags?: string[];
    },
    limit: number = 5
  ): Promise<KnowledgeDocument[]> {
    const docs = await this.getAgentDocuments(agentName, { limit: 50 });
    
    const scored = docs.map(doc => {
      let score = 0;
      
      if (context.url && doc.sourceUrl) {
        try {
          const contextDomain = new URL(context.url).hostname;
          const docDomain = new URL(doc.sourceUrl).hostname;
          if (contextDomain === docDomain) score += 10;
        } catch {
        }
      }
      
      if (context.tags) {
        for (const tag of context.tags) {
          if (doc.tags.includes(tag)) score += 5;
        }
      }
      
      const docAge = Date.now() - new Date(doc.createdAt).getTime();
      const daysSinceCreation = docAge / (1000 * 60 * 60 * 24);
      score += Math.max(0, 30 - daysSinceCreation);
      
      return { doc, score };
    });

    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => item.doc);
  }
}

let knowledgeServiceInstance: AgentKnowledgeService | null = null;

export function getAgentKnowledgeService(): AgentKnowledgeService {
  if (!knowledgeServiceInstance) {
    knowledgeServiceInstance = new AgentKnowledgeService();
  }
  return knowledgeServiceInstance;
}

export async function initializeAgentKnowledge(): Promise<void> {
  const service = getAgentKnowledgeService();
  await service.initialize();
}

export interface RAGContext {
  currentUrl?: string;
  industry?: string;
  analysisType?: 'visual' | 'ux' | 'content' | 'technical';
  keywords?: string[];
  minScore?: number;
}

export interface RAGResult {
  document: KnowledgeDocument;
  relevanceScore: number;
  sourceAgent: AgentName;
  matchedKeywords: string[];
}

export class CrossAgentRAGService {
  private knowledgeService: AgentKnowledgeService;
  
  constructor() {
    this.knowledgeService = getAgentKnowledgeService();
  }
  
  async retrieveRelevantKnowledge(
    requestingAgent: AgentName,
    context: RAGContext,
    limit: number = 10
  ): Promise<RAGResult[]> {
    const relevantAgents = this.getRelevantAgents(requestingAgent, context);
    const allResults: RAGResult[] = [];
    
    await Promise.all(
      relevantAgents.map(async (agentName) => {
        try {
          const dbDocs = await storage.getAgentKnowledgeDocuments(agentName, 20);
          
          for (const doc of dbDocs) {
            const relevanceScore = this.calculateRelevance(doc, context);
            if (relevanceScore > 0 && (!context.minScore || relevanceScore >= context.minScore)) {
              const matchedKeywords = this.findMatchedKeywords(doc, context.keywords || []);
              allResults.push({
                document: {
                  id: doc.documentId,
                  agentName: doc.agentName as AgentName,
                  documentType: doc.documentType as KnowledgeDocument['documentType'],
                  title: doc.title,
                  content: { pcloudPath: doc.pcloudFilePath },
                  sourceUrl: doc.sourceUrl || undefined,
                  tags: doc.tags as string[],
                  createdAt: doc.createdAt.toISOString(),
                  version: doc.version,
                },
                relevanceScore,
                sourceAgent: agentName,
                matchedKeywords,
              });
            }
          }
        } catch (err) {
          console.error(`[RAG] Failed to retrieve from ${agentName}:`, err);
        }
      })
    );
    
    return allResults
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit);
  }
  
  async retrieveWithFullContent(
    requestingAgent: AgentName,
    context: RAGContext,
    limit: number = 5
  ): Promise<RAGResult[]> {
    const results = await this.retrieveRelevantKnowledge(requestingAgent, context, limit);
    
    const pcloud = getPCloudClient();
    
    await Promise.all(
      results.map(async (result) => {
        try {
          const pcloudPath = (result.document.content as { pcloudPath?: string }).pcloudPath;
          if (pcloudPath) {
            const fullContent = await pcloud.downloadJsonFile<KnowledgeDocument>(pcloudPath);
            result.document = fullContent;
          }
        } catch (err) {
          console.error(`[RAG] Failed to fetch full content for ${result.document.id}:`, err);
        }
      })
    );
    
    return results;
  }
  
  private getRelevantAgents(requestingAgent: AgentName, context: RAGContext): AgentName[] {
    const relevantAgents = new Set<AgentName>();
    
    relevantAgents.add(requestingAgent);
    
    const parentAgent = Object.entries(SUB_AGENTS).find(([, subs]) => 
      (subs as AgentName[]).includes(requestingAgent)
    );
    if (parentAgent) {
      relevantAgents.add(parentAgent[0] as AgentName);
    }
    
    const subAgents = SUB_AGENTS[requestingAgent] || [];
    subAgents.forEach(sub => relevantAgents.add(sub));
    
    if (context.analysisType) {
      const analysisAgentMap: Record<string, AgentName[]> = {
        visual: [AGENT_NAMES.VISUAL_AESTHETICS_AGENT, AGENT_NAMES.COLOR_PALETTE_ANALYZER, AGENT_NAMES.TYPO_READABILITY_CHECKER, AGENT_NAMES.DESIGN_TREND_EVALUATOR],
        ux: [AGENT_NAMES.UX_NAVIGATION_AGENT, AGENT_NAMES.INFORMATION_ARCHITECTURE_MAPPER, AGENT_NAMES.CTA_EFFECTIVENESS_SCORER, AGENT_NAMES.RESPONSIVE_DESIGN_INFERRER],
        content: [AGENT_NAMES.CONTENT_STORYTELLING_AGENT, AGENT_NAMES.BRAND_VOICE_VALIDATOR, AGENT_NAMES.THOUGHT_LEADERSHIP_SCRUTINIZER, AGENT_NAMES.CREDIBILITY_EVIDENCE_COLLECTOR],
        technical: [AGENT_NAMES.TECHNICAL_PERFORMANCE_AGENT, AGENT_NAMES.PAGE_SPEED_PREDICTOR, AGENT_NAMES.SEO_SIGNAL_DETECTOR, AGENT_NAMES.CONTENT_STRUCTURE_AUDITOR],
      };
      
      const typeAgents = analysisAgentMap[context.analysisType] || [];
      typeAgents.forEach(agent => relevantAgents.add(agent));
    }
    
    return Array.from(relevantAgents);
  }
  
  private calculateRelevance(doc: AgentKnowledgeDocument, context: RAGContext): number {
    let score = 0;
    
    if (context.currentUrl && doc.sourceUrl) {
      try {
        const contextDomain = new URL(context.currentUrl).hostname.replace('www.', '');
        const docDomain = new URL(doc.sourceUrl).hostname.replace('www.', '');
        if (contextDomain === docDomain) score += 30;
        else if (contextDomain.includes(docDomain) || docDomain.includes(contextDomain)) score += 15;
      } catch {}
    }
    
    const docTags = doc.tags as string[];
    if (context.keywords) {
      for (const keyword of context.keywords) {
        const keywordLower = keyword.toLowerCase();
        if (doc.title.toLowerCase().includes(keywordLower)) score += 10;
        if (docTags.some(tag => tag.toLowerCase().includes(keywordLower))) score += 8;
      }
    }
    
    if (doc.score) {
      score += doc.score * 2;
    }
    
    const docAge = Date.now() - new Date(doc.createdAt).getTime();
    const daysSinceCreation = docAge / (1000 * 60 * 60 * 24);
    score += Math.max(0, 20 - daysSinceCreation);
    
    if (doc.documentType === 'pattern') score += 5;
    if (doc.documentType === 'analysis') score += 3;
    
    return score;
  }
  
  private findMatchedKeywords(doc: AgentKnowledgeDocument, keywords: string[]): string[] {
    const matched: string[] = [];
    const docTags = doc.tags as string[];
    const titleLower = doc.title.toLowerCase();
    
    for (const keyword of keywords) {
      const keywordLower = keyword.toLowerCase();
      if (titleLower.includes(keywordLower) || docTags.some(tag => tag.toLowerCase().includes(keywordLower))) {
        matched.push(keyword);
      }
    }
    
    return matched;
  }
  
  async getAgentExpertise(agentName: AgentName): Promise<{
    totalDocuments: number;
    topPatterns: string[];
    averageScore: number | null;
    specializationAreas: string[];
  }> {
    const state = await storage.getAgentState(agentName);
    
    if (!state) {
      return {
        totalDocuments: 0,
        topPatterns: [],
        averageScore: null,
        specializationAreas: [],
      };
    }
    
    return {
      totalDocuments: state.totalDocuments,
      topPatterns: [],
      averageScore: state.averageScore,
      specializationAreas: state.specializationAreas as string[],
    };
  }
  
  async findBestAgentForTask(task: string, context: RAGContext): Promise<{
    recommendedAgent: AgentName;
    confidence: number;
    reason: string;
  }> {
    const taskLower = task.toLowerCase();
    
    const agentKeywords: Record<AgentName, string[]> = {
      [AGENT_NAMES.VISUAL_AESTHETICS_AGENT]: ['color', 'design', 'visual', 'aesthetic', 'look', 'style', 'appearance'],
      [AGENT_NAMES.UX_NAVIGATION_AGENT]: ['navigation', 'ux', 'user experience', 'menu', 'cta', 'button', 'layout'],
      [AGENT_NAMES.CONTENT_STORYTELLING_AGENT]: ['content', 'copy', 'text', 'message', 'brand', 'voice', 'story'],
      [AGENT_NAMES.TECHNICAL_PERFORMANCE_AGENT]: ['speed', 'performance', 'seo', 'technical', 'loading', 'optimization'],
      [AGENT_NAMES.COLOR_PALETTE_ANALYZER]: ['color', 'palette', 'hue', 'saturation', 'contrast'],
      [AGENT_NAMES.TYPO_READABILITY_CHECKER]: ['typography', 'font', 'readability', 'text size'],
      [AGENT_NAMES.DESIGN_TREND_EVALUATOR]: ['trend', 'modern', 'outdated', 'current'],
      [AGENT_NAMES.INFORMATION_ARCHITECTURE_MAPPER]: ['structure', 'hierarchy', 'organization', 'sitemap'],
      [AGENT_NAMES.CTA_EFFECTIVENESS_SCORER]: ['cta', 'call to action', 'button', 'conversion'],
      [AGENT_NAMES.RESPONSIVE_DESIGN_INFERRER]: ['mobile', 'responsive', 'tablet', 'screen size'],
      [AGENT_NAMES.BRAND_VOICE_VALIDATOR]: ['brand', 'voice', 'tone', 'messaging'],
      [AGENT_NAMES.THOUGHT_LEADERSHIP_SCRUTINIZER]: ['thought leadership', 'expertise', 'authority'],
      [AGENT_NAMES.CREDIBILITY_EVIDENCE_COLLECTOR]: ['credibility', 'trust', 'testimonial', 'proof'],
      [AGENT_NAMES.PAGE_SPEED_PREDICTOR]: ['speed', 'loading', 'performance', 'fast'],
      [AGENT_NAMES.SEO_SIGNAL_DETECTOR]: ['seo', 'search', 'meta', 'keyword'],
      [AGENT_NAMES.CONTENT_STRUCTURE_AUDITOR]: ['structure', 'heading', 'content organization'],
      [AGENT_NAMES.BENCHMARKING_MANAGER]: ['overall', 'compare', 'benchmark', 'report'],
      [AGENT_NAMES.SCRAPING_ORCHESTRATOR]: ['scrape', 'fetch', 'extract', 'data'],
    };
    
    let bestAgent: AgentName = AGENT_NAMES.BENCHMARKING_MANAGER;
    let bestScore = 0;
    let matchedKeywords: string[] = [];
    
    for (const [agent, keywords] of Object.entries(agentKeywords)) {
      let score = 0;
      const matched: string[] = [];
      
      for (const keyword of keywords) {
        if (taskLower.includes(keyword)) {
          score += 10;
          matched.push(keyword);
        }
      }
      
      if (score > bestScore) {
        bestScore = score;
        bestAgent = agent as AgentName;
        matchedKeywords = matched;
      }
    }
    
    const confidence = Math.min(1, bestScore / 30);
    const reason = matchedKeywords.length > 0 
      ? `Matched keywords: ${matchedKeywords.join(', ')}`
      : 'Default assignment to Benchmarking Manager';
    
    return {
      recommendedAgent: bestAgent,
      confidence,
      reason,
    };
  }
}

let ragServiceInstance: CrossAgentRAGService | null = null;

export function getCrossAgentRAGService(): CrossAgentRAGService {
  if (!ragServiceInstance) {
    ragServiceInstance = new CrossAgentRAGService();
  }
  return ragServiceInstance;
}
