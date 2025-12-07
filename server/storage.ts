import { 
  type User, 
  type InsertUser, 
  users,
  type AnalysisReport, 
  type InsertAnalysisReport, 
  analysisReports,
  type AgentKnowledgeDocument,
  type InsertAgentKnowledgeDocument,
  agentKnowledgeDocuments,
  type AgentState,
  type InsertAgentState,
  agentStates,
  type AgentLearningEvent,
  type InsertAgentLearningEvent,
  agentLearningEvents,
  type GoldenDatasetSite,
  type InsertGoldenDatasetSite,
  goldenDatasetSites,
  type ValidationRun,
  type InsertValidationRun,
  validationRuns,
  type ValidationResult,
  type InsertValidationResult,
  validationResults,
} from "@shared/schema";
import { randomUUID } from "crypto";
import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  saveReport(report: InsertAnalysisReport): Promise<AnalysisReport>;
  getReport(id: number): Promise<AnalysisReport | undefined>;
  getRecentReports(limit?: number): Promise<AnalysisReport[]>;
  
  saveKnowledgeDocument(doc: InsertAgentKnowledgeDocument): Promise<AgentKnowledgeDocument>;
  getKnowledgeDocument(documentId: string): Promise<AgentKnowledgeDocument | undefined>;
  getAgentKnowledgeDocuments(agentName: string, limit?: number): Promise<AgentKnowledgeDocument[]>;
  searchKnowledgeDocuments(query: { agentName?: string; documentType?: string; tags?: string[] }, limit?: number): Promise<AgentKnowledgeDocument[]>;
  
  getAgentState(agentName: string): Promise<AgentState | undefined>;
  upsertAgentState(state: InsertAgentState): Promise<AgentState>;
  incrementAgentStats(agentName: string, docType: 'analysis' | 'pattern' | 'learning'): Promise<void>;
  
  logAgentLearningEvent(event: InsertAgentLearningEvent): Promise<AgentLearningEvent>;
  getAgentLearningEvents(agentName: string, limit?: number): Promise<AgentLearningEvent[]>;

  listGoldenDatasetSites(enabledOnly?: boolean): Promise<GoldenDatasetSite[]>;
  getGoldenDatasetSite(id: number): Promise<GoldenDatasetSite | undefined>;
  upsertGoldenDatasetSite(site: InsertGoldenDatasetSite): Promise<GoldenDatasetSite>;
  deleteGoldenDatasetSite(id: number): Promise<void>;
  
  createValidationRun(run: InsertValidationRun): Promise<ValidationRun>;
  updateValidationRun(id: number, updates: Partial<ValidationRun>): Promise<ValidationRun>;
  getValidationRun(id: number): Promise<ValidationRun | undefined>;
  getRecentValidationRuns(limit?: number): Promise<ValidationRun[]>;
  
  addValidationResult(result: InsertValidationResult): Promise<ValidationResult>;
  getValidationResults(runId: number): Promise<ValidationResult[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private reports: Map<number, AnalysisReport>;
  private knowledgeDocs: Map<string, AgentKnowledgeDocument>;
  private agentStatesMap: Map<string, AgentState>;
  private learningEvents: AgentLearningEvent[];
  private reportIdCounter: number;
  private knowledgeIdCounter: number;
  private stateIdCounter: number;
  private eventIdCounter: number;

  constructor() {
    this.users = new Map();
    this.reports = new Map();
    this.knowledgeDocs = new Map();
    this.agentStatesMap = new Map();
    this.learningEvents = [];
    this.reportIdCounter = 1;
    this.knowledgeIdCounter = 1;
    this.stateIdCounter = 1;
    this.eventIdCounter = 1;
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async saveReport(insertReport: InsertAnalysisReport): Promise<AnalysisReport> {
    const id = this.reportIdCounter++;
    const report: AnalysisReport = {
      ...insertReport,
      id,
      createdAt: new Date(),
    };
    this.reports.set(id, report);
    return report;
  }

  async getReport(id: number): Promise<AnalysisReport | undefined> {
    return this.reports.get(id);
  }

  async getRecentReports(limit: number = 10): Promise<AnalysisReport[]> {
    return Array.from(this.reports.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  async saveKnowledgeDocument(doc: InsertAgentKnowledgeDocument): Promise<AgentKnowledgeDocument> {
    const id = this.knowledgeIdCounter++;
    const now = new Date();
    const fullDoc: AgentKnowledgeDocument = {
      ...doc,
      id,
      tags: doc.tags || [],
      version: doc.version || 1,
      createdAt: now,
      updatedAt: now,
    };
    this.knowledgeDocs.set(doc.documentId, fullDoc);
    return fullDoc;
  }

  async getKnowledgeDocument(documentId: string): Promise<AgentKnowledgeDocument | undefined> {
    return this.knowledgeDocs.get(documentId);
  }

  async getAgentKnowledgeDocuments(agentName: string, limit: number = 50): Promise<AgentKnowledgeDocument[]> {
    return Array.from(this.knowledgeDocs.values())
      .filter(d => d.agentName === agentName)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  async searchKnowledgeDocuments(
    query: { agentName?: string; documentType?: string; tags?: string[] },
    limit: number = 50
  ): Promise<AgentKnowledgeDocument[]> {
    return Array.from(this.knowledgeDocs.values())
      .filter(d => {
        if (query.agentName && d.agentName !== query.agentName) return false;
        if (query.documentType && d.documentType !== query.documentType) return false;
        if (query.tags && !query.tags.some(t => d.tags.includes(t))) return false;
        return true;
      })
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  async getAgentState(agentName: string): Promise<AgentState | undefined> {
    return this.agentStatesMap.get(agentName);
  }

  async upsertAgentState(state: InsertAgentState): Promise<AgentState> {
    const existing = this.agentStatesMap.get(state.agentName);
    const now = new Date();
    if (existing) {
      const updated: AgentState = { ...existing, ...state, updatedAt: now };
      this.agentStatesMap.set(state.agentName, updated);
      return updated;
    }
    const id = this.stateIdCounter++;
    const newState: AgentState = {
      id,
      agentName: state.agentName,
      totalDocuments: state.totalDocuments ?? 0,
      totalAnalyses: state.totalAnalyses ?? 0,
      totalPatterns: state.totalPatterns ?? 0,
      averageScore: state.averageScore ?? null,
      lastActivityAt: state.lastActivityAt ?? null,
      specializationAreas: state.specializationAreas ?? [],
      learningMetrics: state.learningMetrics ?? null,
      createdAt: now,
      updatedAt: now,
    };
    this.agentStatesMap.set(state.agentName, newState);
    return newState;
  }

  async incrementAgentStats(agentName: string, docType: 'analysis' | 'pattern' | 'learning'): Promise<void> {
    const existing = await this.getAgentState(agentName);
    const now = new Date();
    if (existing) {
      const updates: Partial<AgentState> = { lastActivityAt: now, totalDocuments: existing.totalDocuments + 1 };
      if (docType === 'analysis') updates.totalAnalyses = existing.totalAnalyses + 1;
      if (docType === 'pattern') updates.totalPatterns = existing.totalPatterns + 1;
      this.agentStatesMap.set(agentName, { ...existing, ...updates, updatedAt: now });
    } else {
      await this.upsertAgentState({
        agentName,
        totalDocuments: 1,
        totalAnalyses: docType === 'analysis' ? 1 : 0,
        totalPatterns: docType === 'pattern' ? 1 : 0,
      });
    }
  }

  async logAgentLearningEvent(event: InsertAgentLearningEvent): Promise<AgentLearningEvent> {
    const id = this.eventIdCounter++;
    const fullEvent: AgentLearningEvent = { ...event, id, createdAt: new Date() };
    this.learningEvents.push(fullEvent);
    return fullEvent;
  }

  async getAgentLearningEvents(agentName: string, limit: number = 50): Promise<AgentLearningEvent[]> {
    return this.learningEvents
      .filter(e => e.agentName === agentName)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  private goldenSites: Map<number, GoldenDatasetSite> = new Map();
  private validationRunsMap: Map<number, ValidationRun> = new Map();
  private validationResultsMap: Map<number, ValidationResult[]> = new Map();
  private goldenSiteIdCounter = 1;
  private validationRunIdCounter = 1;
  private validationResultIdCounter = 1;

  async listGoldenDatasetSites(enabledOnly: boolean = true): Promise<GoldenDatasetSite[]> {
    const sites = Array.from(this.goldenSites.values());
    if (enabledOnly) {
      return sites.filter(s => s.enabled === 1);
    }
    return sites;
  }

  async getGoldenDatasetSite(id: number): Promise<GoldenDatasetSite | undefined> {
    return this.goldenSites.get(id);
  }

  async upsertGoldenDatasetSite(site: InsertGoldenDatasetSite): Promise<GoldenDatasetSite> {
    const existing = Array.from(this.goldenSites.values()).find(s => s.url === site.url);
    const now = new Date();
    if (existing) {
      const updated: GoldenDatasetSite = { ...existing, ...site, updatedAt: now };
      this.goldenSites.set(existing.id, updated);
      return updated;
    }
    const id = this.goldenSiteIdCounter++;
    const newSite: GoldenDatasetSite = {
      id,
      url: site.url,
      displayName: site.displayName,
      category: site.category,
      expectations: site.expectations,
      enabled: site.enabled ?? 1,
      createdAt: now,
      updatedAt: now,
    };
    this.goldenSites.set(id, newSite);
    return newSite;
  }

  async deleteGoldenDatasetSite(id: number): Promise<void> {
    this.goldenSites.delete(id);
  }

  async createValidationRun(run: InsertValidationRun): Promise<ValidationRun> {
    const id = this.validationRunIdCounter++;
    const now = new Date();
    const newRun: ValidationRun = {
      id,
      status: run.status ?? "running",
      totalSites: run.totalSites ?? 0,
      passedSites: run.passedSites ?? 0,
      failedSites: run.failedSites ?? 0,
      defaultTolerance: run.defaultTolerance ?? 1.0,
      initiatedBy: run.initiatedBy ?? null,
      executedAt: now,
      completedAt: run.completedAt ?? null,
    };
    this.validationRunsMap.set(id, newRun);
    return newRun;
  }

  async updateValidationRun(id: number, updates: Partial<ValidationRun>): Promise<ValidationRun> {
    const existing = this.validationRunsMap.get(id);
    if (!existing) {
      throw new Error(`Validation run ${id} not found`);
    }
    const updated = { ...existing, ...updates };
    this.validationRunsMap.set(id, updated);
    return updated;
  }

  async getValidationRun(id: number): Promise<ValidationRun | undefined> {
    return this.validationRunsMap.get(id);
  }

  async getRecentValidationRuns(limit: number = 10): Promise<ValidationRun[]> {
    return Array.from(this.validationRunsMap.values())
      .sort((a, b) => b.executedAt.getTime() - a.executedAt.getTime())
      .slice(0, limit);
  }

  async addValidationResult(result: InsertValidationResult): Promise<ValidationResult> {
    const id = this.validationResultIdCounter++;
    const now = new Date();
    const newResult: ValidationResult = {
      id,
      ...result,
      createdAt: now,
    };
    const existing = this.validationResultsMap.get(result.runId) || [];
    existing.push(newResult);
    this.validationResultsMap.set(result.runId, existing);
    return newResult;
  }

  async getValidationResults(runId: number): Promise<ValidationResult[]> {
    return this.validationResultsMap.get(runId) || [];
  }
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async saveReport(insertReport: InsertAnalysisReport): Promise<AnalysisReport> {
    const [report] = await db.insert(analysisReports).values(insertReport).returning();
    return report;
  }

  async getReport(id: number): Promise<AnalysisReport | undefined> {
    const [report] = await db.select().from(analysisReports).where(eq(analysisReports.id, id));
    return report;
  }

  async getRecentReports(limit: number = 10): Promise<AnalysisReport[]> {
    return db.select().from(analysisReports).orderBy(desc(analysisReports.createdAt)).limit(limit);
  }

  async saveKnowledgeDocument(doc: InsertAgentKnowledgeDocument): Promise<AgentKnowledgeDocument> {
    const [saved] = await db.insert(agentKnowledgeDocuments).values(doc).returning();
    return saved;
  }

  async getKnowledgeDocument(documentId: string): Promise<AgentKnowledgeDocument | undefined> {
    const [doc] = await db.select().from(agentKnowledgeDocuments)
      .where(eq(agentKnowledgeDocuments.documentId, documentId));
    return doc;
  }

  async getAgentKnowledgeDocuments(agentName: string, limit: number = 50): Promise<AgentKnowledgeDocument[]> {
    return db.select().from(agentKnowledgeDocuments)
      .where(eq(agentKnowledgeDocuments.agentName, agentName))
      .orderBy(desc(agentKnowledgeDocuments.createdAt))
      .limit(limit);
  }

  async searchKnowledgeDocuments(
    query: { agentName?: string; documentType?: string; tags?: string[] },
    limit: number = 50
  ): Promise<AgentKnowledgeDocument[]> {
    const conditions = [];
    if (query.agentName) {
      conditions.push(eq(agentKnowledgeDocuments.agentName, query.agentName));
    }
    if (query.documentType) {
      conditions.push(eq(agentKnowledgeDocuments.documentType, query.documentType));
    }
    
    const baseQuery = db.select().from(agentKnowledgeDocuments);
    const filteredQuery = conditions.length > 0 
      ? baseQuery.where(and(...conditions))
      : baseQuery;
    
    return filteredQuery.orderBy(desc(agentKnowledgeDocuments.createdAt)).limit(limit);
  }

  async getAgentState(agentName: string): Promise<AgentState | undefined> {
    const [state] = await db.select().from(agentStates)
      .where(eq(agentStates.agentName, agentName));
    return state;
  }

  async upsertAgentState(state: InsertAgentState): Promise<AgentState> {
    const existing = await this.getAgentState(state.agentName);
    
    if (existing) {
      const [updated] = await db.update(agentStates)
        .set({ ...state, updatedAt: new Date() })
        .where(eq(agentStates.agentName, state.agentName))
        .returning();
      return updated;
    }
    
    const [created] = await db.insert(agentStates).values(state).returning();
    return created;
  }

  async incrementAgentStats(agentName: string, docType: 'analysis' | 'pattern' | 'learning'): Promise<void> {
    const existing = await this.getAgentState(agentName);
    const now = new Date();
    
    if (existing) {
      const updates: Partial<AgentState> = {
        lastActivityAt: now,
        totalDocuments: existing.totalDocuments + 1,
        updatedAt: now,
      };
      if (docType === 'analysis') updates.totalAnalyses = existing.totalAnalyses + 1;
      if (docType === 'pattern') updates.totalPatterns = existing.totalPatterns + 1;
      
      await db.update(agentStates)
        .set(updates)
        .where(eq(agentStates.agentName, agentName));
    } else {
      await db.insert(agentStates).values({
        agentName,
        totalDocuments: 1,
        totalAnalyses: docType === 'analysis' ? 1 : 0,
        totalPatterns: docType === 'pattern' ? 1 : 0,
        lastActivityAt: now,
      });
    }
  }

  async logAgentLearningEvent(event: InsertAgentLearningEvent): Promise<AgentLearningEvent> {
    const [saved] = await db.insert(agentLearningEvents).values(event).returning();
    return saved;
  }

  async getAgentLearningEvents(agentName: string, limit: number = 50): Promise<AgentLearningEvent[]> {
    return db.select().from(agentLearningEvents)
      .where(eq(agentLearningEvents.agentName, agentName))
      .orderBy(desc(agentLearningEvents.createdAt))
      .limit(limit);
  }

  async listGoldenDatasetSites(enabledOnly: boolean = true): Promise<GoldenDatasetSite[]> {
    if (enabledOnly) {
      return db.select().from(goldenDatasetSites)
        .where(eq(goldenDatasetSites.enabled, 1))
        .orderBy(goldenDatasetSites.displayName);
    }
    return db.select().from(goldenDatasetSites).orderBy(goldenDatasetSites.displayName);
  }

  async getGoldenDatasetSite(id: number): Promise<GoldenDatasetSite | undefined> {
    const [site] = await db.select().from(goldenDatasetSites).where(eq(goldenDatasetSites.id, id));
    return site;
  }

  async upsertGoldenDatasetSite(site: InsertGoldenDatasetSite): Promise<GoldenDatasetSite> {
    const [existing] = await db.select().from(goldenDatasetSites)
      .where(eq(goldenDatasetSites.url, site.url));
    
    if (existing) {
      const [updated] = await db.update(goldenDatasetSites)
        .set({ ...site, updatedAt: new Date() })
        .where(eq(goldenDatasetSites.id, existing.id))
        .returning();
      return updated;
    }
    
    const [created] = await db.insert(goldenDatasetSites).values(site).returning();
    return created;
  }

  async deleteGoldenDatasetSite(id: number): Promise<void> {
    await db.delete(goldenDatasetSites).where(eq(goldenDatasetSites.id, id));
  }

  async createValidationRun(run: InsertValidationRun): Promise<ValidationRun> {
    const [created] = await db.insert(validationRuns).values(run).returning();
    return created;
  }

  async updateValidationRun(id: number, updates: Partial<ValidationRun>): Promise<ValidationRun> {
    const [updated] = await db.update(validationRuns)
      .set(updates)
      .where(eq(validationRuns.id, id))
      .returning();
    return updated;
  }

  async getValidationRun(id: number): Promise<ValidationRun | undefined> {
    const [run] = await db.select().from(validationRuns).where(eq(validationRuns.id, id));
    return run;
  }

  async getRecentValidationRuns(limit: number = 10): Promise<ValidationRun[]> {
    return db.select().from(validationRuns)
      .orderBy(desc(validationRuns.executedAt))
      .limit(limit);
  }

  async addValidationResult(result: InsertValidationResult): Promise<ValidationResult> {
    const [created] = await db.insert(validationResults).values(result).returning();
    return created;
  }

  async getValidationResults(runId: number): Promise<ValidationResult[]> {
    return db.select().from(validationResults)
      .where(eq(validationResults.runId, runId))
      .orderBy(validationResults.siteUrl, validationResults.category);
  }
}

export const storage = process.env.DATABASE_URL ? new DatabaseStorage() : new MemStorage();
