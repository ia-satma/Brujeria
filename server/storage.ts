import { type User, type InsertUser, type AnalysisReport, type InsertAnalysisReport, analysisReports } from "@shared/schema";
import { randomUUID } from "crypto";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  saveReport(report: InsertAnalysisReport): Promise<AnalysisReport>;
  getReport(id: number): Promise<AnalysisReport | undefined>;
  getRecentReports(limit?: number): Promise<AnalysisReport[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private reports: Map<number, AnalysisReport>;
  private reportIdCounter: number;

  constructor() {
    this.users = new Map();
    this.reports = new Map();
    this.reportIdCounter = 1;
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
}

export const storage = process.env.DATABASE_URL ? new DatabaseStorage() : new MemStorage();
