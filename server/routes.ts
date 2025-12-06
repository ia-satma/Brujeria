import type { Express } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import { 
  fetchSiteContent, 
  runAllAgentsInParallel,
  calculateOverallScore, 
  generateComparativeInsights,
  runLLMCouncil,
  generateReportMetadata,
  generateExecutiveSummary,
  generatePrioritizedTasks,
  generateCompletionCriteria,
  extractExternalDomains,
  type SiteAnalysis,
  type Report,
  type LogCallback
} from "./agent-engine";
import { storage } from "./storage";
import { generateReportPDF } from "./pdf-generator";

const analyzeRequestSchema = z.object({
  clientUrl: z.string().url(),
  competitorUrls: z.array(z.string().url()).min(1),
});

const extractDomainsSchema = z.object({
  portfolioUrl: z.string().url(),
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

      const councilResult = await runLLMCouncil(clientAnalysis, competitorAnalyses);

      const competitorScores = competitorAnalyses.map(c => c.overall_score);
      const reportMetadata = generateReportMetadata(
        clientUrl,
        competitorAnalyses.length,
        councilResult.consensusScore
      );
      const executiveSummary = generateExecutiveSummary(
        clientAnalysis.overall_score,
        competitorScores,
        councilResult
      );
      const { tasks: prioritizedTasks, executionOrder } = generatePrioritizedTasks(councilResult);
      const completionCriteria = generateCompletionCriteria();

      const report: Report = {
        report_title: "Web Benchmarking Analysis Report",
        report_metadata: reportMetadata,
        executive_summary: executiveSummary,
        client_website_analysis: clientAnalysis,
        competitor_analyses: competitorAnalyses,
        ...insights,
        councilResult,
        prioritized_tasks: prioritizedTasks,
        execution_order: executionOrder,
        completion_criteria: completionCriteria,
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
    let keepaliveInterval: NodeJS.Timeout | null = null;
    let connectionClosed = false;
    
    // Track when connection actually closes (for cleanup only, not for aborting)
    req.on('close', () => {
      connectionClosed = true;
      if (keepaliveInterval) {
        clearInterval(keepaliveInterval);
      }
      console.log('[SSE] Connection close event received');
    });
    
    // Helper to safely write to response
    const safeWrite = (data: string): boolean => {
      try {
        if (res.writableEnded) {
          return false;
        }
        res.write(data);
        return true;
      } catch (error) {
        console.log('[SSE] Write failed:', error);
        return false;
      }
    };
    
    try {
      const { clientUrl, competitorUrls } = analyzeRequestSchema.parse(req.body);
      
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');
      res.flushHeaders();

      keepaliveInterval = setInterval(() => {
        safeWrite(`: keepalive\n\n`);
      }, 10000);

      const sendLog: LogCallback = (message: string) => {
        const data = `data: ${JSON.stringify({ type: 'log', message })}\n\n`;
        safeWrite(data);
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
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          sendLog(`[ERROR] Failed to analyze ${url}: ${errorMsg}. Skipping.`);
          console.error(`Stream analysis error for ${url}:`, error);
        }
      }

      if (analyses.length === 0) {
        sendLog(`[FATAL] No websites could be analyzed.`);
        if (keepaliveInterval) {
          clearInterval(keepaliveInterval);
        }
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

      sendLog(`\n[Benchmarking_Manager] Initiating LLM Council deliberation...`);
      const councilResult = await runLLMCouncil(clientAnalysis, competitorAnalyses, sendLog);

      const competitorScores = competitorAnalyses.map(c => c.overall_score);
      const reportMetadata = generateReportMetadata(
        clientUrl,
        competitorAnalyses.length,
        councilResult.consensusScore
      );
      const executiveSummary = generateExecutiveSummary(
        clientAnalysis.overall_score,
        competitorScores,
        councilResult
      );
      const { tasks: prioritizedTasks, executionOrder } = generatePrioritizedTasks(councilResult);
      const completionCriteria = generateCompletionCriteria();

      sendLog(`\n[Benchmarking_Manager] Strategic Analysis Complete.`);
      sendLog(`[Benchmarking_Manager] Council Consensus: ${(councilResult.consensusScore * 100).toFixed(0)}%`);
      sendLog(`[Benchmarking_Manager] High Priority Recommendations: ${insights.recommendations?.high_priority?.length || 0}`);
      sendLog(`[Benchmarking_Manager] Medium Priority Recommendations: ${insights.recommendations?.medium_priority?.length || 0}`);
      sendLog(`[Benchmarking_Manager] Innovation Opportunities: ${insights.recommendations?.innovative_opportunities?.length || 0}`);
      
      sendLog(`\n[Benchmarking_Manager] Generated ${prioritizedTasks.length} prioritized tasks`);
      sendLog(`[Benchmarking_Manager] P0-CRITICAL: ${prioritizedTasks.filter(t => t.priority === 'P0-CRITICAL').length}`);
      sendLog(`[Benchmarking_Manager] P1-HIGH: ${prioritizedTasks.filter(t => t.priority === 'P1-HIGH').length}`);
      sendLog(`[Benchmarking_Manager] P2-MEDIUM: ${prioritizedTasks.filter(t => t.priority === 'P2-MEDIUM').length}`);
      
      sendLog(`\n[COMPLETE] Analysis Cycle Finished Successfully.`);

      const report: Report = {
        report_title: "Web Benchmarking Analysis Report",
        report_metadata: reportMetadata,
        executive_summary: executiveSummary,
        client_website_analysis: clientAnalysis,
        competitor_analyses: competitorAnalyses,
        ...insights,
        councilResult,
        prioritized_tasks: prioritizedTasks,
        execution_order: executionOrder,
        completion_criteria: completionCriteria,
      };

      const serializedReport = JSON.parse(JSON.stringify(report));

      let savedReportId: number | null = null;
      try {
        const savedReport = await storage.saveReport({
          clientUrl,
          competitorUrls,
          reportData: serializedReport,
        });
        savedReportId = savedReport.id;
        sendLog(`\n[Benchmarking_Manager] Report saved with ID: ${savedReportId}`);
      } catch (saveError) {
        console.error("Failed to save report:", saveError);
        sendLog(`\n[WARNING] Report could not be saved to database. PDF download will not be available.`);
      }

      if (keepaliveInterval) {
        clearInterval(keepaliveInterval);
      }
      
      res.write(`data: ${JSON.stringify({ type: 'complete', report: serializedReport, reportId: savedReportId })}\n\n`);
      res.end();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : '';
      console.error("Stream analysis error:", errorMessage);
      console.error("Error stack:", errorStack);
      
      if (keepaliveInterval) {
        clearInterval(keepaliveInterval);
      }
      
      safeWrite(`data: ${JSON.stringify({ type: 'error', message: `Analysis failed: ${errorMessage}` })}\n\n`);
      if (!res.writableEnded) {
        res.end();
      }
    }
  });

  app.post("/api/extract-domains", async (req, res) => {
    try {
      const { portfolioUrl } = extractDomainsSchema.parse(req.body);
      
      const result = await extractExternalDomains(portfolioUrl);
      
      res.json(result);
    } catch (error) {
      console.error("Extract domains error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid request", details: error.errors });
      }
      res.status(500).json({ error: "Failed to extract domains" });
    }
  });

  app.get("/api/reports/:id/pdf", async (req, res) => {
    try {
      const reportId = parseInt(req.params.id);
      
      if (isNaN(reportId)) {
        return res.status(400).json({ error: "Invalid report ID" });
      }
      
      const savedReport = await storage.getReport(reportId);
      
      if (!savedReport) {
        return res.status(404).json({ error: "Report not found" });
      }
      
      const reportData = savedReport.reportData as Report;
      const doc = generateReportPDF(reportData);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="benchmarking-report-${reportId}.pdf"`);
      
      doc.pipe(res);
      doc.end();
    } catch (error) {
      console.error("PDF generation error:", error);
      res.status(500).json({ error: "Failed to generate PDF" });
    }
  });

  return httpServer;
}
