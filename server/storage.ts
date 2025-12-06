import { 
  type User, 
  type InsertUser, 
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
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    return undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    return { ...insertUser, id };
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
}

export const storage = process.env.DATABASE_URL ? new DatabaseStorage() : new MemStorage();
