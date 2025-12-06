import { getAgentConfigRegistry, type RegisteredAgentName } from "./config/agent-config-registry";
import { getPCloudClient } from "./pcloud-client";
import type { AnalysisSection } from "./agent-engine";
import type { MetacognitionResult } from "./metacognition-service";

const configRegistry = getAgentConfigRegistry();
const BASE_PATH = "/BenchmarkingCouncil/evolution";
const MAX_LEARNING_EVENTS = 1000;

export interface LearningEvent {
  id: string;
  agentName: RegisteredAgentName;
  timestamp: string;
  eventType: 'analysis_complete' | 'feedback_received' | 'pattern_detected' | 'calibration_update';
  details: {
    url?: string;
    score?: number;
    confidence?: number;
    patternsLearned?: string[];
    feedbackSource?: string;
    feedbackContent?: string;
  };
}

export interface EvolutionProposal {
  id: string;
  agentName: RegisteredAgentName;
  proposalType: 'prompt_enhancement' | 'scoring_calibration' | 'tool_addition' | 'methodology_update';
  description: string;
  evidence: string[];
  expectedImprovement: string;
  status: 'proposed' | 'pending_review' | 'approved' | 'rejected' | 'implemented';
  createdAt: string;
  priority: 'low' | 'medium' | 'high';
}

export interface AgentPerformanceStats {
  agentName: RegisteredAgentName;
  totalAnalyses: number;
  averageScore: number;
  averageConfidence: number;
  scoreVariance: number;
  recentTrend: 'improving' | 'stable' | 'declining';
  lastUpdated: string;
}

interface PerformanceHistory {
  scores: number[];
  confidences: number[];
}

function generateId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${timestamp}-${random}`;
}

function calculateVariance(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
  return squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
}

function determineTrend(scores: number[]): 'improving' | 'stable' | 'declining' {
  if (scores.length < 3) return 'stable';
  
  const recent = scores.slice(-10);
  if (recent.length < 3) return 'stable';
  
  const firstHalf = recent.slice(0, Math.floor(recent.length / 2));
  const secondHalf = recent.slice(Math.floor(recent.length / 2));
  
  const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
  
  const diff = secondAvg - firstAvg;
  
  if (diff > 0.5) return 'improving';
  if (diff < -0.5) return 'declining';
  return 'stable';
}

class EvolutionService {
  private learningEvents: LearningEvent[] = [];
  private proposals: EvolutionProposal[] = [];
  private performanceStats: Map<RegisteredAgentName, AgentPerformanceStats> = new Map();
  private performanceHistory: Map<RegisteredAgentName, PerformanceHistory> = new Map();
  private initialized: boolean = false;

  constructor() {
    console.log('[EvolutionService] Initialized');
  }

  recordLearningEvent(event: Omit<LearningEvent, 'id' | 'timestamp'>): void {
    try {
      const learningEvent: LearningEvent = {
        ...event,
        id: generateId(),
        timestamp: new Date().toISOString()
      };

      this.learningEvents.push(learningEvent);

      if (this.learningEvents.length > MAX_LEARNING_EVENTS) {
        this.learningEvents = this.learningEvents.slice(-MAX_LEARNING_EVENTS);
      }

      console.log(`[EvolutionService] Recorded ${event.eventType} for ${event.agentName}`);
    } catch (error) {
      console.error('[EvolutionService] Failed to record learning event:', error);
    }
  }

  generateProposal(
    agentName: RegisteredAgentName,
    analysisHistory: { score: number; confidence: number }[]
  ): EvolutionProposal | null {
    try {
      const evolutionConfig = configRegistry.getEvolutionConfig(agentName);
      
      if (!evolutionConfig.selfImprovementEnabled) {
        console.log(`[EvolutionService] Self-improvement disabled for ${agentName}`);
        return null;
      }

      if (analysisHistory.length < 5) {
        return null;
      }

      const scores = analysisHistory.map(h => h.score);
      const confidences = analysisHistory.map(h => h.confidence);
      
      const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
      const avgConfidence = confidences.reduce((a, b) => a + b, 0) / confidences.length;
      const scoreVariance = calculateVariance(scores);

      let proposal: EvolutionProposal | null = null;

      if (avgScore < 5) {
        proposal = {
          id: generateId(),
          agentName,
          proposalType: 'scoring_calibration',
          description: `Average score (${avgScore.toFixed(2)}) is consistently below 5. Consider recalibrating scoring criteria to better reflect true website quality.`,
          evidence: [
            `Average score over ${analysisHistory.length} analyses: ${avgScore.toFixed(2)}`,
            `Score range: ${Math.min(...scores).toFixed(2)} - ${Math.max(...scores).toFixed(2)}`,
            `Most recent 5 scores: ${scores.slice(-5).map(s => s.toFixed(2)).join(', ')}`
          ],
          expectedImprovement: 'More accurate and balanced scoring that reflects actual website quality',
          status: 'proposed',
          createdAt: new Date().toISOString(),
          priority: avgScore < 3 ? 'high' : 'medium'
        };
      } else if (avgConfidence < 0.6) {
        proposal = {
          id: generateId(),
          agentName,
          proposalType: 'methodology_update',
          description: `Average confidence (${avgConfidence.toFixed(2)}) is consistently below 0.6. Consider updating analysis methodology to improve certainty.`,
          evidence: [
            `Average confidence over ${analysisHistory.length} analyses: ${avgConfidence.toFixed(2)}`,
            `Confidence range: ${Math.min(...confidences).toFixed(2)} - ${Math.max(...confidences).toFixed(2)}`,
            `Most recent 5 confidence scores: ${confidences.slice(-5).map(c => c.toFixed(2)).join(', ')}`
          ],
          expectedImprovement: 'Higher analysis confidence through improved data gathering and pattern recognition',
          status: 'proposed',
          createdAt: new Date().toISOString(),
          priority: avgConfidence < 0.4 ? 'high' : 'medium'
        };
      } else if (scoreVariance > 4) {
        proposal = {
          id: generateId(),
          agentName,
          proposalType: 'prompt_enhancement',
          description: `High score variance (${scoreVariance.toFixed(2)}) detected. Consider enhancing prompts for more consistent analysis.`,
          evidence: [
            `Score variance: ${scoreVariance.toFixed(2)}`,
            `Score standard deviation: ${Math.sqrt(scoreVariance).toFixed(2)}`,
            `This indicates inconsistent evaluation criteria application`
          ],
          expectedImprovement: 'More consistent scoring through clearer evaluation criteria in prompts',
          status: 'proposed',
          createdAt: new Date().toISOString(),
          priority: scoreVariance > 6 ? 'high' : 'low'
        };
      }

      if (proposal) {
        const existingSimilar = this.proposals.find(
          p => p.agentName === agentName && 
               p.proposalType === proposal!.proposalType &&
               p.status === 'proposed'
        );

        if (!existingSimilar) {
          this.proposals.push(proposal);
          console.log(`[EvolutionService] Generated ${proposal.proposalType} proposal for ${agentName}`);
          
          this.recordLearningEvent({
            agentName,
            eventType: 'pattern_detected',
            details: {
              patternsLearned: [proposal.proposalType]
            }
          });
        } else {
          return null;
        }
      }

      return proposal;
    } catch (error) {
      console.error('[EvolutionService] Failed to generate proposal:', error);
      return null;
    }
  }

  updatePerformanceStats(
    agentName: RegisteredAgentName,
    analysisResult: AnalysisSection,
    metacognition: MetacognitionResult
  ): void {
    try {
      let history = this.performanceHistory.get(agentName);
      if (!history) {
        history = { scores: [], confidences: [] };
        this.performanceHistory.set(agentName, history);
      }

      history.scores.push(analysisResult.score);
      history.confidences.push(metacognition.confidence.overallConfidence);

      if (history.scores.length > 100) {
        history.scores = history.scores.slice(-100);
        history.confidences = history.confidences.slice(-100);
      }

      const avgScore = history.scores.reduce((a, b) => a + b, 0) / history.scores.length;
      const avgConfidence = history.confidences.reduce((a, b) => a + b, 0) / history.confidences.length;
      const scoreVariance = calculateVariance(history.scores);
      const trend = determineTrend(history.scores);

      const stats: AgentPerformanceStats = {
        agentName,
        totalAnalyses: history.scores.length,
        averageScore: Math.round(avgScore * 100) / 100,
        averageConfidence: Math.round(avgConfidence * 100) / 100,
        scoreVariance: Math.round(scoreVariance * 100) / 100,
        recentTrend: trend,
        lastUpdated: new Date().toISOString()
      };

      this.performanceStats.set(agentName, stats);

      console.log(`[EvolutionService] Updated stats for ${agentName}: score=${avgScore.toFixed(2)}, confidence=${avgConfidence.toFixed(2)}, trend=${trend}`);

      if (history.scores.length >= 10 && history.scores.length % 10 === 0) {
        this.generateProposal(
          agentName,
          history.scores.map((s, i) => ({ score: s, confidence: history!.confidences[i] }))
        );
      }
    } catch (error) {
      console.error('[EvolutionService] Failed to update performance stats:', error);
    }
  }

  getPerformanceStats(agentName: RegisteredAgentName): AgentPerformanceStats | null {
    return this.performanceStats.get(agentName) || null;
  }

  getAllPerformanceStats(): Record<string, AgentPerformanceStats | null> {
    const allAgents: RegisteredAgentName[] = [
      "Visual_Aesthetics_Agent",
      "UX_Navigation_Agent",
      "Content_Storytelling_Agent",
      "Technical_Performance_Agent"
    ];

    const result: Record<string, AgentPerformanceStats | null> = {};
    for (const agent of allAgents) {
      result[agent] = this.getPerformanceStats(agent);
    }
    return result;
  }

  getLearningEvents(agentName?: RegisteredAgentName, limit: number = 100): LearningEvent[] {
    let events = this.learningEvents;
    
    if (agentName) {
      events = events.filter(e => e.agentName === agentName);
    }
    
    return events.slice(-limit);
  }

  getPendingProposals(): EvolutionProposal[] {
    return this.proposals.filter(p => p.status === 'proposed' || p.status === 'pending_review');
  }

  getAllProposals(): EvolutionProposal[] {
    return [...this.proposals];
  }

  updateProposalStatus(proposalId: string, newStatus: 'approved' | 'rejected'): boolean {
    const proposal = this.proposals.find(p => p.id === proposalId);
    
    if (!proposal) {
      console.warn(`[EvolutionService] Proposal not found: ${proposalId}`);
      return false;
    }

    proposal.status = newStatus;
    console.log(`[EvolutionService] Updated proposal ${proposalId} status to ${newStatus}`);

    this.recordLearningEvent({
      agentName: proposal.agentName,
      eventType: 'calibration_update',
      details: {
        feedbackSource: 'proposal_review',
        feedbackContent: `Proposal ${proposalId} ${newStatus}: ${proposal.description}`
      }
    });

    return true;
  }

  async saveToCloud(): Promise<{ success: boolean; error?: string }> {
    try {
      const pcloud = getPCloudClient();

      const learningEventsData = {
        savedAt: new Date().toISOString(),
        totalEvents: this.learningEvents.length,
        events: this.learningEvents
      };
      await pcloud.uploadJsonFile(BASE_PATH, 'learning_events.json', learningEventsData);
      console.log(`[EvolutionService] Saved ${this.learningEvents.length} learning events to pCloud`);

      const proposalsData = {
        savedAt: new Date().toISOString(),
        totalProposals: this.proposals.length,
        proposals: this.proposals
      };
      await pcloud.uploadJsonFile(BASE_PATH, 'proposals.json', proposalsData);
      console.log(`[EvolutionService] Saved ${this.proposals.length} proposals to pCloud`);

      const statsData = {
        savedAt: new Date().toISOString(),
        stats: Object.fromEntries(this.performanceStats),
        history: Object.fromEntries(this.performanceHistory)
      };
      await pcloud.uploadJsonFile(BASE_PATH, 'performance_stats.json', statsData);
      console.log(`[EvolutionService] Saved performance stats for ${this.performanceStats.size} agents to pCloud`);

      return { success: true };
    } catch (error: any) {
      console.error('[EvolutionService] Failed to save to pCloud:', error);
      return { success: false, error: error.message };
    }
  }

  async loadFromCloud(): Promise<{ success: boolean; error?: string }> {
    try {
      const pcloud = getPCloudClient();

      try {
        const eventsContent = await pcloud.downloadTextFile(`${BASE_PATH}/learning_events.json`);
        const eventsData = JSON.parse(eventsContent);
        this.learningEvents = eventsData.events || [];
        console.log(`[EvolutionService] Loaded ${this.learningEvents.length} learning events from pCloud`);
      } catch (error) {
        console.log('[EvolutionService] No existing learning events in pCloud');
      }

      try {
        const proposalsContent = await pcloud.downloadTextFile(`${BASE_PATH}/proposals.json`);
        const proposalsData = JSON.parse(proposalsContent);
        this.proposals = proposalsData.proposals || [];
        console.log(`[EvolutionService] Loaded ${this.proposals.length} proposals from pCloud`);
      } catch (error) {
        console.log('[EvolutionService] No existing proposals in pCloud');
      }

      try {
        const statsContent = await pcloud.downloadTextFile(`${BASE_PATH}/performance_stats.json`);
        const statsData = JSON.parse(statsContent);
        
        this.performanceStats = new Map(Object.entries(statsData.stats || {})) as Map<RegisteredAgentName, AgentPerformanceStats>;
        this.performanceHistory = new Map(Object.entries(statsData.history || {})) as Map<RegisteredAgentName, PerformanceHistory>;
        
        console.log(`[EvolutionService] Loaded performance stats for ${this.performanceStats.size} agents from pCloud`);
      } catch (error) {
        console.log('[EvolutionService] No existing performance stats in pCloud');
      }

      this.initialized = true;
      return { success: true };
    } catch (error: any) {
      console.error('[EvolutionService] Failed to load from pCloud:', error);
      return { success: false, error: error.message };
    }
  }

  getEvolutionSummary(): {
    totalEvents: number;
    totalProposals: number;
    pendingProposals: number;
    agentsTracked: number;
    initialized: boolean;
  } {
    return {
      totalEvents: this.learningEvents.length,
      totalProposals: this.proposals.length,
      pendingProposals: this.getPendingProposals().length,
      agentsTracked: this.performanceStats.size,
      initialized: this.initialized
    };
  }
}

let evolutionServiceInstance: EvolutionService | null = null;

export function getEvolutionService(): EvolutionService {
  if (!evolutionServiceInstance) {
    evolutionServiceInstance = new EvolutionService();
  }
  return evolutionServiceInstance;
}

export const evolutionService = getEvolutionService();
