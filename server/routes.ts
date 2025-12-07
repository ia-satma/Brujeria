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
  getAgentResilienceStats,
  getCircuitBreakerSnapshots,
  resetAgentCircuitBreakers,
  clearAgentResilienceCache,
  type SiteAnalysis,
  type Report,
  type LogCallback,
  type CouncilResult
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
import { getOrganizationalStructureService } from "./organization/org-structure-service";

const analyzeRequestSchema = z.object({
  clientUrl: z.string().url(),
  competitorUrls: z.array(z.string().url()).min(1),
});

const extractDomainsSchema = z.object({
  portfolioUrl: z.string().url(),
});

function safeString(value: unknown): string {
  if (value === undefined || value === null) return '';
  return String(value);
}

function generateReplitInstructions(report: Report): string {
  const clientName = report.client_website_analysis.name.replace(' (Client)', '');
  const date = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
  
  let md = `# Instrucciones para Replit Agent\n`;
  md += `## Mejoras del Sitio Web: ${clientName}\n`;
  md += `**Generado:** ${date}\n`;
  md += `**Puntuación Actual:** ${report.client_website_analysis.overall_score}/10\n\n`;
  
  md += `---\n\n`;
  md += `## Contexto del Análisis\n\n`;
  md += `Este documento contiene instrucciones específicas para implementar mejoras en el sitio web del cliente basadas en un análisis comparativo con ${report.competitor_analyses.length} competidor(es).\n\n`;
  
  if (report.executive_summary) {
    const summary = report.executive_summary;
    md += `### Resumen Ejecutivo\n`;
    if (summary.overall_score !== undefined) md += `- **Puntuación General:** ${summary.overall_score}/10\n`;
    if (summary.vs_competitors) md += `- **vs Competidores:** ${summary.vs_competitors}\n`;
    if (summary.critical_issues !== undefined) md += `- **Problemas Críticos:** ${summary.critical_issues}\n`;
    if (summary.estimated_conversion_loss) md += `- **Pérdida Estimada de Conversión:** ${summary.estimated_conversion_loss}\n`;
    md += `\n`;
  }
  
  md += `---\n\n`;
  md += `## Tareas Priorizadas\n\n`;
  md += `> Copia estas tareas directamente en Replit Agent para implementarlas.\n\n`;
  
  const tasks = report.prioritized_tasks || [];
  const criticalTasks = tasks.filter(t => t.priority === 'P0-CRITICAL');
  const highTasks = tasks.filter(t => t.priority === 'P1-HIGH');
  const mediumTasks = tasks.filter(t => t.priority === 'P2-MEDIUM');
  
  const renderTask = (task: any) => {
    const title = safeString(task.title) || 'Sin título';
    const description = safeString(task.description) || 'Sin descripción';
    const impact = safeString(task.expected_impact);
    const effort = safeString(task.estimated_effort);
    const source = safeString(task.agent_source);
    
    let taskMd = `#### ${title}\n`;
    taskMd += `**Descripción:** ${description}\n`;
    if (impact) taskMd += `**Impacto Esperado:** ${impact}\n`;
    if (effort) taskMd += `**Esfuerzo Estimado:** ${effort}\n`;
    if (source) taskMd += `**Fuente:** ${source}\n`;
    taskMd += `\n**Instrucción para Replit:**\n`;
    taskMd += `\`\`\`\n${title}: ${description}\n\`\`\`\n\n`;
    return taskMd;
  };
  
  if (criticalTasks.length > 0) {
    md += `### 🔴 P0 - CRÍTICO (Implementar Primero)\n\n`;
    for (const task of criticalTasks) {
      md += renderTask(task);
    }
  }
  
  if (highTasks.length > 0) {
    md += `### 🟠 P1 - ALTA PRIORIDAD\n\n`;
    for (const task of highTasks) {
      md += renderTask(task);
    }
  }
  
  if (mediumTasks.length > 0) {
    md += `### 🟡 P2 - MEDIA PRIORIDAD\n\n`;
    for (const task of mediumTasks) {
      md += renderTask(task);
    }
  }
  
  if (report.execution_order && report.execution_order.length > 0) {
    md += `---\n\n`;
    md += `## Orden de Ejecución Recomendado\n\n`;
    report.execution_order.forEach((step, i) => {
      const safeStep = safeString(step);
      if (safeStep) md += `${i + 1}. ${safeStep}\n`;
    });
    md += `\n`;
  }
  
  if (report.completion_criteria) {
    const criteria = report.completion_criteria;
    const hasPhase0 = criteria.phase_0 && criteria.phase_0.trim();
    const hasPhase1 = criteria.phase_1 && criteria.phase_1.trim();
    const hasPhase2 = criteria.phase_2 && criteria.phase_2.trim();
    
    if (hasPhase0 || hasPhase1 || hasPhase2) {
      md += `---\n\n`;
      md += `## Criterios de Finalización\n\n`;
      if (hasPhase0) md += `### Fase 0 (Crítico)\n${criteria.phase_0}\n\n`;
      if (hasPhase1) md += `### Fase 1 (Alta Prioridad)\n${criteria.phase_1}\n\n`;
      if (hasPhase2) md += `### Fase 2 (Media Prioridad)\n${criteria.phase_2}\n\n`;
    }
  }
  
  if (report.councilResult?.chairmanVerdict) {
    md += `---\n\n`;
    md += `## Veredicto del Consejo de Análisis\n\n`;
    md += `${report.councilResult.chairmanVerdict}\n\n`;
  }
  
  md += `---\n\n`;
  md += `## Cómo Usar Este Documento\n\n`;
  md += `1. Abre Replit Agent en tu proyecto\n`;
  md += `2. Copia las instrucciones de cada tarea (bloques de código)\n`;
  md += `3. Pega directamente en el chat de Replit Agent\n`;
  md += `4. Sigue el orden de ejecución recomendado\n`;
  md += `5. Verifica cada fase con los criterios de finalización\n\n`;
  md += `*Generado por Brujer.ia - https://satma.mx*\n`;
  
  return md;
}

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
      let insights: Awaited<ReturnType<typeof generateComparativeInsights>>;
      try {
        insights = await generateComparativeInsights(clientAnalysis, competitorAnalyses, sendLog);
        sendLog(`[Benchmarking_Manager] Comparative insights generated successfully.`);
      } catch (insightsError) {
        console.error('Comparative insights failed:', insightsError);
        sendLog(`[WARNING] Comparative insights generation failed. Using fallback data.`);
        insights = {
          comparative_analysis: {
            strengths_relative: clientAnalysis.visual_design.strengths.slice(0, 2).concat(clientAnalysis.user_experience.strengths.slice(0, 2)),
            weaknesses_relative: clientAnalysis.visual_design.weaknesses.slice(0, 2).concat(clientAnalysis.user_experience.weaknesses.slice(0, 2)),
            industry_best_practices: ['Seguir estándares de accesibilidad WCAG', 'Optimizar tiempos de carga'],
            emerging_trends: ['Diseño mobile-first', 'Optimización Core Web Vitals'],
          },
          recommendations: {
            high_priority: clientAnalysis.visual_design.weaknesses.slice(0, 2),
            medium_priority: clientAnalysis.user_experience.weaknesses.slice(0, 2),
            innovative_opportunities: ['Implementar mejoras de accesibilidad', 'Optimizar experiencia móvil'],
          },
          implementation_notes: ['Revisar estructura del sitio', 'Mejorar rendimiento técnico'],
        };
      }

      sendLog(`\n[Benchmarking_Manager] Initiating LLM Council deliberation...`);
      let councilResult: CouncilResult;
      let councilFailed = false;
      try {
        councilResult = await runLLMCouncil(clientAnalysis, competitorAnalyses, sendLog);
        sendLog(`[Benchmarking_Manager] Council deliberation completed successfully.`);
      } catch (councilError) {
        console.error('Council deliberation failed:', councilError);
        sendLog(`[WARNING] Council deliberation failed. Using fallback analysis.`);
        councilFailed = true;
        const allWeaknesses = [
          ...clientAnalysis.visual_design.weaknesses.map(w => ({ area: 'Visual', issue: w })),
          ...clientAnalysis.user_experience.weaknesses.map(w => ({ area: 'UX', issue: w })),
          ...clientAnalysis.content_quality.weaknesses.map(w => ({ area: 'Content', issue: w })),
          ...clientAnalysis.technical_performance.weaknesses.map(w => ({ area: 'Technical', issue: w })),
        ].slice(0, 5);
        
        councilResult = {
          consensusScore: 0.75,
          stage1Opinions: [
            {
              persona: 'critic' as const,
              personaName: 'Visual Critic',
              analysis: `Análisis de diseño visual para ${clientAnalysis.name}`,
              findings: clientAnalysis.visual_design.weaknesses.slice(0, 3).map(w => ({
                issue: w,
                severity: 'HIGH' as const,
                impact: 'Afecta la percepción visual del sitio',
                evidence: 'Detectado en análisis automatizado',
              })),
              confidence: 0.8,
            },
            {
              persona: 'strategist' as const,
              personaName: 'UX Strategist',
              analysis: `Análisis de experiencia de usuario para ${clientAnalysis.name}`,
              findings: clientAnalysis.user_experience.weaknesses.slice(0, 3).map(w => ({
                issue: w,
                severity: 'HIGH' as const,
                impact: 'Afecta la navegación y usabilidad',
                evidence: 'Detectado en análisis automatizado',
              })),
              confidence: 0.8,
            },
            {
              persona: 'innovator' as const,
              personaName: 'Content Innovator',
              analysis: `Análisis de contenido para ${clientAnalysis.name}`,
              findings: clientAnalysis.content_quality.weaknesses.slice(0, 3).map(w => ({
                issue: w,
                severity: 'MEDIUM' as const,
                impact: 'Afecta la efectividad del contenido',
                evidence: 'Detectado en análisis automatizado',
              })),
              confidence: 0.8,
            },
          ],
          stage2Reviews: [],
          chairmanVerdict: `Análisis completado para ${clientAnalysis.name}. Se identificaron ${allWeaknesses.length} áreas de mejora principales. Se recomienda priorizar las mejoras de ${allWeaknesses[0]?.area || 'diseño'} para maximizar el impacto.`,
          dissentingOpinions: [],
          finalRanking: allWeaknesses.map((w, i) => ({
            issue: w.issue,
            priority: (i < 2 ? 'P0' : i < 4 ? 'P1' : 'P2') as 'P0' | 'P1' | 'P2',
            votes: Math.max(1, 5 - i),
            severity: i < 2 ? 'CRITICAL' : i < 4 ? 'HIGH' : 'MEDIUM',
          })),
        };
      }

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
      if (councilFailed) {
        sendLog(`[Benchmarking_Manager] Note: Used fallback analysis due to council timeout.`);
      }
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

  app.get("/api/reports/:id/json", async (req, res) => {
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
      const sanitizedReport = {
        report_title: reportData.report_title,
        report_metadata: reportData.report_metadata,
        executive_summary: reportData.executive_summary,
        client_website_analysis: reportData.client_website_analysis,
        competitor_analyses: reportData.competitor_analyses,
        comparative_analysis: reportData.comparative_analysis,
        recommendations: reportData.recommendations,
        councilResult: reportData.councilResult,
        prioritized_tasks: reportData.prioritized_tasks,
        execution_order: reportData.execution_order,
        completion_criteria: reportData.completion_criteria,
      };
      
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="report-${reportId}.json"`);
      res.json(sanitizedReport);
    } catch (error) {
      console.error("JSON export error:", error);
      res.status(500).json({ error: "Failed to export JSON" });
    }
  });

  app.get("/api/reports/:id/instructions", async (req, res) => {
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
      const instructions = generateReplitInstructions(reportData);
      
      res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="replit-instructions-${reportId}.md"`);
      res.send(instructions);
    } catch (error) {
      console.error("Instructions export error:", error);
      res.status(500).json({ error: "Failed to generate instructions" });
    }
  });

  app.post("/api/reports/download/pdf", async (req, res) => {
    try {
      const reportData = req.body as Report;
      
      if (!reportData || !reportData.report_title) {
        return res.status(400).json({ error: "Invalid report data" });
      }
      
      const doc = generateReportPDF(reportData);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="benchmarking-report.pdf"`);
      
      doc.pipe(res);
      doc.end();
    } catch (error) {
      console.error("PDF generation error:", error);
      res.status(500).json({ error: "Failed to generate PDF" });
    }
  });

  app.post("/api/reports/download/json", async (req, res) => {
    try {
      const reportData = req.body as Report;
      
      if (!reportData || !reportData.report_title) {
        return res.status(400).json({ error: "Invalid report data" });
      }
      
      const sanitizedReport = {
        report_title: reportData.report_title,
        report_metadata: reportData.report_metadata,
        executive_summary: reportData.executive_summary,
        client_website_analysis: reportData.client_website_analysis,
        competitor_analyses: reportData.competitor_analyses,
        comparative_analysis: reportData.comparative_analysis,
        recommendations: reportData.recommendations,
        councilResult: reportData.councilResult,
        prioritized_tasks: reportData.prioritized_tasks,
        execution_order: reportData.execution_order,
        completion_criteria: reportData.completion_criteria,
      };
      
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="benchmarking-report.json"`);
      res.json(sanitizedReport);
    } catch (error) {
      console.error("JSON export error:", error);
      res.status(500).json({ error: "Failed to export JSON" });
    }
  });

  app.post("/api/reports/download/instructions", async (req, res) => {
    try {
      const reportData = req.body as Report;
      
      if (!reportData || !reportData.report_title) {
        return res.status(400).json({ error: "Invalid report data" });
      }
      
      const instructions = generateReplitInstructions(reportData);
      
      res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="replit-instructions.md"`);
      res.send(instructions);
    } catch (error) {
      console.error("Instructions export error:", error);
      res.status(500).json({ error: "Failed to generate instructions" });
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
  // RESILIENCE API
  // ============================================================================

  app.get("/api/resilience/stats", async (req, res) => {
    try {
      const stats = getAgentResilienceStats();
      
      res.json({
        success: true,
        stats,
      });
    } catch (error) {
      console.error("Resilience stats error:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  app.get("/api/resilience/circuit-breakers", async (req, res) => {
    try {
      const circuitBreakers = getCircuitBreakerSnapshots();
      
      res.json({
        success: true,
        circuitBreakers,
        summary: {
          total: circuitBreakers.length,
          open: circuitBreakers.filter(cb => cb.state === 'OPEN').length,
          halfOpen: circuitBreakers.filter(cb => cb.state === 'HALF_OPEN').length,
          closed: circuitBreakers.filter(cb => cb.state === 'CLOSED').length,
        },
      });
    } catch (error) {
      console.error("Circuit breakers error:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  app.post("/api/resilience/reset-circuit-breakers", async (req, res) => {
    try {
      resetAgentCircuitBreakers();
      
      res.json({
        success: true,
        message: "All circuit breakers reset to CLOSED state",
      });
    } catch (error) {
      console.error("Reset circuit breakers error:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  app.post("/api/resilience/clear-cache", async (req, res) => {
    try {
      clearAgentResilienceCache();
      
      res.json({
        success: true,
        message: "Resilience cache cleared",
      });
    } catch (error) {
      console.error("Clear cache error:", error);
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

  // ============================================
  // ORGANIZATIONAL STRUCTURE ENDPOINTS
  // ============================================

  app.post("/api/organization/bootstrap", async (req, res) => {
    try {
      const orgService = getOrganizationalStructureService();
      const result = await orgService.bootstrapAllEmployees();
      
      res.json({
        success: true,
        message: `Estructura organizacional inicializada. ${result.successful}/${result.total} empleados digitales bootstrapeados.`,
        ...result,
      });
    } catch (error) {
      console.error("Bootstrap organization error:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido al inicializar organización",
      });
    }
  });

  app.get("/api/organization/summary", async (req, res) => {
    try {
      const orgService = getOrganizationalStructureService();
      const summary = await orgService.getOrganizationSummary();
      
      res.json({
        success: true,
        ...summary,
      });
    } catch (error) {
      console.error("Get organization summary error:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido al obtener resumen",
      });
    }
  });

  app.get("/api/organization/employees/:agentName", async (req, res) => {
    try {
      const { agentName } = req.params;
      const orgService = getOrganizationalStructureService();
      
      const profile = await orgService.getEmployeeProfile(agentName);
      
      if (!profile) {
        return res.status(404).json({
          success: false,
          error: `No se encontró perfil para el agente: ${agentName}`,
        });
      }
      
      const performance = await orgService.getPerformanceMetrics(agentName);
      const learning = await orgService.getLearningAgenda(agentName);
      
      res.json({
        success: true,
        profile,
        performance,
        learning,
      });
    } catch (error) {
      console.error("Get employee profile error:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido al obtener perfil",
      });
    }
  });

  app.get("/api/organization/employees", async (req, res) => {
    try {
      const orgService = getOrganizationalStructureService();
      const summary = await orgService.getOrganizationSummary();
      
      const { ORGANIZATIONAL_STRUCTURE } = await import("./organization/org-architecture");
      const employees = Object.entries(ORGANIZATIONAL_STRUCTURE).map(([agentName, role]) => ({
        agentName,
        roleName: role.roleName,
        roleNameEs: role.roleNameEs,
        department: role.department,
        level: role.level,
      }));
      
      res.json({
        success: true,
        totalEmployees: summary.totalEmployees,
        employees,
        byDepartment: summary.byDepartment,
        byLevel: summary.byLevel,
      });
    } catch (error) {
      console.error("List employees error:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido al listar empleados",
      });
    }
  });

  // ============================================
  // ROLE PROPOSALS ENDPOINTS
  // ============================================

  const proposeRoleSchema = z.object({
    proposedRole: z.object({
      roleName: z.string().min(1),
      roleNameEs: z.string().min(1),
      department: z.enum(["creative_direction", "experience_design", "content_strategy", "digital_engineering", "operations", "governance"]),
      level: z.enum(["executive_council", "department_director", "squad_leader", "specialist"]),
      reportsTo: z.string().min(1),
    }),
    justification: z.object({
      gapIdentified: z.string().min(1),
      evidenceOfNeed: z.array(z.string()),
      expectedContribution: z.string().min(1),
      tangibleBenefits: z.array(z.string()),
      estimatedROI: z.string().min(1),
    }),
    proposedBy: z.string().min(1),
  });

  app.post("/api/organization/proposals", async (req, res) => {
    try {
      const parsed = proposeRoleSchema.parse(req.body);
      const orgService = getOrganizationalStructureService();
      const proposal = await orgService.proposeNewRole(parsed);
      
      res.json({
        success: true,
        proposal,
      });
    } catch (error) {
      console.error("Create proposal error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ success: false, error: "Invalid request", details: error.errors });
      }
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : "Error desconocido" });
    }
  });

  app.get("/api/organization/proposals", async (req, res) => {
    try {
      const orgService = getOrganizationalStructureService();
      const proposals = await orgService.listRoleProposals();
      res.json({ success: true, proposals });
    } catch (error) {
      console.error("List proposals error:", error);
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : "Error desconocido" });
    }
  });

  app.get("/api/organization/proposals/:proposalId", async (req, res) => {
    try {
      const { proposalId } = req.params;
      const orgService = getOrganizationalStructureService();
      const proposal = await orgService.getRoleProposal(proposalId);
      
      if (!proposal) {
        return res.status(404).json({ success: false, error: `Propuesta no encontrada: ${proposalId}` });
      }
      res.json({ success: true, proposal });
    } catch (error) {
      console.error("Get proposal error:", error);
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : "Error desconocido" });
    }
  });

  const reviewCommentSchema = z.object({
    reviewerId: z.string().min(1),
    comment: z.string().min(1),
    decision: z.enum(["approve", "reject", "request_changes"]).optional(),
  });

  app.post("/api/organization/proposals/:proposalId/review", async (req, res) => {
    try {
      const { proposalId } = req.params;
      const { reviewerId, comment, decision } = reviewCommentSchema.parse(req.body);
      const orgService = getOrganizationalStructureService();
      await orgService.addReviewComment(proposalId, reviewerId, comment, decision);
      res.json({ success: true, message: "Comentario agregado" });
    } catch (error) {
      console.error("Add review comment error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ success: false, error: "Invalid request", details: error.errors });
      }
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : "Error desconocido" });
    }
  });

  const approveSchema = z.object({
    approverId: z.string().min(1),
    notes: z.string().optional(),
  });

  app.post("/api/organization/proposals/:proposalId/approve", async (req, res) => {
    try {
      const { proposalId } = req.params;
      const { approverId, notes } = approveSchema.parse(req.body);
      const orgService = getOrganizationalStructureService();
      const result = await orgService.approveRole(proposalId, approverId, notes);
      res.json({ success: true, ...result });
    } catch (error) {
      console.error("Approve proposal error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ success: false, error: "Invalid request", details: error.errors });
      }
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : "Error desconocido" });
    }
  });

  const rejectSchema = z.object({
    rejecterId: z.string().min(1),
    reason: z.string().min(1),
  });

  app.post("/api/organization/proposals/:proposalId/reject", async (req, res) => {
    try {
      const { proposalId } = req.params;
      const { rejecterId, reason } = rejectSchema.parse(req.body);
      const orgService = getOrganizationalStructureService();
      await orgService.rejectRole(proposalId, rejecterId, reason);
      res.json({ success: true, message: "Propuesta rechazada" });
    } catch (error) {
      console.error("Reject proposal error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ success: false, error: "Invalid request", details: error.errors });
      }
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : "Error desconocido" });
    }
  });

  // ============================================
  // LEARNING OBJECTIVES ENDPOINTS
  // ============================================

  const addObjectiveSchema = z.object({
    title: z.string().min(1),
    description: z.string().min(1),
    targetDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    priority: z.enum(["critical", "high", "medium", "low"]).optional(),
  });

  app.post("/api/organization/employees/:agentName/learning/objectives", async (req, res) => {
    try {
      const { agentName } = req.params;
      const objective = addObjectiveSchema.parse(req.body);
      const orgService = getOrganizationalStructureService();
      const result = await orgService.addLearningObjective(agentName, objective);
      res.json({ success: true, ...result });
    } catch (error) {
      console.error("Add learning objective error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ success: false, error: "Invalid request", details: error.errors });
      }
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : "Error desconocido" });
    }
  });

  const updateObjectiveSchema = z.object({
    progress: z.number().min(0).max(100).optional(),
    status: z.enum(["not_started", "in_progress", "completed", "deferred"]).optional(),
    evidence: z.array(z.string()).optional(),
  });

  app.patch("/api/organization/employees/:agentName/learning/objectives/:objectiveId", async (req, res) => {
    try {
      const { agentName, objectiveId } = req.params;
      const updates = updateObjectiveSchema.parse(req.body);
      const orgService = getOrganizationalStructureService();
      await orgService.updateLearningObjectiveProgress(agentName, objectiveId, updates);
      res.json({ success: true, message: "Objetivo actualizado" });
    } catch (error) {
      console.error("Update learning objective error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ success: false, error: "Invalid request", details: error.errors });
      }
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : "Error desconocido" });
    }
  });

  const completeObjectiveSchema = z.object({
    evidence: z.array(z.string()).min(1),
  });

  app.post("/api/organization/employees/:agentName/learning/objectives/:objectiveId/complete", async (req, res) => {
    try {
      const { agentName, objectiveId } = req.params;
      const { evidence } = completeObjectiveSchema.parse(req.body);
      const orgService = getOrganizationalStructureService();
      await orgService.completeLearningObjective(agentName, objectiveId, evidence);
      res.json({ success: true, message: "Objetivo completado" });
    } catch (error) {
      console.error("Complete learning objective error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ success: false, error: "Invalid request", details: error.errors });
      }
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : "Error desconocido" });
    }
  });

  const addBacklogSchema = z.object({
    topic: z.string().min(1),
    priority: z.enum(["critical", "high", "medium", "low"]),
    source: z.string().min(1),
    estimatedEffort: z.string().min(1),
    rationale: z.string().min(1),
  });

  app.post("/api/organization/employees/:agentName/learning/backlog", async (req, res) => {
    try {
      const { agentName } = req.params;
      const topic = addBacklogSchema.parse(req.body);
      const orgService = getOrganizationalStructureService();
      await orgService.addToLearningBacklog(agentName, topic);
      res.json({ success: true, message: "Tema agregado al backlog" });
    } catch (error) {
      console.error("Add to learning backlog error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ success: false, error: "Invalid request", details: error.errors });
      }
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : "Error desconocido" });
    }
  });

  const recordLearningSchema = z.object({
    topic: z.string().min(1),
    impact: z.string().min(1),
    appliedIn: z.array(z.string()),
  });

  app.post("/api/organization/employees/:agentName/learning/completed", async (req, res) => {
    try {
      const { agentName } = req.params;
      const learning = recordLearningSchema.parse(req.body);
      const orgService = getOrganizationalStructureService();
      await orgService.recordLearning(agentName, learning);
      res.json({ success: true, message: "Aprendizaje registrado" });
    } catch (error) {
      console.error("Record learning error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ success: false, error: "Invalid request", details: error.errors });
      }
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : "Error desconocido" });
    }
  });

  app.get("/api/organization/employees/:agentName/learning/progress", async (req, res) => {
    try {
      const { agentName } = req.params;
      const orgService = getOrganizationalStructureService();
      const progress = await orgService.getLearningProgress(agentName);
      res.json({ success: true, ...progress });
    } catch (error) {
      console.error("Get learning progress error:", error);
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : "Error desconocido" });
    }
  });

  const promoteBacklogSchema = z.object({
    topic: z.string().min(1),
    targetDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  });

  app.post("/api/organization/employees/:agentName/learning/backlog/promote", async (req, res) => {
    try {
      const { agentName } = req.params;
      const { topic, targetDate } = promoteBacklogSchema.parse(req.body);
      const orgService = getOrganizationalStructureService();
      const result = await orgService.promoteBacklogToObjective(agentName, topic, targetDate);
      res.json({ success: true, ...result, message: "Tema promovido a objetivo" });
    } catch (error) {
      console.error("Promote backlog to objective error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ success: false, error: "Invalid request", details: error.errors });
      }
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : "Error desconocido" });
    }
  });

  return httpServer;
}
