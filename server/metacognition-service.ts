import { getAgentConfigRegistry, type RegisteredAgentName } from "./config/agent-config-registry";
import type { AnalysisSection, SubAgentResult } from "./agent-engine";

const configRegistry = getAgentConfigRegistry();

export interface ConfidenceAssessment {
  overallConfidence: number;
  factorScores: {
    factor: string;
    score: number;
    weight: number;
    contribution: number;
  }[];
  uncertaintyFlags: string[];
  reliabilityLevel: 'high' | 'medium' | 'low';
}

export interface BiasCheckResult {
  biasesDetected: {
    type: string;
    severity: 'low' | 'medium' | 'high';
    mitigationApplied: string;
  }[];
  selfCheckPassed: boolean;
  adjustmentsMade: string[];
}

export interface MetacognitionResult {
  confidence: ConfidenceAssessment;
  biasCheck: BiasCheckResult;
  limitations: string[];
  qualityScore: number;
}

function calculateDataQualityScore(
  htmlLength: number,
  pagesScraped: number,
  hasMetadata: boolean
): number {
  let baseScore = 0.5;
  
  if (htmlLength > 5000) {
    baseScore = 0.9;
  } else if (htmlLength > 2000) {
    baseScore = 0.7;
  }
  
  const pagesBonus = Math.min(pagesScraped * 0.05, 0.2);
  const metadataBonus = hasMetadata ? 0.1 : 0;
  
  return Math.min(baseScore + pagesBonus + metadataBonus, 1.0);
}

function calculatePatternRecognitionScore(subagentResults: SubAgentResult[]): number {
  if (subagentResults.length < 2) {
    return 0.5;
  }
  
  const scores = subagentResults.map(r => r.score);
  const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
  const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
  const stdDev = Math.sqrt(variance);
  
  if (stdDev <= 0.5) return 0.95;
  if (stdDev <= 1.0) return 0.85;
  if (stdDev <= 1.5) return 0.75;
  if (stdDev <= 2.0) return 0.65;
  return 0.5;
}

function calculateConsistencyScore(subagentResults: SubAgentResult[]): number {
  if (subagentResults.length < 2) {
    return 0.7;
  }
  
  const scores = subagentResults.map(r => r.score);
  const maxScore = Math.max(...scores);
  const minScore = Math.min(...scores);
  const range = maxScore - minScore;
  
  if (range <= 2) return 0.9;
  if (range <= 3) return 0.75;
  return 0.6;
}

export function assessConfidence(
  agentName: RegisteredAgentName,
  subagentResults: SubAgentResult[],
  dataQualityIndicators: {
    htmlLength: number;
    pagesScraped: number;
    hasMetadata: boolean;
  }
): ConfidenceAssessment {
  const metacognitionConfig = configRegistry.getMetacognitionConfig(agentName);
  const factors = metacognitionConfig.confidenceAssessment.factors;
  
  const factorCalculators: Record<string, () => number> = {
    data_quality: () => calculateDataQualityScore(
      dataQualityIndicators.htmlLength,
      dataQualityIndicators.pagesScraped,
      dataQualityIndicators.hasMetadata
    ),
    pattern_recognition: () => calculatePatternRecognitionScore(subagentResults),
    prior_knowledge_match: () => 0.7,
    subagent_agreement: () => calculateConsistencyScore(subagentResults),
    consistency_check: () => calculateConsistencyScore(subagentResults),
  };
  
  const factorScores: ConfidenceAssessment['factorScores'] = [];
  const uncertaintyFlags: string[] = [];
  let totalWeight = 0;
  let weightedSum = 0;
  
  for (const factor of factors) {
    const calculator = factorCalculators[factor.factor];
    const score = calculator ? calculator() : 0.5;
    const weight = factor.weight;
    const contribution = score * weight;
    
    factorScores.push({
      factor: factor.factor,
      score,
      weight,
      contribution
    });
    
    totalWeight += weight;
    weightedSum += contribution;
    
    if (score < 0.5) {
      uncertaintyFlags.push(`${factor.factor}_low`);
    }
  }
  
  const overallConfidence = totalWeight > 0 ? weightedSum / totalWeight : 0.5;
  
  const configUncertaintyFlags = metacognitionConfig.confidenceAssessment.uncertaintyFlags || [];
  
  if (dataQualityIndicators.htmlLength < 1000) {
    const flag = configUncertaintyFlags.find(f => f.includes('insufficient'));
    if (flag) uncertaintyFlags.push(flag);
  }
  
  if (dataQualityIndicators.pagesScraped <= 1) {
    const flag = configUncertaintyFlags.find(f => f.includes('single_page'));
    if (flag) uncertaintyFlags.push(flag);
  }
  
  let reliabilityLevel: 'high' | 'medium' | 'low';
  if (overallConfidence >= 0.8) {
    reliabilityLevel = 'high';
  } else if (overallConfidence >= 0.6) {
    reliabilityLevel = 'medium';
  } else {
    reliabilityLevel = 'low';
  }
  
  return {
    overallConfidence,
    factorScores,
    uncertaintyFlags,
    reliabilityLevel
  };
}

function detectRecencyBias(analysisResult: AnalysisSection): boolean {
  const observations = analysisResult.observations.toLowerCase();
  const modernTerms = ['modern', 'trending', 'latest', '2024', '2025', 'contemporary', 'current'];
  const classicTerms = ['timeless', 'established', 'proven', 'classic', 'traditional'];
  
  const modernCount = modernTerms.filter(term => observations.includes(term)).length;
  const classicCount = classicTerms.filter(term => observations.includes(term)).length;
  
  return modernCount >= 3 && classicCount === 0;
}

function detectConfirmationBias(analysisResult: AnalysisSection): boolean {
  const strengthCount = analysisResult.strengths.length;
  const weaknessCount = analysisResult.weaknesses.length;
  
  if (strengthCount > 0 && weaknessCount === 0) return true;
  if (weaknessCount > 0 && strengthCount === 0) return true;
  
  const ratio = Math.max(strengthCount, weaknessCount) / Math.max(Math.min(strengthCount, weaknessCount), 1);
  return ratio > 5;
}

function detectHaloEffect(analysisResult: AnalysisSection): boolean {
  const subagentScores = analysisResult.subagent_results.map(r => r.score);
  if (subagentScores.length < 2) return false;
  
  const maxScore = Math.max(...subagentScores);
  const minScore = Math.min(...subagentScores);
  
  if (maxScore >= 8 && analysisResult.score >= maxScore - 0.5) {
    const nonMaxScores = subagentScores.filter(s => s < maxScore);
    const avgNonMax = nonMaxScores.reduce((a, b) => a + b, 0) / nonMaxScores.length;
    
    if (avgNonMax < maxScore - 2) {
      return true;
    }
  }
  
  return false;
}

export function checkForBiases(
  agentName: RegisteredAgentName,
  analysisResult: AnalysisSection
): BiasCheckResult {
  const metacognitionConfig = configRegistry.getMetacognitionConfig(agentName);
  const knownBiases = metacognitionConfig.biasDetection.knownBiases;
  
  const biasesDetected: BiasCheckResult['biasesDetected'] = [];
  const adjustmentsMade: string[] = [];
  
  const biasDetectors: Record<string, () => boolean> = {
    recency_bias: () => detectRecencyBias(analysisResult),
    confirmation_bias: () => detectConfirmationBias(analysisResult),
    halo_effect: () => detectHaloEffect(analysisResult),
    cultural_bias: () => false,
    minimalism_bias: () => false,
    technical_bias: () => false,
    complexity_bias: () => false,
    authority_bias: () => false,
  };
  
  for (const knownBias of knownBiases) {
    const detector = biasDetectors[knownBias.type];
    if (detector && detector()) {
      let severity: 'low' | 'medium' | 'high' = 'low';
      
      if (knownBias.type === 'confirmation_bias') {
        severity = 'high';
      } else if (knownBias.type === 'halo_effect') {
        severity = 'medium';
      } else if (knownBias.type === 'recency_bias') {
        severity = 'low';
      }
      
      biasesDetected.push({
        type: knownBias.type,
        severity,
        mitigationApplied: knownBias.mitigationStrategy
      });
      
      adjustmentsMade.push(`Applied mitigation for ${knownBias.type}: ${knownBias.mitigationStrategy}`);
    }
  }
  
  const selfCheckPassed = biasesDetected.filter(b => b.severity === 'high').length === 0;
  
  return {
    biasesDetected,
    selfCheckPassed,
    adjustmentsMade
  };
}

export function performMetacognition(
  agentName: RegisteredAgentName,
  analysisResult: AnalysisSection,
  subagentResults: SubAgentResult[],
  dataQuality: { htmlLength: number; pagesScraped: number; hasMetadata: boolean }
): MetacognitionResult {
  try {
    const confidence = assessConfidence(agentName, subagentResults, dataQuality);
    const biasCheck = checkForBiases(agentName, analysisResult);
    
    const metacognitionConfig = configRegistry.getMetacognitionConfig(agentName);
    const limitations = metacognitionConfig.limitationsAwareness.declaredLimitations;
    
    const biasPenalty = biasCheck.biasesDetected.reduce((penalty, bias) => {
      switch (bias.severity) {
        case 'high': return penalty + 0.15;
        case 'medium': return penalty + 0.08;
        case 'low': return penalty + 0.03;
        default: return penalty;
      }
    }, 0);
    
    const qualityScore = Math.max(0, confidence.overallConfidence * (1 - Math.min(biasPenalty, 0.5)));
    
    return {
      confidence,
      biasCheck,
      limitations,
      qualityScore
    };
  } catch (error) {
    console.error(`[Metacognition] Error performing metacognition for ${agentName}:`, error);
    
    return {
      confidence: {
        overallConfidence: 0.5,
        factorScores: [],
        uncertaintyFlags: ['metacognition_error'],
        reliabilityLevel: 'low'
      },
      biasCheck: {
        biasesDetected: [],
        selfCheckPassed: true,
        adjustmentsMade: []
      },
      limitations: ['Metacognition assessment failed'],
      qualityScore: 0.5
    };
  }
}
