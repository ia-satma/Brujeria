import type { Express } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import { 
  fetchSiteContent, 
  runAllAgentsInParallel,
  calculateOverallScore, 
  generateComparativeInsights,
  type SiteAnalysis,
  type Report,
  type LogCallback
} from "./agent-engine";

const analyzeRequestSchema = z.object({
  clientUrl: z.string().url(),
  competitorUrls: z.array(z.string().url()).min(1),
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  app.post("/api/analyze", async (req, res) => {
    try {
      const { clientUrl, competitorUrls } = analyzeRequestSchema.parse(req.body);
      
      const allUrls = [clientUrl, ...competitorUrls];
      const analyses: SiteAnalysis[] = [];

      for (const url of allUrls) {
        try {
          const content = await fetchSiteContent(url);
          const analysis = await runAllAgentsInParallel(content);
          const overall_score = calculateOverallScore(analysis);
          
          const domain = new URL(url).hostname.replace('www.', '').split('.')[0];
          const name = domain.charAt(0).toUpperCase() + domain.slice(1);
          
          analyses.push({
            name: url === clientUrl ? `${name} (Client)` : name,
            url,
            ...analysis,
            overall_score,
          });
        } catch (error) {
          console.error(`Failed to analyze ${url}:`, error);
        }
      }

      if (analyses.length === 0) {
        return res.status(500).json({ error: "Failed to analyze any websites" });
      }

      const clientAnalysis = analyses[0];
      const competitorAnalyses = analyses.slice(1);
      const insights = await generateComparativeInsights(clientAnalysis, competitorAnalyses);

      const report: Report = {
        report_title: "Web Benchmarking Analysis Report",
        client_website_analysis: clientAnalysis,
        competitor_analyses: competitorAnalyses,
        ...insights,
      };

      res.json(report);
    } catch (error) {
      console.error("Analysis error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid request", details: error.errors });
      }
      res.status(500).json({ error: "Analysis failed" });
    }
  });

  app.post("/api/analyze-stream", async (req, res) => {
    try {
      const { clientUrl, competitorUrls } = analyzeRequestSchema.parse(req.body);
      
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const sendLog: LogCallback = (message: string) => {
        res.write(`data: ${JSON.stringify({ type: 'log', message })}\n\n`);
      };

      const allUrls = [clientUrl, ...competitorUrls];
      const analyses: SiteAnalysis[] = [];

      sendLog(`[Benchmarking_Manager] Initializing Distributed Agent Architecture...`);
      sendLog(`[Benchmarking_Manager] Target Scope: ${allUrls.length} domains queued.`);
      sendLog(`[Benchmarking_Manager] 4 Specialized Agents ready: VAA, UNA, CSA, TPA`);
      sendLog(`[Benchmarking_Manager] Each agent deploys 3 hyperspecialized subagents.`);

      for (const url of allUrls) {
        try {
          const domain = new URL(url).hostname.replace('www.', '').split('.')[0];
          const domainName = domain.charAt(0).toUpperCase() + domain.slice(1);
          const isClient = url === clientUrl;
          
          sendLog(`\n${'='.repeat(60)}`);
          sendLog(`[Benchmarking_Manager] Processing: ${isClient ? domainName + ' (CLIENT)' : domainName}`);
          
          // Scraping phase with real subagent logging
          const content = await fetchSiteContent(url, sendLog);
          
          sendLog(`\n[Benchmarking_Manager] Context acquired. Distributing to 4 Agents...`);
          
          // Run all 4 agents in parallel with real subagent logging
          const analysis = await runAllAgentsInParallel(content, sendLog);
          
          const overall_score = calculateOverallScore(analysis);
          
          analyses.push({
            name: isClient ? `${domainName} (Client)` : domainName,
            url,
            ...analysis,
            overall_score,
          });
          
          sendLog(`\n[Benchmarking_Manager] ${domainName} analysis complete.`);
          sendLog(`[Benchmarking_Manager] Overall Score: ${overall_score}/10`);
          sendLog(`  - Visual Design: ${analysis.visual_design.score}/10`);
          sendLog(`  - UX/Navigation: ${analysis.user_experience.score}/10`);
          sendLog(`  - Content Quality: ${analysis.content_quality.score}/10`);
          sendLog(`  - Technical Performance: ${analysis.technical_performance.score}/10`);
          
        } catch (error) {
          sendLog(`[ERROR] Failed to analyze ${url}. Skipping.`);
          console.error(`Stream analysis error for ${url}:`, error);
        }
      }

      if (analyses.length === 0) {
        sendLog(`[FATAL] No websites could be analyzed.`);
        res.write(`data: ${JSON.stringify({ type: 'error', message: 'Failed to analyze any websites' })}\n\n`);
        res.end();
        return;
      }

      sendLog(`\n${'='.repeat(60)}`);
      sendLog(`[Benchmarking_Manager] All ${analyses.length} domains analyzed.`);
      
      const clientAnalysis = analyses[0];
      const competitorAnalyses = analyses.slice(1);
      
      sendLog(`\n[Benchmarking_Manager] Client baseline: ${clientAnalysis.overall_score}/10`);
      for (const comp of competitorAnalyses) {
        const diff = comp.overall_score - clientAnalysis.overall_score;
        const diffStr = diff > 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1);
        sendLog(`[Benchmarking_Manager] vs ${comp.name}: ${comp.overall_score}/10 (${diffStr})`);
      }
      
      sendLog(`\n[Benchmarking_Manager] Generating comparative insights...`);
      const insights = await generateComparativeInsights(clientAnalysis, competitorAnalyses, sendLog);

      sendLog(`\n[Benchmarking_Manager] Strategic Analysis Complete.`);
      sendLog(`[Benchmarking_Manager] High Priority Recommendations: ${insights.recommendations?.high_priority?.length || 0}`);
      sendLog(`[Benchmarking_Manager] Medium Priority Recommendations: ${insights.recommendations?.medium_priority?.length || 0}`);
      sendLog(`[Benchmarking_Manager] Innovation Opportunities: ${insights.recommendations?.innovative_opportunities?.length || 0}`);
      
      sendLog(`\n[COMPLETE] Analysis Cycle Finished Successfully.`);

      const report: Report = {
        report_title: "Web Benchmarking Analysis Report",
        client_website_analysis: clientAnalysis,
        competitor_analyses: competitorAnalyses,
        ...insights,
      };

      res.write(`data: ${JSON.stringify({ type: 'complete', report })}\n\n`);
      res.end();
    } catch (error) {
      console.error("Stream analysis error:", error);
      res.write(`data: ${JSON.stringify({ type: 'error', message: 'Analysis failed' })}\n\n`);
      res.end();
    }
  });

  return httpServer;
}
