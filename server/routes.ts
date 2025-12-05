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
  type AnalysisSection 
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

      const sendLog = (message: string) => {
        res.write(`data: ${JSON.stringify({ type: 'log', message })}\n\n`);
      };

      const allUrls = [clientUrl, ...competitorUrls];
      const analyses: SiteAnalysis[] = [];

      sendLog(`[Benchmarking_Manager] Initializing Distributed Agent Architecture...`);
      sendLog(`[Benchmarking_Manager] Target Scope: ${allUrls.length} domains queued.`);
      sendLog(`[Benchmarking_Manager] 4 Specialized Agents ready: VAA, UNA, CSA, TPA`);

      for (const url of allUrls) {
        try {
          const domain = new URL(url).hostname.replace('www.', '').split('.')[0];
          const domainName = domain.charAt(0).toUpperCase() + domain.slice(1);
          const isClient = url === clientUrl;
          
          sendLog(`\n${'='.repeat(60)}`);
          sendLog(`[Scraping_Orchestrator] Targeted: ${url}`);
          sendLog(`[Scraping_Orchestrator] > [Data_Extractor] Fetching raw DOM & Assets...`);
          
          const content = await fetchSiteContent(url);
          
          sendLog(`[Scraping_Orchestrator] > [Metadata_Fetcher] Title: "${content.title}"`);
          if (content.metaDescription) {
            sendLog(`[Scraping_Orchestrator] > [Metadata_Fetcher] Meta: "${content.metaDescription.slice(0, 80)}..."`);
          }
          sendLog(`[Scraping_Orchestrator] > [Data_Extractor] Extracted ${content.text.length} chars of content`);
          
          sendLog(`\n[Benchmarking_Manager] Dispatching 4 Agents in PARALLEL...`);
          
          sendLog(`[Visual_Aesthetics_Agent] Starting analysis...`);
          sendLog(`[UX_Navigation_Agent] Starting analysis...`);
          sendLog(`[Content_Storytelling_Agent] Starting analysis...`);
          sendLog(`[Technical_Performance_Agent] Starting analysis...`);
          
          const analysis = await runAllAgentsInParallel(content);
          
          // Log VAA subagent results
          sendLog(`\n[Visual_Aesthetics_Agent] COMPLETED - Score: ${analysis.visual_design.score}/10`);
          if (analysis.visual_design.subagent_results) {
            for (const sub of analysis.visual_design.subagent_results) {
              sendLog(`  [VAA] > [${sub.name}] ${sub.finding} (${sub.score}/10)`);
            }
          }
          
          // Log UNA subagent results
          sendLog(`\n[UX_Navigation_Agent] COMPLETED - Score: ${analysis.user_experience.score}/10`);
          if (analysis.user_experience.subagent_results) {
            for (const sub of analysis.user_experience.subagent_results) {
              sendLog(`  [UNA] > [${sub.name}] ${sub.finding} (${sub.score}/10)`);
            }
          }
          
          // Log CSA subagent results
          sendLog(`\n[Content_Storytelling_Agent] COMPLETED - Score: ${analysis.content_quality.score}/10`);
          if (analysis.content_quality.subagent_results) {
            for (const sub of analysis.content_quality.subagent_results) {
              sendLog(`  [CSA] > [${sub.name}] ${sub.finding} (${sub.score}/10)`);
            }
          }
          
          // Log TPA subagent results
          sendLog(`\n[Technical_Performance_Agent] COMPLETED - Score: ${analysis.technical_performance.score}/10`);
          if (analysis.technical_performance.subagent_results) {
            for (const sub of analysis.technical_performance.subagent_results) {
              sendLog(`  [TPA] > [${sub.name}] ${sub.finding} (${sub.score}/10)`);
            }
          }
          
          const overall_score = calculateOverallScore(analysis);
          
          analyses.push({
            name: isClient ? `${domainName} (Client)` : domainName,
            url,
            ...analysis,
            overall_score,
          });
          
          sendLog(`\n[Benchmarking_Manager] ${domainName} aggregated. Overall Score: ${overall_score}/10`);
          
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
      sendLog(`[Comparative_Insights_Engine] Cross-referencing competitive data...`);
      
      const clientAnalysis = analyses[0];
      const competitorAnalyses = analyses.slice(1);
      
      sendLog(`[Comparative_Insights_Engine] Client baseline: ${clientAnalysis.overall_score}/10`);
      for (const comp of competitorAnalyses) {
        const diff = comp.overall_score - clientAnalysis.overall_score;
        const diffStr = diff > 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1);
        sendLog(`[Comparative_Insights_Engine] vs ${comp.name}: ${comp.overall_score}/10 (${diffStr})`);
      }
      
      const insights = await generateComparativeInsights(clientAnalysis, competitorAnalyses);

      sendLog(`\n[Benchmarking_Manager] Generating strategic recommendations...`);
      sendLog(`[Benchmarking_Manager] High Priority Items: ${insights.recommendations?.high_priority?.length || 0}`);
      sendLog(`[Benchmarking_Manager] Medium Priority Items: ${insights.recommendations?.medium_priority?.length || 0}`);
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
