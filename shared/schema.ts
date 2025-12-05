import { sql } from "drizzle-orm";
import { pgTable, text, varchar, serial, timestamp, json } from "drizzle-orm/pg-core";
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
