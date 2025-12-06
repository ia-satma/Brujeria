import { sql } from "drizzle-orm";
import { pgTable, text, varchar, serial, timestamp, json, integer, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const analysisReports = pgTable("analysis_reports", {
  id: serial("id").primaryKey(),
  clientUrl: text("client_url").notNull(),
  competitorUrls: json("competitor_urls").$type<string[]>().notNull(),
  reportData: json("report_data").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAnalysisReportSchema = createInsertSchema(analysisReports).omit({
  id: true,
  createdAt: true,
});

export type InsertAnalysisReport = z.infer<typeof insertAnalysisReportSchema>;
export type AnalysisReport = typeof analysisReports.$inferSelect;

export const agentKnowledgeDocuments = pgTable("agent_knowledge_documents", {
  id: serial("id").primaryKey(),
  documentId: text("document_id").notNull().unique(),
  agentName: text("agent_name").notNull(),
  documentType: text("document_type").notNull(),
  title: text("title").notNull(),
  pcloudFilePath: text("pcloud_file_path").notNull(),
  pcloudFileId: text("pcloud_file_id").notNull(),
  sourceUrl: text("source_url"),
  tags: json("tags").$type<string[]>().notNull().default([]),
  score: real("score"),
  version: integer("version").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertAgentKnowledgeDocumentSchema = createInsertSchema(agentKnowledgeDocuments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertAgentKnowledgeDocument = z.infer<typeof insertAgentKnowledgeDocumentSchema>;
export type AgentKnowledgeDocument = typeof agentKnowledgeDocuments.$inferSelect;

export const agentStates = pgTable("agent_states", {
  id: serial("id").primaryKey(),
  agentName: text("agent_name").notNull().unique(),
  totalDocuments: integer("total_documents").notNull().default(0),
  totalAnalyses: integer("total_analyses").notNull().default(0),
  totalPatterns: integer("total_patterns").notNull().default(0),
  averageScore: real("average_score"),
  lastActivityAt: timestamp("last_activity_at"),
  specializationAreas: json("specialization_areas").$type<string[]>().notNull().default([]),
  learningMetrics: json("learning_metrics").$type<{
    patternsIdentified: number;
    improvementRate: number;
    consistencyScore: number;
  }>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertAgentStateSchema = createInsertSchema(agentStates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertAgentState = z.infer<typeof insertAgentStateSchema>;
export type AgentState = typeof agentStates.$inferSelect;

export const agentLearningEvents = pgTable("agent_learning_events", {
  id: serial("id").primaryKey(),
  agentName: text("agent_name").notNull(),
  eventType: text("event_type").notNull(),
  description: text("description").notNull(),
  metadata: json("metadata").$type<Record<string, unknown>>(),
  sourceDocumentId: text("source_document_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAgentLearningEventSchema = createInsertSchema(agentLearningEvents).omit({
  id: true,
  createdAt: true,
});

export type InsertAgentLearningEvent = z.infer<typeof insertAgentLearningEventSchema>;
export type AgentLearningEvent = typeof agentLearningEvents.$inferSelect;
