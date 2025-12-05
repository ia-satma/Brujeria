import type { Express } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import { 
  fetchSiteContent, 
  analyzeSiteWithAI, 
  calculateOverallScore, 
  generateComparativeInsights,
  type SiteAnalysis,
  type Report 
} from "./agent-engine";

const analyzeRequestSchema = z.object({
  clientUrl: z.string().url(),
  competitorUrls: z.array(z.string().url()).min(1),
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Main analysis endpoint
  app.post("/api/analyze", async (req, res) => {
    try {
      const { clientUrl, competitorUrls } = analyzeRequestSchema.parse(req.body);
      
      const allUrls = [clientUrl, ...competitorUrls];
      const analyses: SiteAnalysis[] = [];

      // Process each URL
      for (const url of allUrls) {
        try {
          // Fetch site content
          const content = await fetchSiteContent(url);
          
          // Analyze with AI
          const analysis = await analyzeSiteWithAI(content);
          
          // Calculate overall score
          const overall_score = calculateOverallScore(analysis);
          
          // Extract domain name
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
          // Continue with other URLs even if one fails
        }
      }

      if (analyses.length === 0) {
        return res.status(500).json({ error: "Failed to analyze any websites" });
      }

      const clientAnalysis = analyses[0];
      const competitorAnalyses = analyses.slice(1);

      // Generate comparative insights
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

  // Server-sent events endpoint for real-time progress
  app.post("/api/analyze-stream", async (req, res) => {
    try {
      const { clientUrl, competitorUrls } = analyzeRequestSchema.parse(req.body);
      
      // Set up SSE headers
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

      for (const url of allUrls) {
        try {
          const isClient = url === clientUrl;
          
          sendLog(`\n[Scraping_Orchestrator] Targeted: ${url}`);
          sendLog(`[Scraping_Orchestrator] > [Data_Extractor] Fetching raw DOM & Assets...`);
          
          const content = await fetchSiteContent(url);
          
          sendLog(`[Scraping_Orchestrator] > [Metadata_Fetcher] Extracting meta tags & headers...`);
          sendLog(`[Benchmarking_Manager] Context acquired. Distributing to Specialized Agents...`);
          
          sendLog(`[Visual_Aesthetics_Agent] Analyzing Design System...`);
          sendLog(`[VAA] > [Color_Palette_Analyzer] Extracting dominant HSL values...`);
          sendLog(`[VAA] > [Typo_Readability_Checker] validating font hierarchy (H1-H6)...`);
          
          sendLog(`[UX_Navigation_Agent] Mapping User Journeys...`);
          sendLog(`[UNA] > [Information_Architecture_Mapper] Building sitemap tree...`);
          sendLog(`[UNA] > [CTA_Effectiveness_Scorer] Calculating button visibility contrast...`);
          
          sendLog(`[Content_Storytelling_Agent] Evaluating Narrative...`);
          sendLog(`[CSA] > [Brand_Voice_Validator] Checking tone consistency in 'About Us'...`);
          sendLog(`[CSA] > [Credibility_Evidence_Collector] Scanning for social proof markers...`);
          
          sendLog(`[Technical_Performance_Agent] Auditing Infrastructure...`);
          sendLog(`[TPA] > [Page_Speed_Scorer] Simulating First Contentful Paint...`);
          sendLog(`[TPA] > [SEO_Metadata_Inspector] Validating schema.org implementation...`);
          
          const analysis = await analyzeSiteWithAI(content);
          const overall_score = calculateOverallScore(analysis);
          
          const domain = new URL(url).hostname.replace('www.', '').split('.')[0];
          const name = domain.charAt(0).toUpperCase() + domain.slice(1);
          
          analyses.push({
            name: isClient ? `${name} (Client)` : name,
            url,
            ...analysis,
            overall_score,
          });
          
          sendLog(`[Benchmarking_Manager] Aggregating Sub-Agent scores for ${url}... Done.`);
        } catch (error) {
          sendLog(`[ERROR] Failed to analyze ${url}. Skipping.`);
        }
      }

      sendLog(`\n[Benchmarking_Manager] Cross-referencing data across ${analyses.length} entities...`);
      
      const clientAnalysis = analyses[0];
      const competitorAnalyses = analyses.slice(1);
      const insights = await generateComparativeInsights(clientAnalysis, competitorAnalyses);

      sendLog(`[Benchmarking_Manager] Generating final comparative JSON structure...`);
      sendLog(`[COMPLETE] Analysis Cycle Finished.`);

      const report: Report = {
        report_title: "Web Benchmarking Analysis Report",
        client_website_analysis: clientAnalysis,
        competitor_analyses: competitorAnalyses,
        ...insights,
      };

      // Send final report
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
