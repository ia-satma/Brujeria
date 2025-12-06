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

  // ============================================================================
  // EVOLUTION SERVICE API
  // ============================================================================

  app.get("/api/evolution/stats", async (req, res) => {
    try {
      const { getEvolutionService } = await import("./evolution-service");
      const evolutionService = getEvolutionService();
      res.json(evolutionService.getAllPerformanceStats());
    } catch (error) {
      console.error("Evolution stats error:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  app.get("/api/evolution/proposals", async (req, res) => {
    try {
      const { getEvolutionService } = await import("./evolution-service");
      const evolutionService = getEvolutionService();
      res.json(evolutionService.getPendingProposals());
    } catch (error) {
      console.error("Evolution proposals error:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  app.get("/api/evolution/summary", async (req, res) => {
    try {
      const { getEvolutionService } = await import("./evolution-service");
      const evolutionService = getEvolutionService();
      res.json(evolutionService.getEvolutionSummary());
    } catch (error) {
      console.error("Evolution summary error:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  app.post("/api/evolution/save", async (req, res) => {
    try {
      const { getEvolutionService } = await import("./evolution-service");
      const evolutionService = getEvolutionService();
      const result = await evolutionService.saveToCloud();
      res.json(result);
    } catch (error) {
      console.error("Evolution save error:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  app.post("/api/evolution/load", async (req, res) => {
    try {
      const { getEvolutionService } = await import("./evolution-service");
      const evolutionService = getEvolutionService();
      const result = await evolutionService.loadFromCloud();
      res.json(result);
    } catch (error) {
      console.error("Evolution load error:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  app.post("/api/evolution/proposals/:id/status", async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      if (status !== 'approved' && status !== 'rejected') {
        return res.status(400).json({
          success: false,
          error: "Status must be 'approved' or 'rejected'",
        });
      }
      
      const { getEvolutionService } = await import("./evolution-service");
      const evolutionService = getEvolutionService();
      const success = evolutionService.updateProposalStatus(id, status);
      res.json({ success });
    } catch (error) {
      console.error("Evolution proposal status update error:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // ============================================================================
  // DYNAMIC SKILLS & SUBAGENTS API
  // ============================================================================

  app.get("/api/skills/:agentName", async (req, res) => {
    try {
      const { getSubagentFactory } = await import("./skills");
      const factory = getSubagentFactory();
      const agentName = req.params.agentName;
      
      const skills = await factory.listSkills(agentName);
      
      res.json({
        success: true,
        agentName,
        count: skills.length,
        skills: skills.map(s => ({
          id: s.id,
          name: s.name,
          version: s.version,
          domain: s.specialization.domain,
          subDomain: s.specialization.subDomain,
          expertiseLevel: s.specialization.expertiseLevel,
          usageCount: s.performanceMetrics.usageCount,
          averageScore: s.performanceMetrics.averageScore,
        })),
      });
    } catch (error) {
      console.error("List skills error:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  const createSkillSchema = z.object({
    name: z.string().min(1),
    domain: z.string().min(1),
    subDomain: z.string().min(1),
    initialKnowledge: z.object({
      theoreticalFrameworks: z.array(z.any()).optional(),
      glossary: z.array(z.any()).optional(),
      benchmarks: z.array(z.any()).optional(),
      industryStandards: z.array(z.any()).optional(),
    }).optional(),
  });

  app.post("/api/skills/:agentName", async (req, res) => {
    try {
      const { getSubagentFactory } = await import("./skills");
      const factory = getSubagentFactory();
      const agentName = req.params.agentName;
      
      const parsed = createSkillSchema.parse(req.body);
      
      const skill = await factory.createSkill(
        agentName,
        parsed.name,
        parsed.domain,
        parsed.subDomain,
        parsed.initialKnowledge
      );
      
      res.json({
        success: true,
        skill: {
          id: skill.id,
          name: skill.name,
          version: skill.version,
          domain: skill.specialization.domain,
          subDomain: skill.specialization.subDomain,
          expertiseLevel: skill.specialization.expertiseLevel,
        },
      });
    } catch (error) {
      console.error("Create skill error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: "Invalid request",
          details: error.errors,
        });
      }
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  app.get("/api/skills/:agentName/:skillId", async (req, res) => {
    try {
      const { getSubagentFactory } = await import("./skills");
      const factory = getSubagentFactory();
      const { agentName, skillId } = req.params;
      
      const skill = await factory.getSkill(agentName, skillId);
      
      if (!skill) {
        return res.status(404).json({
          success: false,
          error: `Skill ${skillId} not found for agent ${agentName}`,
        });
      }
      
      res.json({
        success: true,
        skill,
      });
    } catch (error) {
      console.error("Get skill error:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  const addLearningSchema = z.object({
    type: z.enum(['benchmark', 'case_study', 'framework', 'trend', 'glossary']),
    content: z.record(z.string(), z.unknown()),
    source: z.string(),
    confidence: z.number().min(0).max(1),
  });

  app.post("/api/skills/:agentName/:skillId/learn", async (req, res) => {
    try {
      const { getSubagentFactory } = await import("./skills");
      const factory = getSubagentFactory();
      const { agentName, skillId } = req.params;
      
      const learning = addLearningSchema.parse(req.body);
      
      const updatedSkill = await factory.addLearningToSkill(agentName, skillId, learning);
      
      if (!updatedSkill) {
        return res.status(404).json({
          success: false,
          error: `Skill ${skillId} not found for agent ${agentName}`,
        });
      }
      
      res.json({
        success: true,
        message: `Added ${learning.type} to skill ${updatedSkill.name}`,
        newVersion: updatedSkill.version,
        evolutionHistory: updatedSkill.evolutionHistory.slice(-3),
      });
    } catch (error) {
      console.error("Add learning error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: "Invalid request",
          details: error.errors,
        });
      }
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  app.get("/api/subagents/:agentName", async (req, res) => {
    try {
      const { getSubagentFactory } = await import("./skills");
      const factory = getSubagentFactory();
      const agentName = req.params.agentName;
      
      const subagents = await factory.listSubagents(agentName);
      
      res.json({
        success: true,
        agentName,
        count: subagents.length,
        subagents: subagents.map(s => ({
          id: s.id,
          name: s.name,
          purpose: s.purpose,
          skillCount: s.skills.length,
          isActive: s.metadata.isActive,
          executionCount: s.metadata.executionCount,
          averageScore: s.metadata.averageScore,
          lastExecuted: s.metadata.lastExecuted,
        })),
      });
    } catch (error) {
      console.error("List subagents error:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  const createSubagentSchema = z.object({
    name: z.string().min(1),
    purpose: z.string().min(1),
    skillIds: z.array(z.string()).min(1),
    activationConditions: z.array(z.string()).optional(),
  });

  app.post("/api/subagents/:agentName", async (req, res) => {
    try {
      const { getSubagentFactory } = await import("./skills");
      const factory = getSubagentFactory();
      const agentName = req.params.agentName;
      
      const parsed = createSubagentSchema.parse(req.body);
      
      const subagent = await factory.createDynamicSubagent(
        agentName,
        parsed.name,
        parsed.purpose,
        parsed.skillIds,
        parsed.activationConditions
      );
      
      res.json({
        success: true,
        subagent: {
          id: subagent.id,
          name: subagent.name,
          purpose: subagent.purpose,
          skillCount: subagent.skills.length,
          isActive: subagent.metadata.isActive,
        },
      });
    } catch (error) {
      console.error("Create subagent error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: "Invalid request",
          details: error.errors,
        });
      }
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  app.get("/api/subagents/:agentName/:subagentId", async (req, res) => {
    try {
      const { getSubagentFactory } = await import("./skills");
      const factory = getSubagentFactory();
      const { agentName, subagentId } = req.params;
      
      const subagent = await factory.getSubagent(agentName, subagentId);
      
      if (!subagent) {
        return res.status(404).json({
          success: false,
          error: `Subagent ${subagentId} not found for agent ${agentName}`,
        });
      }
      
      res.json({
        success: true,
        subagent,
      });
    } catch (error) {
      console.error("Get subagent error:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  const executeSubagentSchema = z.object({
    context: z.string().min(1),
    evolveSkills: z.boolean().optional().default(false),
  });

  app.post("/api/subagents/:agentName/:subagentId/execute", async (req, res) => {
    try {
      const { getSubagentFactory } = await import("./skills");
      const factory = getSubagentFactory();
      const { agentName, subagentId } = req.params;
      
      const parsed = executeSubagentSchema.parse(req.body);
      
      const logs: string[] = [];
      const log = (msg: string) => logs.push(msg);
      
      const result = await factory.executeSubagent(subagentId, agentName, parsed.context, log);
      
      // Optionally trigger skill evolution for standalone API testing.
      // During full analysis, runDynamicSubagentsForAgent handles evolution automatically.
      if (parsed.evolveSkills) {
        const subagent = await factory.getSubagent(agentName, subagentId);
        if (subagent && subagent.skills.length > 0) {
          for (const skillId of subagent.skills) {
            await factory.evolveSkillExpertise(agentName, skillId, {
              score: result.score,
              successRate: result.confidence,
            });
          }
          log(`    > [${subagent.name}] Evolved ${subagent.skills.length} skills`);
        }
      }
      
      res.json({
        success: true,
        result,
        logs,
      });
    } catch (error) {
      console.error("Execute subagent error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: "Invalid request",
          details: error.errors,
        });
      }
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  app.post("/api/skills/:agentName/:skillId/evolve", async (req, res) => {
    try {
      const { getSubagentFactory } = await import("./skills");
      const factory = getSubagentFactory();
      const { agentName, skillId } = req.params;
      
      const performanceSchema = z.object({
        score: z.number().min(0).max(10),
        successRate: z.number().min(0).max(1),
      });
      
      const performanceData = performanceSchema.parse(req.body);
      
      const updatedSkill = await factory.evolveSkillExpertise(agentName, skillId, performanceData);
      
      if (!updatedSkill) {
        return res.status(404).json({
          success: false,
          error: `Skill ${skillId} not found for agent ${agentName}`,
        });
      }
      
      res.json({
        success: true,
        skillId: updatedSkill.id,
        name: updatedSkill.name,
        expertiseLevel: updatedSkill.specialization.expertiseLevel,
        performanceMetrics: updatedSkill.performanceMetrics,
      });
    } catch (error) {
      console.error("Evolve skill error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: "Invalid request",
          details: error.errors,
        });
      }
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  app.get("/api/skills/:agentName/recommendations", async (req, res) => {
    try {
      const { getSubagentFactory } = await import("./skills");
      const factory = getSubagentFactory();
      const agentName = req.params.agentName;
      
      const analysisHistorySchema = z.array(z.object({
        domain: z.string(),
        score: z.number(),
        frequency: z.number(),
      }));
      
      const history = req.query.history 
        ? analysisHistorySchema.parse(JSON.parse(req.query.history as string))
        : [];
      
      const recommendations = await factory.generateSpecializationRecommendations(agentName, history);
      
      res.json({
        success: true,
        agentName,
        recommendations,
      });
    } catch (error) {
      console.error("Get recommendations error:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // ============================================================================
  // GOLDEN DATASET VALIDATION API
  // ============================================================================

  const runValidationSchema = z.object({
    toleranceOverride: z.number().min(0).max(5).optional(),
    initiatedBy: z.string().optional(),
  });

  app.post("/api/validation/run", async (req, res) => {
    try {
      const { runGoldenDatasetValidation } = await import("./validation/golden-dataset-service");
      
      const parsed = runValidationSchema.parse(req.body || {});
      
      const logs: string[] = [];
      const log = (msg: string) => {
        logs.push(msg);
        console.log(msg);
      };
      
      const result = await runGoldenDatasetValidation({
        toleranceOverride: parsed.toleranceOverride,
        initiatedBy: parsed.initiatedBy,
        log,
      });
      
      res.json({
        success: true,
        ...result,
        logs,
      });
    } catch (error) {
      console.error("Validation run error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: "Invalid request",
          details: error.errors,
        });
      }
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  app.get("/api/validation/runs", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const runs = await storage.getRecentValidationRuns(limit);
      
      res.json({
        success: true,
        runs,
      });
    } catch (error) {
      console.error("Get validation runs error:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  app.get("/api/validation/runs/:id", async (req, res) => {
    try {
      const { getValidationRunWithResults } = await import("./validation/golden-dataset-service");
      
      const runId = parseInt(req.params.id);
      if (isNaN(runId)) {
        return res.status(400).json({
          success: false,
          error: "Invalid run ID",
        });
      }
      
      const result = await getValidationRunWithResults(runId);
      
      if (!result) {
        return res.status(404).json({
          success: false,
          error: "Validation run not found",
        });
      }
      
      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      console.error("Get validation run error:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  app.get("/api/validation/sites", async (req, res) => {
    try {
      const enabledOnly = req.query.enabledOnly !== 'false';
      const sites = await storage.listGoldenDatasetSites(enabledOnly);
      
      res.json({
        success: true,
        sites,
      });
    } catch (error) {
      console.error("Get validation sites error:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  const upsertSiteSchema = z.object({
    url: z.string().url(),
    displayName: z.string().min(1),
    category: z.string().min(1),
    expectations: z.object({
      visual_design: z.object({ min: z.number(), max: z.number(), tolerance: z.number().optional() }),
      user_experience: z.object({ min: z.number(), max: z.number(), tolerance: z.number().optional() }),
      content_quality: z.object({ min: z.number(), max: z.number(), tolerance: z.number().optional() }),
      technical_performance: z.object({ min: z.number(), max: z.number(), tolerance: z.number().optional() }),
    }),
    enabled: z.number().min(0).max(1).optional(),
  });

  app.post("/api/validation/sites", async (req, res) => {
    try {
      const parsed = upsertSiteSchema.parse(req.body);
      const site = await storage.upsertGoldenDatasetSite(parsed);
      
      res.json({
        success: true,
        site,
      });
    } catch (error) {
      console.error("Upsert validation site error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: "Invalid request",
          details: error.errors,
        });
      }
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  app.delete("/api/validation/sites/:id", async (req, res) => {
    try {
      const siteId = parseInt(req.params.id);
      if (isNaN(siteId)) {
        return res.status(400).json({
          success: false,
          error: "Invalid site ID",
        });
      }
      
      await storage.deleteGoldenDatasetSite(siteId);
      
      res.json({
        success: true,
        message: "Site deleted",
      });
    } catch (error) {
      console.error("Delete validation site error:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  app.post("/api/validation/seed", async (req, res) => {
    try {
      const { seedGoldenDataset } = await import("./validation/golden-dataset-service");
      await seedGoldenDataset();
      
      const sites = await storage.listGoldenDatasetSites(false);
      
      res.json({
        success: true,
        message: "Golden dataset seeded successfully",
        sitesCount: sites.length,
        sites,
      });
    } catch (error) {
      console.error("Seed golden dataset error:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  return httpServer;
}
