import PDFDocument from "pdfkit";
import type { Report, SiteAnalysis, CouncilResult, PrioritizedTask } from "./agent-engine";

const COLORS = {
  primary: "#3b82f6",
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
  text: "#1f2937",
  textLight: "#6b7280",
  background: "#f9fafb",
  border: "#e5e7eb",
};

export function generateReportPDF(report: Report): PDFKit.PDFDocument {
  const doc = new PDFDocument({
    size: "A4",
    margins: { top: 50, bottom: 50, left: 50, right: 50 },
    info: {
      Title: report.report_title,
      Author: "Web Benchmarking Agent",
      Subject: `Análisis para ${report.client_website_analysis.name}`,
    },
  });

  addCoverPage(doc, report);
  doc.addPage();

  addExecutiveSummary(doc, report);
  doc.addPage();

  addClientAnalysis(doc, report.client_website_analysis);
  doc.addPage();

  addCompetitorAnalyses(doc, report.competitor_analyses);
  doc.addPage();

  addCouncilSection(doc, report);
  doc.addPage();

  addPrioritizedTasks(doc, report);
  doc.addPage();

  addActionPlan(doc, report);

  return doc;
}

function addCoverPage(doc: PDFKit.PDFDocument, report: Report) {
  doc.rect(0, 0, doc.page.width, doc.page.height).fill("#0f172a");

  doc
    .fillColor("#ffffff")
    .fontSize(36)
    .font("Helvetica-Bold")
    .text("WEB BENCHMARKING", 50, 200, { align: "center" });

  doc.fontSize(24).font("Helvetica").text("ANÁLISIS COMPARATIVO", { align: "center" });

  doc.moveDown(2);

  doc
    .fontSize(18)
    .fillColor(COLORS.primary)
    .text(report.client_website_analysis.name.replace(" (Client)", ""), { align: "center" });

  doc.moveDown(4);

  doc
    .fontSize(12)
    .fillColor("#94a3b8")
    .text(`Generado: ${new Date().toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" })}`, { align: "center" });

  if (report.report_metadata) {
    doc.moveDown(1);
    doc.text(`Competidores analizados: ${report.report_metadata.competitors_analyzed}`, { align: "center" });
    doc.text(`Consenso del Consejo: ${report.report_metadata.council_consensus}%`, { align: "center" });
  }

  doc.moveDown(6);

  const overallScore = report.client_website_analysis.overall_score;
  doc
    .fontSize(48)
    .fillColor(getScoreColor(overallScore))
    .font("Helvetica-Bold")
    .text(`${overallScore}/10`, { align: "center" });

  doc.fontSize(14).fillColor("#94a3b8").font("Helvetica").text("PUNTUACIÓN GENERAL", { align: "center" });
}

function addExecutiveSummary(doc: PDFKit.PDFDocument, report: Report) {
  addSectionHeader(doc, "RESUMEN EJECUTIVO");

  if (report.executive_summary) {
    const summary = report.executive_summary;

    doc.moveDown(1);

    doc.fontSize(12).fillColor(COLORS.text).font("Helvetica-Bold").text("Puntuación General: ", { continued: true });
    doc.fillColor(getScoreColor(summary.overall_score)).text(`${summary.overall_score}/10`);

    doc.moveDown(0.5);
    doc.fillColor(COLORS.text).font("Helvetica-Bold").text("vs Competidores: ", { continued: true });
    doc.font("Helvetica").text(summary.vs_competitors);

    doc.moveDown(0.5);
    doc.font("Helvetica-Bold").text("Problemas Críticos: ", { continued: true });
    doc.fillColor(COLORS.danger).font("Helvetica").text(`${summary.critical_issues}`);

    doc.moveDown(0.5);
    doc.fillColor(COLORS.text).font("Helvetica-Bold").text("Pérdida Estimada de Conversión: ", { continued: true });
    doc.fillColor(COLORS.warning).font("Helvetica").text(summary.estimated_conversion_loss);
  }

  doc.moveDown(2);
  addSubsectionHeader(doc, "Fortalezas Clave");
  if (report.comparative_analysis?.strengths_relative) {
    for (const strength of report.comparative_analysis.strengths_relative) {
      addBulletPoint(doc, strength, COLORS.success);
    }
  }

  doc.moveDown(1);
  addSubsectionHeader(doc, "Brechas Críticas");
  if (report.comparative_analysis?.weaknesses_relative) {
    for (const weakness of report.comparative_analysis.weaknesses_relative) {
      addBulletPoint(doc, weakness, COLORS.danger);
    }
  }

  doc.moveDown(1);
  addSubsectionHeader(doc, "Mejores Prácticas de la Industria");
  if (report.comparative_analysis?.industry_best_practices) {
    for (const practice of report.comparative_analysis.industry_best_practices) {
      addBulletPoint(doc, practice, COLORS.primary);
    }
  }
}

function addClientAnalysis(doc: PDFKit.PDFDocument, client: SiteAnalysis) {
  addSectionHeader(doc, "ANÁLISIS DEL CLIENTE");

  doc.moveDown(1);
  doc.fontSize(14).fillColor(COLORS.primary).font("Helvetica-Bold").text(client.name.replace(" (Client)", ""));
  doc.fontSize(10).fillColor(COLORS.textLight).font("Helvetica").text(client.url);

  doc.moveDown(1);

  const areas = [
    { name: "Diseño Visual", data: client.visual_design },
    { name: "Experiencia de Usuario", data: client.user_experience },
    { name: "Calidad de Contenido", data: client.content_quality },
    { name: "Rendimiento Técnico", data: client.technical_performance },
  ];

  for (const area of areas) {
    addAnalysisArea(doc, area.name, area.data);
  }
}

function addAnalysisArea(
  doc: PDFKit.PDFDocument,
  name: string,
  data: { score: number; observations: string; strengths: string[]; weaknesses: string[]; subagent_results?: any[] }
) {
  doc.moveDown(1);

  doc.fontSize(12).fillColor(COLORS.text).font("Helvetica-Bold").text(`${name}: `, { continued: true });
  doc.fillColor(getScoreColor(data.score)).text(`${data.score}/10`);

  doc.moveDown(0.3);
  doc.fontSize(10).fillColor(COLORS.textLight).font("Helvetica").text(data.observations, { width: 495 });

  if (data.strengths.length > 0) {
    doc.moveDown(0.5);
    doc.fontSize(10).fillColor(COLORS.success).font("Helvetica-Bold").text("Fortalezas:");
    for (const s of data.strengths.slice(0, 3)) {
      doc.font("Helvetica").text(`  • ${s}`, { width: 485 });
    }
  }

  if (data.weaknesses.length > 0) {
    doc.moveDown(0.3);
    doc.fontSize(10).fillColor(COLORS.danger).font("Helvetica-Bold").text("Debilidades:");
    for (const w of data.weaknesses.slice(0, 3)) {
      doc.font("Helvetica").text(`  • ${w}`, { width: 485 });
    }
  }

  if (data.subagent_results && data.subagent_results.length > 0) {
    doc.moveDown(0.3);
    doc.fontSize(9).fillColor(COLORS.textLight).font("Helvetica-Bold").text("Análisis Detallado:");
    for (const sub of data.subagent_results) {
      doc.font("Helvetica").text(`  → ${sub.name}: ${sub.finding} (${sub.score}/10)`, { width: 485 });
    }
  }
}

function addCompetitorAnalyses(doc: PDFKit.PDFDocument, competitors: SiteAnalysis[]) {
  addSectionHeader(doc, "ANÁLISIS DE COMPETIDORES");

  for (let i = 0; i < competitors.length; i++) {
    const comp = competitors[i];

    if (i > 0) {
      doc.moveDown(2);
    }

    doc.moveDown(1);
    doc.fontSize(14).fillColor(COLORS.text).font("Helvetica-Bold").text(comp.name);
    doc.fontSize(10).fillColor(COLORS.textLight).font("Helvetica").text(comp.url);

    doc.moveDown(0.5);
    doc.fontSize(12).fillColor(COLORS.text).font("Helvetica-Bold").text("Puntuación: ", { continued: true });
    doc.fillColor(getScoreColor(comp.overall_score)).text(`${comp.overall_score}/10`);

    doc.moveDown(0.5);
    doc
      .fontSize(10)
      .fillColor(COLORS.textLight)
      .font("Helvetica")
      .text(`Visual: ${comp.visual_design.score}/10 | UX: ${comp.user_experience.score}/10 | Contenido: ${comp.content_quality.score}/10 | Técnico: ${comp.technical_performance.score}/10`);

    const allStrengths = [
      ...comp.visual_design.strengths.slice(0, 1),
      ...comp.user_experience.strengths.slice(0, 1),
      ...comp.content_quality.strengths.slice(0, 1),
    ].slice(0, 3);

    if (allStrengths.length > 0) {
      doc.moveDown(0.5);
      doc.fontSize(10).fillColor(COLORS.success).font("Helvetica-Bold").text("Fortalezas Destacadas:");
      for (const s of allStrengths) {
        doc.font("Helvetica").text(`  • ${s}`, { width: 485 });
      }
    }

    if (doc.y > 700 && i < competitors.length - 1) {
      doc.addPage();
    }
  }
}

function addCouncilSection(doc: PDFKit.PDFDocument, report: Report) {
  addSectionHeader(doc, "CONSEJO DE EXPERTOS - VEREDICTO CONSOLIDADO");

  if (!report.councilResult) {
    doc.moveDown(1);
    doc.fontSize(12).fillColor(COLORS.textLight).text("No hay datos del consejo disponibles.");
    return;
  }

  const council = report.councilResult;

  doc.moveDown(1);
  doc.fontSize(12).fillColor(COLORS.text).font("Helvetica-Bold").text("Nivel de Consenso: ", { continued: true });
  doc.fillColor(council.consensusScore >= 70 ? COLORS.success : COLORS.warning).text(`${council.consensusScore}%`);

  doc.moveDown(1.5);
  addSubsectionHeader(doc, "Veredicto del Presidente");
  doc.fontSize(11).fillColor(COLORS.text).font("Helvetica").text(council.chairmanVerdict, { width: 495 });

  if (council.stage1Opinions && council.stage1Opinions.length > 0) {
    doc.moveDown(1.5);
    addSubsectionHeader(doc, "Perspectivas de los Expertos");

    for (const opinion of council.stage1Opinions) {
      doc.moveDown(0.5);
      doc.fontSize(11).fillColor(COLORS.primary).font("Helvetica-Bold").text(`${opinion.personaName}:`);
      doc.fontSize(10).fillColor(COLORS.text).font("Helvetica").text(opinion.analysis.slice(0, 300) + (opinion.analysis.length > 300 ? "..." : ""), { width: 485 });

      if (opinion.findings && opinion.findings.length > 0) {
        const topFindings = opinion.findings.slice(0, 2);
        for (const finding of topFindings) {
          const severityColor = finding.severity === "CRITICAL" ? COLORS.danger : finding.severity === "HIGH" ? COLORS.warning : COLORS.textLight;
          doc.fontSize(9).fillColor(severityColor).text(`    [${finding.severity}] ${finding.issue}`, { width: 475 });
        }
      }

      if (doc.y > 720) {
        doc.addPage();
      }
    }
  }

  if (council.finalRanking && council.finalRanking.length > 0) {
    doc.moveDown(1.5);
    addSubsectionHeader(doc, "Problemas Priorizados por el Consejo");

    for (let i = 0; i < Math.min(council.finalRanking.length, 10); i++) {
      const issue = council.finalRanking[i];
      const priorityColor = issue.priority === "P0" ? COLORS.danger : issue.priority === "P1" ? COLORS.warning : COLORS.primary;

      doc.moveDown(0.3);
      doc.fontSize(10).fillColor(priorityColor).font("Helvetica-Bold").text(`${i + 1}. [${issue.priority}] `, { continued: true });
      doc.fillColor(COLORS.text).font("Helvetica").text(issue.issue, { width: 450 });
    }
  }

  if (council.dissentingOpinions && council.dissentingOpinions.length > 0) {
    doc.moveDown(1.5);
    addSubsectionHeader(doc, "Opiniones Disidentes");
    for (const opinion of council.dissentingOpinions) {
      addBulletPoint(doc, opinion, COLORS.warning);
    }
  }
}

function addPrioritizedTasks(doc: PDFKit.PDFDocument, report: Report) {
  addSectionHeader(doc, "PLAN DE ACCIÓN - TAREAS PRIORIZADAS");

  if (!report.prioritized_tasks || report.prioritized_tasks.length === 0) {
    doc.moveDown(1);
    doc.fontSize(12).fillColor(COLORS.textLight).text("No hay tareas priorizadas disponibles.");
    return;
  }

  const tasksByPriority = {
    "P0-CRITICAL": report.prioritized_tasks.filter((t) => t.priority === "P0-CRITICAL"),
    "P1-HIGH": report.prioritized_tasks.filter((t) => t.priority === "P1-HIGH"),
    "P2-MEDIUM": report.prioritized_tasks.filter((t) => t.priority === "P2-MEDIUM"),
  };

  for (const [priority, tasks] of Object.entries(tasksByPriority)) {
    if (tasks.length === 0) continue;

    doc.moveDown(1);
    const priorityColor = priority === "P0-CRITICAL" ? COLORS.danger : priority === "P1-HIGH" ? COLORS.warning : COLORS.primary;
    doc.fontSize(12).fillColor(priorityColor).font("Helvetica-Bold").text(`${priority} (${tasks.length} tareas)`);

    for (const task of tasks) {
      addTaskCard(doc, task);

      if (doc.y > 680) {
        doc.addPage();
      }
    }
  }
}

function addTaskCard(doc: PDFKit.PDFDocument, task: PrioritizedTask) {
  doc.moveDown(0.5);

  doc.fontSize(11).fillColor(COLORS.text).font("Helvetica-Bold").text(task.title);
  doc.fontSize(9).fillColor(COLORS.textLight).font("Helvetica").text(`Departamento: ${task.department} | Horas estimadas: ${task.estimated_hours}h`);

  doc.moveDown(0.3);
  doc.fontSize(10).fillColor(COLORS.text).font("Helvetica-Bold").text("Problema:");
  doc.font("Helvetica").text(task.problem, { width: 485 });

  doc.moveDown(0.2);
  doc.font("Helvetica-Bold").text("Solución:");
  doc.font("Helvetica").text(task.solution, { width: 485 });

  if (task.success_metrics && task.success_metrics.length > 0) {
    doc.moveDown(0.2);
    doc.font("Helvetica-Bold").text("Métricas de Éxito:");
    for (const metric of task.success_metrics.slice(0, 2)) {
      doc.font("Helvetica").text(`  • ${metric}`, { width: 475 });
    }
  }

  doc.moveDown(0.5);
  doc.strokeColor(COLORS.border).lineWidth(0.5);
  doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
}

function addActionPlan(doc: PDFKit.PDFDocument, report: Report) {
  addSectionHeader(doc, "RESUMEN EJECUTIVO DE MEJORAS");

  doc.moveDown(1);

  doc
    .fontSize(11)
    .fillColor(COLORS.text)
    .font("Helvetica")
    .text(
      "Este documento presenta un análisis completo de su sitio web comparado con sus competidores. " +
        "Las recomendaciones están basadas en evidencia recopilada por agentes especializados en diseño visual, " +
        "experiencia de usuario, calidad de contenido y rendimiento técnico.",
      { width: 495 }
    );

  if (report.recommendations) {
    doc.moveDown(1.5);
    addSubsectionHeader(doc, "Acciones de Alta Prioridad (Implementar Inmediatamente)");
    for (const rec of report.recommendations.high_priority || []) {
      addBulletPoint(doc, rec, COLORS.danger);
    }

    doc.moveDown(1);
    addSubsectionHeader(doc, "Acciones de Media Prioridad (Planificar para 30 días)");
    for (const rec of report.recommendations.medium_priority || []) {
      addBulletPoint(doc, rec, COLORS.warning);
    }

    doc.moveDown(1);
    addSubsectionHeader(doc, "Oportunidades de Innovación");
    for (const rec of report.recommendations.innovative_opportunities || []) {
      addBulletPoint(doc, rec, COLORS.primary);
    }
  }

  if (report.execution_order && report.execution_order.length > 0) {
    doc.moveDown(1.5);
    addSubsectionHeader(doc, "Orden de Ejecución Recomendado");
    for (let i = 0; i < report.execution_order.length; i++) {
      doc.moveDown(0.3);
      doc.fontSize(10).fillColor(COLORS.primary).font("Helvetica-Bold").text(`${i + 1}. `, { continued: true });
      doc.fillColor(COLORS.text).font("Helvetica").text(report.execution_order[i], { width: 475 });
    }
  }

  if (report.completion_criteria) {
    doc.moveDown(1.5);
    addSubsectionHeader(doc, "Criterios de Finalización");

    doc.moveDown(0.5);
    doc.fontSize(10).fillColor(COLORS.danger).font("Helvetica-Bold").text("Fase 0 (Crítico): ");
    doc.font("Helvetica").text(report.completion_criteria.phase_0, { width: 485 });

    doc.moveDown(0.3);
    doc.fillColor(COLORS.warning).font("Helvetica-Bold").text("Fase 1 (Alta Prioridad): ");
    doc.font("Helvetica").text(report.completion_criteria.phase_1, { width: 485 });

    doc.moveDown(0.3);
    doc.fillColor(COLORS.primary).font("Helvetica-Bold").text("Fase 2 (Media Prioridad): ");
    doc.font("Helvetica").text(report.completion_criteria.phase_2, { width: 485 });
  }

  doc.moveDown(3);
  doc.fontSize(10).fillColor(COLORS.textLight).font("Helvetica").text("---", { align: "center" });
  doc.text("Generado por Web Benchmarking Agent", { align: "center" });
  doc.text(`Fecha: ${new Date().toLocaleDateString("es-ES")}`, { align: "center" });
}

function addSectionHeader(doc: PDFKit.PDFDocument, title: string) {
  doc.fontSize(18).fillColor(COLORS.text).font("Helvetica-Bold").text(title);
  doc.moveDown(0.2);
  doc.strokeColor(COLORS.primary).lineWidth(2);
  doc.moveTo(50, doc.y).lineTo(200, doc.y).stroke();
}

function addSubsectionHeader(doc: PDFKit.PDFDocument, title: string) {
  doc.fontSize(12).fillColor(COLORS.text).font("Helvetica-Bold").text(title);
}

function addBulletPoint(doc: PDFKit.PDFDocument, text: string, color: string) {
  doc.moveDown(0.3);
  doc.fontSize(10).fillColor(color).text("• ", { continued: true });
  doc.fillColor(COLORS.text).text(text, { width: 485 });
}

function getScoreColor(score: number): string {
  if (score >= 8) return COLORS.success;
  if (score >= 6) return COLORS.warning;
  return COLORS.danger;
}
