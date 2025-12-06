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
import { getPCloudClient, getAgentFolderPath } from "./pcloud-client";
import { 
  getAgentKnowledgeService, 
  initializeAgentKnowledge, 
  AGENT_NAMES, 
  PRIMARY_AGENTS,
  type AgentName 
} from "./agent-knowledge";
import {
  runAutonomyLearningCycle,
  getAutonomyStats,
  getAgentPerformanceReport,
} from "./autonomy-engine";

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

  app.get("/api/pcloud/test", async (req, res) => {
    try {
      const pcloud = getPCloudClient();
      const connectionInfo = await pcloud.testConnection();
      
      const testFolder = getAgentFolderPath("Visual_Aesthetics_Agent");
      const folderResult = await pcloud.ensureFolderPath(testFolder);
      
      res.json({
        success: true,
        connection: connectionInfo,
        testFolder: {
          path: testFolder,
          folderId: folderResult.folderid,
        },
      });
    } catch (error) {
      console.error("pCloud test error:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  app.get("/api/pcloud/list/:agentName?", async (req, res) => {
    try {
      const pcloud = getPCloudClient();
      const agentName = req.params.agentName;
      
      let folderPath = "/BenchmarkingCouncil";
      if (agentName) {
        folderPath = getAgentFolderPath(agentName);
      }
      
      const contents = await pcloud.listFolder(folderPath);
      
      res.json({
        success: true,
        path: folderPath,
        contents,
      });
    } catch (error) {
      console.error("pCloud list error:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  app.post("/api/knowledge/initialize", async (req, res) => {
    try {
      await initializeAgentKnowledge();
      
      res.json({
        success: true,
        message: "Agent knowledge folders initialized successfully",
        agents: Object.values(AGENT_NAMES),
      });
    } catch (error) {
      console.error("Knowledge initialization error:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  app.get("/api/knowledge/stats/:agentName", async (req, res) => {
    try {
      const agentName = req.params.agentName as AgentName;
      
      if (!Object.values(AGENT_NAMES).includes(agentName)) {
        return res.status(400).json({
          success: false,
          error: `Invalid agent name: ${agentName}`,
          validAgents: Object.values(AGENT_NAMES),
        });
      }
      
      const service = getAgentKnowledgeService();
      const stats = await service.getAgentStats(agentName);
      
      res.json({
        success: true,
        stats,
      });
    } catch (error) {
      console.error("Knowledge stats error:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  app.post("/api/knowledge/save-test", async (req, res) => {
    try {
      const service = getAgentKnowledgeService();
      
      const result = await service.saveAnalysisResult(
        AGENT_NAMES.VISUAL_AESTHETICS_AGENT,
        {
          url: "https://example.com",
          score: 7.5,
          observations: "Test analysis observation",
          strengths: ["Good color contrast", "Clean typography"],
          weaknesses: ["Outdated design patterns"],
          subagentResults: [
            {
              name: "Color_Palette_Analyzer",
              finding: "Professional color scheme with good contrast",
              score: 8,
              details: ["Primary blue (#2563eb) provides good brand recognition"],
            },
          ],
        }
      );
      
      res.json({
        success: true,
        message: "Test knowledge document saved",
        result,
      });
    } catch (error) {
      console.error("Knowledge save test error:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  app.get("/api/knowledge/documents/:agentName", async (req, res) => {
    try {
      const agentName = req.params.agentName as AgentName;
      const limit = parseInt(req.query.limit as string) || 10;
      const documentType = req.query.type as string | undefined;
      
      if (!Object.values(AGENT_NAMES).includes(agentName)) {
        return res.status(400).json({
          success: false,
          error: `Invalid agent name: ${agentName}`,
        });
      }
      
      const service = getAgentKnowledgeService();
      const documents = await service.getAgentDocuments(agentName, {
        documentType: documentType as any,
        limit,
      });
      
      res.json({
        success: true,
        agentName,
        count: documents.length,
        documents,
      });
    } catch (error) {
      console.error("Knowledge documents error:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  app.post("/api/autonomy/run-learning-cycle", async (req, res) => {
    try {
      const logs: string[] = [];
      const log = (msg: string) => {
        logs.push(msg);
        console.log(msg);
      };
      
      const insights = await runAutonomyLearningCycle(log);
      
      res.json({
        success: true,
        message: "Learning cycle completed",
        insightsCount: insights.length,
        insights,
        logs,
      });
    } catch (error) {
      console.error("Autonomy learning cycle error:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  app.get("/api/autonomy/stats", async (req, res) => {
    try {
      const stats = await getAutonomyStats();
      
      res.json({
        success: true,
        stats,
      });
    } catch (error) {
      console.error("Autonomy stats error:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  app.get("/api/autonomy/agent-performance", async (req, res) => {
    try {
      const report = await getAgentPerformanceReport();
      
      res.json({
        success: true,
        agents: report,
      });
    } catch (error) {
      console.error("Agent performance error:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // ============================================================================
  // CONFIG MANAGEMENT API
  // ============================================================================

  app.get("/api/config/stats", async (req, res) => {
    try {
      const { getAgentConfigRegistry } = await import("./config/agent-config-registry");
      const registry = getAgentConfigRegistry();
      const stats = registry.getStats();
      
      res.json({
        success: true,
        stats,
      });
    } catch (error) {
      console.error("Config stats error:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  app.post("/api/config/sync", async (req, res) => {
    try {
      const { getAgentConfigRegistry } = await import("./config/agent-config-registry");
      const registry = getAgentConfigRegistry();
      const result = await registry.syncToPCloud();
      
      res.json({
        success: true,
        synced: result.synced,
        failed: result.failed,
      });
    } catch (error) {
      console.error("Config sync error:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  app.get("/api/config/agents/:agentName", async (req, res) => {
    try {
      const { getAgentConfigRegistry } = await import("./config/agent-config-registry");
      const registry = getAgentConfigRegistry();
      const agentName = req.params.agentName as any;
      
      const config = registry.getConfig(agentName);
      if (!config) {
        return res.status(404).json({
          success: false,
          error: `Agent config not found: ${agentName}`,
        });
      }

      res.json({
        success: true,
        config,
      });
    } catch (error) {
      console.error("Get config error:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  app.post("/api/config/agents/:agentName/save", async (req, res) => {
    try {
      const { getAgentConfigRegistry } = await import("./config/agent-config-registry");
      const registry = getAgentConfigRegistry();
      const agentName = req.params.agentName as any;
      
      const result = await registry.saveConfigToPCloud(agentName);
      
      res.json({
        success: result.success,
        error: result.error,
      });
    } catch (error) {
      console.error("Save config error:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  app.get("/api/config/system-prompt/:agentName", async (req, res) => {
    try {
      const { getAgentConfigRegistry } = await import("./config/agent-config-registry");
      const registry = getAgentConfigRegistry();
      const agentName = req.params.agentName as any;
      const industry = req.query.industry as string | undefined;
      
      const systemPrompt = registry.buildSystemPrompt(agentName, industry);
      
      res.json({
        success: true,
        agentName,
        industry: industry || null,
        systemPrompt,
      });
    } catch (error) {
      console.error("Get system prompt error:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  return httpServer;
}
