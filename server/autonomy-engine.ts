import OpenAI from "openai";
import { storage } from "./storage";
import {
  getAgentKnowledgeService,
  AGENT_NAMES,
  PRIMARY_AGENTS,
  SUB_AGENTS,
  ALL_AGENTS,
  type AgentName,
  type KnowledgeDocument,
} from "./agent-knowledge";
import { getPCloudClient } from "./pcloud-client";
import type { AgentState, AgentKnowledgeDocument } from "@shared/schema";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY!,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

const knowledgeService = getAgentKnowledgeService();

export interface DetectedPattern {
  patternId: string;
  patternType: 'common_issue' | 'industry_trend' | 'best_practice' | 'improvement_area';
  description: string;
  evidence: string[];
  affectedAgents: AgentName[];
  confidence: number;
  frequency: number;
  applicableIndustries: string[];
  createdAt: string;
}

export interface AgentPerformanceMetrics {
  agentName: AgentName;
  totalAnalyses: number;
  averageScore: number;
  scoreVariance: number;
  consistencyScore: number;
  strongAreas: string[];
  weakAreas: string[];
  improvementRate: number;
  recentTrend: 'improving' | 'stable' | 'declining';
}

export interface SpecializationRecommendation {
  agentName: AgentName;
  currentSpecializations: string[];
  recommendedSpecializations: string[];
  reasoning: string;
  priority: 'high' | 'medium' | 'low';
}

export interface LearningInsight {
  insightId: string;
  type: 'pattern' | 'specialization' | 'performance';
  agentName: AgentName;
  insight: string;
  actionTaken: string;
  impact: string;
  timestamp: string;
}

export interface AutonomyEngineStats {
  patternsDetected: number;
  specializationsApplied: number;
  agentsOptimized: number;
  learningCycles: number;
  lastRunAt: string | null;
  overallHealthScore: number;
}

const PATTERN_DETECTION_PROMPT = `You are a pattern detection AI analyzing website analysis data.

Given the following analysis documents from various websites, identify recurring patterns, common issues, and industry-specific trends.

Analysis Data:
{ANALYSIS_DATA}

Identify patterns in these categories:
1. COMMON_ISSUES: Problems that appear across multiple websites
2. INDUSTRY_TRENDS: Patterns specific to certain industries
3. BEST_PRACTICES: Successful patterns that should be replicated
4. IMPROVEMENT_AREAS: Areas where most websites struggle

Return ONLY valid JSON array:
[
  {
    "patternType": "common_issue|industry_trend|best_practice|improvement_area",
    "description": "Clear description of the pattern",
    "evidence": ["Evidence from analysis 1", "Evidence from analysis 2"],
    "confidence": 0.85,
    "applicableIndustries": ["technology", "legal"]
  }
]`;

const SPECIALIZATION_PROMPT = `You are an AI specialization advisor for website analysis agents.

Agent: {AGENT_NAME}
Current Performance:
- Average Score: {AVG_SCORE}
- Total Analyses: {TOTAL_ANALYSES}
- Current Specializations: {CURRENT_SPECS}

Recent Analysis Patterns:
{RECENT_PATTERNS}

Learning History:
{LEARNING_HISTORY}

Based on this data, recommend specializations that would improve this agent's effectiveness.

Return ONLY valid JSON:
{
  "recommendedSpecializations": ["specialization1", "specialization2"],
  "reasoning": "Why these specializations would help",
  "priority": "high|medium|low"
}`;

export class AutonomyEngine {
  private isRunning = false;
  private lastRunAt: Date | null = null;
  private stats: AutonomyEngineStats = {
    patternsDetected: 0,
    specializationsApplied: 0,
    agentsOptimized: 0,
    learningCycles: 0,
    lastRunAt: null,
    overallHealthScore: 0,
  };

  async runLearningCycle(log?: (msg: string) => void): Promise<LearningInsight[]> {
    if (this.isRunning) {
      log?.("[AutonomyEngine] Learning cycle already in progress, skipping...");
      return [];
    }

    this.isRunning = true;
    const insights: LearningInsight[] = [];

    try {
      log?.("[AutonomyEngine] Starting learning cycle...");

      const patternInsights = await this.detectPatterns(log);
      insights.push(...patternInsights);

      const performanceInsights = await this.analyzeAgentPerformance(log);
      insights.push(...performanceInsights);

      const specializationInsights = await this.optimizeSpecializations(log);
      insights.push(...specializationInsights);

      this.stats.learningCycles++;
      this.stats.lastRunAt = new Date().toISOString();
      this.lastRunAt = new Date();

      log?.(`[AutonomyEngine] Learning cycle complete. Generated ${insights.length} insights.`);

    } catch (error) {
      log?.(`[AutonomyEngine] Error during learning cycle: ${error}`);
    } finally {
      this.isRunning = false;
    }

    return insights;
  }

  async detectPatterns(log?: (msg: string) => void): Promise<LearningInsight[]> {
    log?.("[AutonomyEngine] > [PatternDetector] Scanning knowledge base for patterns...");
    const insights: LearningInsight[] = [];

    try {
      const allDocs = await this.getAllRecentAnalyses(50);
      
      if (allDocs.length < 5) {
        log?.("[AutonomyEngine] > [PatternDetector] Insufficient data for pattern detection (need 5+ analyses)");
        return insights;
      }

      const pcloud = getPCloudClient();
      const analysisData: Array<{
        agent: string;
        title: string;
        score: number | null;
        tags: unknown;
        url: string | null;
        observations?: string;
        strengths?: string[];
        weaknesses?: string[];
        subagentFindings?: Array<{ name: string; finding: string; score: number }>;
      }> = [];

      log?.(`[AutonomyEngine] > [PatternDetector] Fetching full content for ${allDocs.length} documents...`);

      const docsToProcess = allDocs.slice(0, 20);

      await Promise.all(
        docsToProcess.map(async (doc) => {
          try {
            const fullContent = await pcloud.downloadJsonFile<{
              content?: {
                observations?: string;
                strengths?: string[];
                weaknesses?: string[];
                subagentResults?: Array<{
                  name: string;
                  finding: string;
                  score: number;
                  details?: string[];
                }>;
              };
            }>(doc.pcloudFilePath);

            const content = fullContent.content || {};
            
            analysisData.push({
              agent: doc.agentName,
              title: doc.title,
              score: doc.score,
              tags: doc.tags,
              url: doc.sourceUrl,
              observations: content.observations?.slice(0, 500),
              strengths: content.strengths?.slice(0, 5),
              weaknesses: content.weaknesses?.slice(0, 5),
              subagentFindings: content.subagentResults?.slice(0, 3).map(sr => ({
                name: sr.name,
                finding: sr.finding.slice(0, 200),
                score: sr.score,
              })),
            });
          } catch (err) {
            analysisData.push({
              agent: doc.agentName,
              title: doc.title,
              score: doc.score,
              tags: doc.tags,
              url: doc.sourceUrl,
            });
          }
        })
      );

      log?.(`[AutonomyEngine] > [PatternDetector] Loaded ${analysisData.filter(d => d.observations).length} documents with full content`);

      const prompt = PATTERN_DETECTION_PROMPT.replace(
        '{ANALYSIS_DATA}',
        JSON.stringify(analysisData, null, 2)
      );

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 2000,
      });

      const content = response.choices[0]?.message?.content || "[]";
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      
      if (jsonMatch) {
        const patterns = JSON.parse(jsonMatch[0]) as Array<{
          patternType: string;
          description: string;
          evidence: string[];
          confidence: number;
          applicableIndustries: string[];
        }>;

        for (const pattern of patterns) {
          const patternId = `pattern_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
          
          const detectedPattern: DetectedPattern = {
            patternId,
            patternType: pattern.patternType as DetectedPattern['patternType'],
            description: pattern.description,
            evidence: pattern.evidence,
            affectedAgents: this.determineAffectedAgents(pattern.patternType),
            confidence: pattern.confidence,
            frequency: this.calculatePatternFrequency(pattern, allDocs),
            applicableIndustries: pattern.applicableIndustries,
            createdAt: new Date().toISOString(),
          };

          await this.savePattern(detectedPattern, log);
          this.stats.patternsDetected++;

          insights.push({
            insightId: patternId,
            type: 'pattern',
            agentName: AGENT_NAMES.BENCHMARKING_MANAGER,
            insight: pattern.description,
            actionTaken: `Saved pattern: ${pattern.patternType}`,
            impact: `Affects ${detectedPattern.affectedAgents.length} agents`,
            timestamp: new Date().toISOString(),
          });

          log?.(`[AutonomyEngine] > [PatternDetector] Detected: ${pattern.patternType} - ${pattern.description.slice(0, 50)}...`);
        }
      }

    } catch (error) {
      log?.(`[AutonomyEngine] > [PatternDetector] Error: ${error}`);
    }

    return insights;
  }

  async analyzeAgentPerformance(log?: (msg: string) => void): Promise<LearningInsight[]> {
    log?.("[AutonomyEngine] > [PerformanceAnalyzer] Evaluating agent performance metrics...");
    const insights: LearningInsight[] = [];

    for (const agentName of PRIMARY_AGENTS) {
      try {
        const metrics = await this.calculateAgentMetrics(agentName);
        
        if (metrics.totalAnalyses < 3) {
          continue;
        }

        if (metrics.consistencyScore < 0.6) {
          const insight: LearningInsight = {
            insightId: `perf_${agentName}_${Date.now()}`,
            type: 'performance',
            agentName,
            insight: `${agentName} shows inconsistent scoring (${(metrics.consistencyScore * 100).toFixed(1)}% consistency)`,
            actionTaken: 'Flagged for review and recalibration',
            impact: `Variance of ${metrics.scoreVariance.toFixed(2)} in scores`,
            timestamp: new Date().toISOString(),
          };
          insights.push(insight);
          log?.(`[AutonomyEngine] > [PerformanceAnalyzer] ${agentName}: Inconsistent performance detected`);
        }

        if (metrics.recentTrend === 'declining') {
          const insight: LearningInsight = {
            insightId: `trend_${agentName}_${Date.now()}`,
            type: 'performance',
            agentName,
            insight: `${agentName} showing declining performance trend`,
            actionTaken: 'Scheduled for optimization review',
            impact: 'May require prompt adjustment or retraining',
            timestamp: new Date().toISOString(),
          };
          insights.push(insight);
          log?.(`[AutonomyEngine] > [PerformanceAnalyzer] ${agentName}: Declining trend detected`);
        }

        await this.updateAgentLearningMetrics(agentName, metrics);

      } catch (error) {
        log?.(`[AutonomyEngine] > [PerformanceAnalyzer] Error analyzing ${agentName}: ${error}`);
      }
    }

    return insights;
  }

  async optimizeSpecializations(log?: (msg: string) => void): Promise<LearningInsight[]> {
    log?.("[AutonomyEngine] > [SpecializationOptimizer] Analyzing specialization opportunities...");
    const insights: LearningInsight[] = [];

    for (const agentName of PRIMARY_AGENTS) {
      try {
        const recommendation = await this.generateSpecializationRecommendation(agentName, log);
        
        if (!recommendation || recommendation.priority === 'low') {
          continue;
        }

        if (recommendation.recommendedSpecializations.length > 0) {
          await this.applySpecialization(agentName, recommendation, log);
          this.stats.specializationsApplied++;
          this.stats.agentsOptimized++;

          insights.push({
            insightId: `spec_${agentName}_${Date.now()}`,
            type: 'specialization',
            agentName,
            insight: recommendation.reasoning,
            actionTaken: `Applied specializations: ${recommendation.recommendedSpecializations.join(', ')}`,
            impact: `Priority: ${recommendation.priority}`,
            timestamp: new Date().toISOString(),
          });

          log?.(`[AutonomyEngine] > [SpecializationOptimizer] ${agentName}: Applied ${recommendation.recommendedSpecializations.length} new specializations`);
        }

      } catch (error) {
        log?.(`[AutonomyEngine] > [SpecializationOptimizer] Error optimizing ${agentName}: ${error}`);
      }
    }

    return insights;
  }

  async extractPatternsFromAnalysis(
    agentName: AgentName,
    analysisResult: {
      url: string;
      score: number;
      observations: string;
      strengths: string[];
      weaknesses: string[];
    },
    log?: (msg: string) => void
  ): Promise<void> {
    log?.(`[AutonomyEngine] > [PatternExtractor] Extracting patterns from ${agentName} analysis...`);

    try {
      const domain = new URL(analysisResult.url).hostname.replace('www.', '');
      
      if (analysisResult.score >= 8) {
        await knowledgeService.saveLearnedPattern(agentName, {
          patternType: 'high_performer',
          description: `High-scoring website pattern from ${domain}`,
          examples: analysisResult.strengths,
          confidence: Math.min(analysisResult.score / 10, 0.95),
          applicableIndustries: [this.inferIndustry(domain)],
        });
        log?.(`[AutonomyEngine] > [PatternExtractor] Saved high performer pattern from ${domain}`);
      }

      if (analysisResult.weaknesses.length >= 3) {
        await knowledgeService.saveLearnedPattern(agentName, {
          patternType: 'common_weakness',
          description: `Common issues identified on ${domain}`,
          examples: analysisResult.weaknesses,
          confidence: 0.7,
          applicableIndustries: [this.inferIndustry(domain)],
        });
        log?.(`[AutonomyEngine] > [PatternExtractor] Saved weakness pattern from ${domain}`);
      }

      await storage.logAgentLearningEvent({
        agentName,
        eventType: 'pattern_extraction',
        description: `Extracted patterns from analysis of ${domain}`,
        metadata: {
          url: analysisResult.url,
          score: analysisResult.score,
          strengthsCount: analysisResult.strengths.length,
          weaknessesCount: analysisResult.weaknesses.length,
        },
      });

    } catch (error) {
      log?.(`[AutonomyEngine] > [PatternExtractor] Error: ${error}`);
    }
  }

  async getStats(): Promise<AutonomyEngineStats> {
    return {
      ...this.stats,
      overallHealthScore: await this.calculateOverallHealth(),
    };
  }

  async getAgentPerformanceReport(): Promise<AgentPerformanceMetrics[]> {
    const reports: AgentPerformanceMetrics[] = [];

    for (const agentName of PRIMARY_AGENTS) {
      try {
        const metrics = await this.calculateAgentMetrics(agentName);
        reports.push(metrics);
      } catch {
        reports.push({
          agentName,
          totalAnalyses: 0,
          averageScore: 0,
          scoreVariance: 0,
          consistencyScore: 0,
          strongAreas: [],
          weakAreas: [],
          improvementRate: 0,
          recentTrend: 'stable',
        });
      }
    }

    return reports;
  }

  private async getAllRecentAnalyses(limit: number): Promise<AgentKnowledgeDocument[]> {
    const allDocs: AgentKnowledgeDocument[] = [];

    await Promise.all(
      ALL_AGENTS.map(async (agentName) => {
        try {
          const docs = await storage.searchKnowledgeDocuments({
            agentName,
            documentType: 'analysis',
          }, Math.ceil(limit / ALL_AGENTS.length));
          allDocs.push(...docs);
        } catch {}
      })
    );

    return allDocs
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  private determineAffectedAgents(patternType: string): AgentName[] {
    const affectedMap: Record<string, AgentName[]> = {
      common_issue: PRIMARY_AGENTS,
      industry_trend: PRIMARY_AGENTS,
      best_practice: PRIMARY_AGENTS,
      improvement_area: PRIMARY_AGENTS,
    };
    return affectedMap[patternType] || [AGENT_NAMES.BENCHMARKING_MANAGER];
  }

  private calculatePatternFrequency(
    pattern: { evidence: string[] },
    allDocs: AgentKnowledgeDocument[]
  ): number {
    return Math.min(pattern.evidence.length / Math.max(allDocs.length, 1), 1);
  }

  private async savePattern(pattern: DetectedPattern, log?: (msg: string) => void): Promise<void> {
    try {
      await knowledgeService.saveKnowledge(
        AGENT_NAMES.BENCHMARKING_MANAGER,
        'pattern',
        `Pattern: ${pattern.patternType} - ${pattern.description.slice(0, 50)}`,
        pattern,
        {
          tags: [pattern.patternType, ...pattern.applicableIndustries],
          score: pattern.confidence * 10,
        }
      );
    } catch (error) {
      log?.(`[AutonomyEngine] Failed to save pattern: ${error}`);
    }
  }

  private async calculateAgentMetrics(agentName: AgentName): Promise<AgentPerformanceMetrics> {
    const state = await storage.getAgentState(agentName);
    const docs = await storage.searchKnowledgeDocuments({
      agentName,
      documentType: 'analysis',
    }, 50);

    const scores = docs.filter(d => d.score != null).map(d => d.score!);
    const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    
    const variance = scores.length > 1
      ? scores.reduce((sum, s) => sum + Math.pow(s - avgScore, 2), 0) / scores.length
      : 0;

    const consistencyScore = scores.length > 0 ? Math.max(0, 1 - (Math.sqrt(variance) / 5)) : 0;

    const recentScores = scores.slice(0, Math.min(10, scores.length));
    const olderScores = scores.slice(Math.min(10, scores.length), Math.min(20, scores.length));
    
    let recentTrend: 'improving' | 'stable' | 'declining' = 'stable';
    if (recentScores.length >= 3 && olderScores.length >= 3) {
      const recentAvg = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
      const olderAvg = olderScores.reduce((a, b) => a + b, 0) / olderScores.length;
      const diff = recentAvg - olderAvg;
      if (diff > 0.5) recentTrend = 'improving';
      else if (diff < -0.5) recentTrend = 'declining';
    }

    const strongAreas: string[] = [];
    const weakAreas: string[] = [];
    
    const tagScores = new Map<string, { total: number; count: number }>();
    for (const doc of docs) {
      const tags = doc.tags as string[];
      for (const tag of tags) {
        const existing = tagScores.get(tag) || { total: 0, count: 0 };
        existing.total += doc.score || 0;
        existing.count++;
        tagScores.set(tag, existing);
      }
    }
    
    Array.from(tagScores.entries()).forEach(([tag, data]) => {
      if (data.count >= 2) {
        const tagAvg = data.total / data.count;
        if (tagAvg >= 7.5) strongAreas.push(tag);
        else if (tagAvg <= 5) weakAreas.push(tag);
      }
    });

    return {
      agentName,
      totalAnalyses: state?.totalAnalyses || 0,
      averageScore: avgScore,
      scoreVariance: variance,
      consistencyScore,
      strongAreas: strongAreas.slice(0, 5),
      weakAreas: weakAreas.slice(0, 5),
      improvementRate: recentTrend === 'improving' ? 1 : recentTrend === 'declining' ? -1 : 0,
      recentTrend,
    };
  }

  private async updateAgentLearningMetrics(
    agentName: AgentName,
    metrics: AgentPerformanceMetrics
  ): Promise<void> {
    try {
      const state = await storage.getAgentState(agentName);
      
      await storage.upsertAgentState({
        agentName,
        totalDocuments: state?.totalDocuments || 0,
        totalAnalyses: metrics.totalAnalyses,
        totalPatterns: state?.totalPatterns || 0,
        averageScore: metrics.averageScore,
        lastActivityAt: new Date(),
        specializationAreas: state?.specializationAreas || [],
        learningMetrics: {
          patternsIdentified: state?.totalPatterns || 0,
          improvementRate: metrics.improvementRate,
          consistencyScore: metrics.consistencyScore,
        },
      });
    } catch {}
  }

  private async generateSpecializationRecommendation(
    agentName: AgentName,
    log?: (msg: string) => void
  ): Promise<SpecializationRecommendation | null> {
    try {
      const state = await storage.getAgentState(agentName);
      const metrics = await this.calculateAgentMetrics(agentName);
      const events = await storage.getAgentLearningEvents(agentName, 10);

      if (metrics.totalAnalyses < 5) {
        return null;
      }

      const prompt = SPECIALIZATION_PROMPT
        .replace('{AGENT_NAME}', agentName)
        .replace('{AVG_SCORE}', metrics.averageScore.toFixed(2))
        .replace('{TOTAL_ANALYSES}', String(metrics.totalAnalyses))
        .replace('{CURRENT_SPECS}', JSON.stringify(state?.specializationAreas || []))
        .replace('{RECENT_PATTERNS}', JSON.stringify({
          strongAreas: metrics.strongAreas,
          weakAreas: metrics.weakAreas,
          trend: metrics.recentTrend,
        }))
        .replace('{LEARNING_HISTORY}', JSON.stringify(
          events.slice(0, 5).map(e => ({ type: e.eventType, desc: e.description }))
        ));

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 500,
      });

      const content = response.choices[0]?.message?.content || "{}";
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          agentName,
          currentSpecializations: state?.specializationAreas || [],
          recommendedSpecializations: parsed.recommendedSpecializations || [],
          reasoning: parsed.reasoning || 'No reasoning provided',
          priority: parsed.priority || 'low',
        };
      }

    } catch (error) {
      log?.(`[AutonomyEngine] Error generating specialization for ${agentName}: ${error}`);
    }

    return null;
  }

  private async applySpecialization(
    agentName: AgentName,
    recommendation: SpecializationRecommendation,
    log?: (msg: string) => void
  ): Promise<void> {
    try {
      const state = await storage.getAgentState(agentName);
      const currentSpecs = new Set(state?.specializationAreas || []);
      
      for (const spec of recommendation.recommendedSpecializations) {
        currentSpecs.add(spec);
      }

      await storage.upsertAgentState({
        agentName,
        totalDocuments: state?.totalDocuments || 0,
        totalAnalyses: state?.totalAnalyses || 0,
        totalPatterns: state?.totalPatterns || 0,
        averageScore: state?.averageScore || null,
        lastActivityAt: new Date(),
        specializationAreas: Array.from(currentSpecs),
        learningMetrics: state?.learningMetrics || null,
      });

      await storage.logAgentLearningEvent({
        agentName,
        eventType: 'specialization_applied',
        description: `Applied specializations: ${recommendation.recommendedSpecializations.join(', ')}`,
        metadata: {
          newSpecs: recommendation.recommendedSpecializations,
          reasoning: recommendation.reasoning,
          priority: recommendation.priority,
        },
      });

      log?.(`[AutonomyEngine] Applied specializations to ${agentName}: ${recommendation.recommendedSpecializations.join(', ')}`);

    } catch (error) {
      log?.(`[AutonomyEngine] Failed to apply specialization: ${error}`);
    }
  }

  private async calculateOverallHealth(): Promise<number> {
    let healthScore = 50;

    try {
      const allStates = await Promise.all(
        PRIMARY_AGENTS.map(agent => storage.getAgentState(agent))
      );

      const activeAgents = allStates.filter(s => s && s.totalAnalyses > 0).length;
      healthScore += (activeAgents / PRIMARY_AGENTS.length) * 20;

      const avgConsistency = allStates
        .filter(s => s?.learningMetrics)
        .map(s => s!.learningMetrics!.consistencyScore)
        .reduce((a, b) => a + b, 0) / Math.max(activeAgents, 1);
      healthScore += avgConsistency * 15;

      if (this.stats.patternsDetected > 0) {
        healthScore += Math.min(this.stats.patternsDetected, 10);
      }

      if (this.stats.learningCycles > 0) {
        healthScore += Math.min(this.stats.learningCycles * 2, 5);
      }

    } catch {}

    return Math.min(Math.max(healthScore, 0), 100);
  }

  private inferIndustry(domain: string): string {
    const industryKeywords: Record<string, string[]> = {
      technology: ['tech', 'software', 'app', 'digital', 'cloud', 'ai', 'data'],
      legal: ['law', 'legal', 'attorney', 'lawyer', 'firm'],
      healthcare: ['health', 'medical', 'clinic', 'hospital', 'care', 'wellness'],
      finance: ['bank', 'finance', 'invest', 'insurance', 'capital'],
      retail: ['shop', 'store', 'retail', 'buy', 'commerce'],
      education: ['edu', 'school', 'university', 'academy', 'learn'],
      consulting: ['consult', 'advisory', 'strategy'],
    };

    const domainLower = domain.toLowerCase();
    
    for (const [industry, keywords] of Object.entries(industryKeywords)) {
      for (const keyword of keywords) {
        if (domainLower.includes(keyword)) {
          return industry;
        }
      }
    }

    return 'general';
  }
}

let autonomyEngineInstance: AutonomyEngine | null = null;

export function getAutonomyEngine(): AutonomyEngine {
  if (!autonomyEngineInstance) {
    autonomyEngineInstance = new AutonomyEngine();
  }
  return autonomyEngineInstance;
}

export async function runAutonomyLearningCycle(log?: (msg: string) => void): Promise<LearningInsight[]> {
  const engine = getAutonomyEngine();
  return engine.runLearningCycle(log);
}

export async function extractPatternsAfterAnalysis(
  agentName: AgentName,
  analysisResult: {
    url: string;
    score: number;
    observations: string;
    strengths: string[];
    weaknesses: string[];
  },
  log?: (msg: string) => void
): Promise<void> {
  const engine = getAutonomyEngine();
  return engine.extractPatternsFromAnalysis(agentName, analysisResult, log);
}

export async function getAutonomyStats(): Promise<AutonomyEngineStats> {
  const engine = getAutonomyEngine();
  return engine.getStats();
}

export async function getAgentPerformanceReport(): Promise<AgentPerformanceMetrics[]> {
  const engine = getAutonomyEngine();
  return engine.getAgentPerformanceReport();
}
