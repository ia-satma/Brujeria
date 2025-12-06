import { z } from "zod";

// ============================================================================
// LAYER 1: IDENTITY - Who is the agent
// ============================================================================

export const ArchetypeSchema = z.enum([
  "creative_director",      // El Director Creativo - Visual Agent
  "experience_architect",   // El Arquitecto de Experiencias - UX Agent
  "strategic_narrator",     // El Narrador Estratégico - Content Agent
  "precision_engineer",     // El Ingeniero de Precisión - Technical Agent
  "council_chairman",       // Chairman for LLM Council
  "orchestrator",           // For coordinating agents
]);

export const ToneSchema = z.enum([
  "inspiring_technical",    // Creative but grounded
  "empathetic_analytical",  // User-focused with data
  "persuasive_analytical",  // Compelling with evidence
  "methodical_objective",   // Precise and factual
  "diplomatic_decisive",    // Balanced leadership
]);

export const IdentityLayerSchema = z.object({
  agentName: z.string(),
  displayName: z.string(),
  archetype: ArchetypeSchema,
  tone: ToneSchema,
  primaryObjective: z.string(),
  secondaryObjectives: z.array(z.string()),
  personality: z.object({
    traits: z.array(z.string()),
    communicationStyle: z.string(),
    decisionMakingApproach: z.string(),
  }),
  tagline: z.string(),
});

// ============================================================================
// LAYER 2: SECURITY - Rules and boundaries
// ============================================================================

export const ConfidentialityLevelSchema = z.enum([
  "public",           // Can share analysis publicly
  "client_only",      // Only share with client
  "internal",         // Internal analysis only
  "restricted",       // Highly sensitive
]);

export const SecurityLayerSchema = z.object({
  confidentialityLevel: ConfidentialityLevelSchema,
  dataHandlingRules: z.array(z.string()),
  prohibitedActions: z.array(z.string()),
  ethicalGuidelines: z.array(z.string()),
  analysisScope: z.object({
    allowedDomains: z.array(z.string()).optional(),
    excludedDomains: z.array(z.string()).optional(),
    maxDepthLevel: z.number(),
  }),
  auditRequirements: z.object({
    logAllDecisions: z.boolean(),
    requireJustification: z.boolean(),
    sensitiveDataMasking: z.boolean(),
  }),
});

// ============================================================================
// LAYER 3: METHODOLOGY - How the agent reasons
// ============================================================================

export const ReasoningStepSchema = z.object({
  step: z.number(),
  name: z.string(),
  description: z.string(),
  outputFormat: z.string(),
  validationCriteria: z.array(z.string()),
});

export const MethodologyLayerSchema = z.object({
  chainOfThought: z.array(ReasoningStepSchema),
  analysisFramework: z.string(),
  scoringRubric: z.object({
    scale: z.object({
      min: z.number(),
      max: z.number(),
    }),
    thresholds: z.object({
      exceptional: z.number(),
      good: z.number(),
      average: z.number(),
      poor: z.number(),
    }),
    calibrationNotes: z.string(),
  }),
  outputStructure: z.object({
    requiredSections: z.array(z.string()),
    formatting: z.string(),
    evidenceRequirements: z.string(),
  }),
  iterationProtocol: z.object({
    maxIterations: z.number(),
    improvementThreshold: z.number(),
    feedbackIntegration: z.string(),
  }),
});

// ============================================================================
// LAYER 4: STATIC KNOWLEDGE - Foundational expertise
// ============================================================================

export const KnowledgeSourceSchema = z.object({
  id: z.string(),
  title: z.string(),
  type: z.enum(["principle", "heuristic", "standard", "case_study", "best_practice"]),
  content: z.string(),
  applicability: z.array(z.string()),
  weight: z.number().min(0).max(1),
});

export const StaticKnowledgeLayerSchema = z.object({
  domain: z.string(),
  corePrinciples: z.array(KnowledgeSourceSchema),
  industryStandards: z.array(KnowledgeSourceSchema),
  bestPractices: z.array(KnowledgeSourceSchema),
  referenceAuthorities: z.array(z.object({
    name: z.string(),
    expertise: z.string(),
    keyContributions: z.array(z.string()),
  })),
  glossary: z.record(z.string(), z.string()),
});

// ============================================================================
// LAYER 5: DYNAMIC DATA - Context and real-time info
// ============================================================================

export const DynamicDataLayerSchema = z.object({
  sessionContext: z.object({
    currentIndustry: z.string().optional(),
    clientSize: z.enum(["startup", "smb", "enterprise"]).optional(),
    competitiveIntensity: z.enum(["low", "medium", "high"]).optional(),
    urgencyLevel: z.enum(["standard", "priority", "urgent"]).optional(),
  }),
  priorKnowledgeRetrieval: z.object({
    enabled: z.boolean(),
    maxDocuments: z.number(),
    relevanceThreshold: z.number(),
    crossAgentEnabled: z.boolean(),
  }),
  trendAwareness: z.object({
    checkCurrentTrends: z.boolean(),
    trendSources: z.array(z.string()),
    updateFrequency: z.string(),
  }),
  memorySettings: z.object({
    rememberPriorAnalyses: z.boolean(),
    similarityMatchThreshold: z.number(),
    maxHistoryDepth: z.number(),
  }),
});

// ============================================================================
// LAYER 6: TOOLS - Operational capabilities
// ============================================================================

export const ToolDefinitionSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  subagentPrompt: z.string(),
  activationConditions: z.array(z.string()),
  priority: z.number().min(1).max(10),
  timeout: z.number(),
  fallbackBehavior: z.string(),
});

export const ToolsLayerSchema = z.object({
  availableTools: z.array(ToolDefinitionSchema),
  executionMode: z.enum(["parallel", "sequential", "adaptive"]),
  maxConcurrentTools: z.number(),
  toolSelectionStrategy: z.string(),
  errorHandling: z.object({
    retryAttempts: z.number(),
    gracefulDegradation: z.boolean(),
    fallbackScoring: z.number(),
  }),
});

// ============================================================================
// LAYER 7: ORCHESTRATION - Cross-agent collaboration
// ============================================================================

export const CollaborationProtocolSchema = z.object({
  triggerConditions: z.array(z.string()),
  targetAgents: z.array(z.string()),
  informationSharing: z.enum(["full", "summary", "findings_only"]),
  conflictResolution: z.enum(["chairman_decides", "weighted_consensus", "majority_vote"]),
});

export const OrchestrationLayerSchema = z.object({
  role: z.enum(["primary", "supporting", "validator", "orchestrator"]),
  collaborationProtocols: z.array(CollaborationProtocolSchema),
  consensusMechanism: z.object({
    method: z.enum(["averaging", "weighted", "deliberation"]),
    tieBreaker: z.string(),
    minimumAgreement: z.number(),
  }),
  escalationRules: z.array(z.object({
    condition: z.string(),
    escalateTo: z.string(),
    urgency: z.enum(["low", "medium", "high"]),
  })),
  handoffProtocol: z.object({
    contextTransfer: z.array(z.string()),
    acknowledgmentRequired: z.boolean(),
  }),
});

// ============================================================================
// LAYER 8: METACOGNITION - Self-awareness (NEW)
// ============================================================================

export const ConfidenceFactorSchema = z.object({
  factor: z.string(),
  weight: z.number().min(0).max(1),
  description: z.string(),
});

export const MetacognitionLayerSchema = z.object({
  confidenceAssessment: z.object({
    enabled: z.boolean(),
    factors: z.array(ConfidenceFactorSchema),
    minimumConfidenceThreshold: z.number(),
    uncertaintyFlags: z.array(z.string()),
  }),
  biasDetection: z.object({
    enabled: z.boolean(),
    knownBiases: z.array(z.object({
      type: z.string(),
      description: z.string(),
      mitigationStrategy: z.string(),
    })),
    selfCheckPrompt: z.string(),
  }),
  limitationsAwareness: z.object({
    declaredLimitations: z.array(z.string()),
    uncertaintyDisclosure: z.boolean(),
    confidenceReporting: z.enum(["always", "when_low", "never"]),
  }),
  performanceTracking: z.object({
    trackAccuracy: z.boolean(),
    trackConsistency: z.boolean(),
    feedbackIncorporation: z.boolean(),
  }),
});

// ============================================================================
// LAYER 9: EVOLUTION - Self-improvement (NEW)
// ============================================================================

export const EvolutionProposalSchema = z.object({
  proposalId: z.string(),
  proposalType: z.enum(["prompt_enhancement", "scoring_calibration", "tool_addition", "methodology_update"]),
  description: z.string(),
  evidence: z.array(z.string()),
  expectedImprovement: z.string(),
  status: z.enum(["proposed", "pending_review", "approved", "rejected", "implemented"]),
});

export const EvolutionLayerSchema = z.object({
  selfImprovementEnabled: z.boolean(),
  proposalGeneration: z.object({
    enabled: z.boolean(),
    triggerConditions: z.array(z.string()),
    proposalCategories: z.array(z.string()),
  }),
  learningFromFeedback: z.object({
    userFeedbackWeight: z.number(),
    peerFeedbackWeight: z.number(),
    outcomeCorrelation: z.boolean(),
  }),
  adaptationRules: z.object({
    allowPromptModification: z.boolean(),
    allowScoringAdjustment: z.boolean(),
    requireApproval: z.boolean(),
    maxChangePerCycle: z.number(),
  }),
  evolutionHistory: z.array(EvolutionProposalSchema).optional(),
});

// ============================================================================
// COMPLETE AGENT CONFIGURATION
// ============================================================================

export const AgentConfigSchema = z.object({
  version: z.string(),
  lastUpdated: z.string(),
  identity: IdentityLayerSchema,
  security: SecurityLayerSchema,
  methodology: MethodologyLayerSchema,
  staticKnowledge: StaticKnowledgeLayerSchema,
  dynamicData: DynamicDataLayerSchema,
  tools: ToolsLayerSchema,
  orchestration: OrchestrationLayerSchema,
  metacognition: MetacognitionLayerSchema,
  evolution: EvolutionLayerSchema,
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type Archetype = z.infer<typeof ArchetypeSchema>;
export type Tone = z.infer<typeof ToneSchema>;
export type IdentityLayer = z.infer<typeof IdentityLayerSchema>;
export type SecurityLayer = z.infer<typeof SecurityLayerSchema>;
export type MethodologyLayer = z.infer<typeof MethodologyLayerSchema>;
export type ReasoningStep = z.infer<typeof ReasoningStepSchema>;
export type KnowledgeSource = z.infer<typeof KnowledgeSourceSchema>;
export type StaticKnowledgeLayer = z.infer<typeof StaticKnowledgeLayerSchema>;
export type DynamicDataLayer = z.infer<typeof DynamicDataLayerSchema>;
export type ToolDefinition = z.infer<typeof ToolDefinitionSchema>;
export type ToolsLayer = z.infer<typeof ToolsLayerSchema>;
export type CollaborationProtocol = z.infer<typeof CollaborationProtocolSchema>;
export type OrchestrationLayer = z.infer<typeof OrchestrationLayerSchema>;
export type ConfidenceFactor = z.infer<typeof ConfidenceFactorSchema>;
export type MetacognitionLayer = z.infer<typeof MetacognitionLayerSchema>;
export type EvolutionProposal = z.infer<typeof EvolutionProposalSchema>;
export type EvolutionLayer = z.infer<typeof EvolutionLayerSchema>;
export type AgentConfig = z.infer<typeof AgentConfigSchema>;

// ============================================================================
// INDUSTRY TEMPLATE SCHEMA
// ============================================================================

export const IndustryTemplateSchema = z.object({
  industryId: z.string(),
  industryName: z.string(),
  description: z.string(),
  specificKnowledge: z.array(KnowledgeSourceSchema),
  scoringAdjustments: z.record(z.string(), z.number()),
  priorityAreas: z.array(z.string()),
  commonPatterns: z.array(z.object({
    pattern: z.string(),
    frequency: z.enum(["common", "occasional", "rare"]),
    recommendation: z.string(),
  })),
  benchmarks: z.record(z.string(), z.number()),
});

export type IndustryTemplate = z.infer<typeof IndustryTemplateSchema>;
