export const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "Web Benchmarking Analyst API",
    description: `
# Web Benchmarking Analyst API

This API powers an autonomous AI-powered web benchmarking tool designed to analyze and compare website design, user experience, content quality, and technical performance.

## Core Features

- **Website Analysis**: Analyze client and competitor websites across 4 dimensions (Visual Design, UX/Navigation, Content Quality, Technical Performance)
- **Multi-Agent Architecture**: Hierarchical AI agents work in parallel for comprehensive analysis
- **Real-time Streaming**: SSE-based streaming for live analysis progress
- **PDF Report Generation**: Export detailed benchmarking reports
- **Agent Knowledge System**: Persistent knowledge storage with learning capabilities
- **Golden Dataset Validation**: Automated regression testing against known benchmarks

## Authentication

Currently, this API does not require authentication for development purposes.

## Rate Limiting

No rate limiting is currently enforced.
    `,
    version: "1.0.0",
    contact: {
      name: "Web Benchmarking Team",
    },
  },
  servers: [
    {
      url: "/api",
      description: "Development server",
    },
  ],
  tags: [
    {
      name: "Analysis",
      description: "Website analysis and benchmarking endpoints",
    },
    {
      name: "Reports",
      description: "Report retrieval and PDF export",
    },
    {
      name: "Resilience",
      description: "Circuit breaker and retry mechanism management",
    },
    {
      name: "Autonomy",
      description: "Agent learning cycle and performance monitoring",
    },
    {
      name: "Knowledge",
      description: "Agent knowledge base management",
    },
    {
      name: "Configuration",
      description: "Agent configuration management",
    },
    {
      name: "Evolution",
      description: "Agent evolution and self-improvement tracking",
    },
    {
      name: "Skills",
      description: "Dynamic skill and subagent management",
    },
    {
      name: "Validation",
      description: "Golden dataset validation and regression testing",
    },
    {
      name: "pCloud",
      description: "Cloud storage integration endpoints",
    },
  ],
  paths: {
    "/analyze": {
      post: {
        tags: ["Analysis"],
        summary: "Analyze websites (synchronous)",
        description: "Performs a comprehensive analysis of client and competitor websites. This is a synchronous endpoint that returns the complete report when finished.",
        operationId: "analyzeWebsites",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/AnalyzeRequest",
              },
              example: {
                clientUrl: "https://example.com",
                competitorUrls: ["https://competitor1.com", "https://competitor2.com"],
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Analysis completed successfully",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Report",
                },
              },
            },
          },
          "400": {
            description: "Invalid request - URL validation failed",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ValidationError",
                },
              },
            },
          },
          "500": {
            description: "Analysis failed",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },
        },
      },
    },
    "/analyze-stream": {
      post: {
        tags: ["Analysis"],
        summary: "Analyze websites (streaming)",
        description: "Performs a comprehensive analysis with real-time progress streaming via Server-Sent Events (SSE). Provides live logging of agent activity.",
        operationId: "analyzeWebsitesStream",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/AnalyzeRequest",
              },
              example: {
                clientUrl: "https://example.com",
                competitorUrls: ["https://competitor1.com"],
              },
            },
          },
        },
        responses: {
          "200": {
            description: "SSE stream with analysis progress and final report",
            content: {
              "text/event-stream": {
                schema: {
                  type: "string",
                  description: "Server-Sent Events stream with JSON payloads",
                },
                example: "data: {\"type\": \"log\", \"message\": \"[Benchmarking_Manager] Initializing...\"}\n\ndata: {\"type\": \"complete\", \"report\": {...}, \"reportId\": 1}\n\n",
              },
            },
          },
          "400": {
            description: "Invalid request",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ValidationError",
                },
              },
            },
          },
        },
      },
    },
    "/extract-domains": {
      post: {
        tags: ["Analysis"],
        summary: "Extract domains from portfolio URL",
        description: "Extracts external domain links from a given portfolio URL for competitor discovery.",
        operationId: "extractDomains",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["portfolioUrl"],
                properties: {
                  portfolioUrl: {
                    type: "string",
                    format: "uri",
                    description: "Portfolio page URL to scan for external domains",
                  },
                },
              },
              example: {
                portfolioUrl: "https://agency-portfolio.com/clients",
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Domains extracted successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    domains: {
                      type: "array",
                      items: { type: "string" },
                    },
                  },
                },
              },
            },
          },
          "400": {
            description: "Invalid URL",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ValidationError",
                },
              },
            },
          },
        },
      },
    },
    "/reports/{id}/pdf": {
      get: {
        tags: ["Reports"],
        summary: "Download report as PDF",
        description: "Generates and downloads a PDF version of a saved analysis report.",
        operationId: "downloadReportPdf",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "Report ID",
            schema: {
              type: "integer",
            },
          },
        ],
        responses: {
          "200": {
            description: "PDF file",
            content: {
              "application/pdf": {
                schema: {
                  type: "string",
                  format: "binary",
                },
              },
            },
          },
          "400": {
            description: "Invalid report ID",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },
          "404": {
            description: "Report not found",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },
        },
      },
    },
    "/resilience/stats": {
      get: {
        tags: ["Resilience"],
        summary: "Get resilience statistics",
        description: "Returns statistics about agent resilience including retry counts, failures, and cache hits.",
        operationId: "getResilienceStats",
        responses: {
          "200": {
            description: "Resilience statistics",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ResilienceStats",
                },
              },
            },
          },
        },
      },
    },
    "/resilience/circuit-breakers": {
      get: {
        tags: ["Resilience"],
        summary: "Get circuit breaker states",
        description: "Returns the current state of all circuit breakers protecting agent calls.",
        operationId: "getCircuitBreakers",
        responses: {
          "200": {
            description: "Circuit breaker states",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    circuitBreakers: {
                      type: "array",
                      items: {
                        $ref: "#/components/schemas/CircuitBreakerSnapshot",
                      },
                    },
                    summary: {
                      type: "object",
                      properties: {
                        total: { type: "integer" },
                        open: { type: "integer" },
                        halfOpen: { type: "integer" },
                        closed: { type: "integer" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/resilience/reset-circuit-breakers": {
      post: {
        tags: ["Resilience"],
        summary: "Reset all circuit breakers",
        description: "Resets all circuit breakers to CLOSED state, allowing failed agents to retry.",
        operationId: "resetCircuitBreakers",
        responses: {
          "200": {
            description: "Circuit breakers reset",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    message: { type: "string" },
                  },
                },
                example: {
                  success: true,
                  message: "All circuit breakers reset to CLOSED state",
                },
              },
            },
          },
        },
      },
    },
    "/resilience/clear-cache": {
      post: {
        tags: ["Resilience"],
        summary: "Clear resilience cache",
        description: "Clears the cached responses used for resilience fallbacks.",
        operationId: "clearResilienceCache",
        responses: {
          "200": {
            description: "Cache cleared",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    message: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/autonomy/run-learning-cycle": {
      post: {
        tags: ["Autonomy"],
        summary: "Run agent learning cycle",
        description: "Triggers a learning cycle where agents analyze their performance and identify patterns for improvement.",
        operationId: "runLearningCycle",
        responses: {
          "200": {
            description: "Learning cycle completed",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    message: { type: "string" },
                    insightsCount: { type: "integer" },
                    insights: {
                      type: "array",
                      items: { type: "object" },
                    },
                    logs: {
                      type: "array",
                      items: { type: "string" },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/autonomy/stats": {
      get: {
        tags: ["Autonomy"],
        summary: "Get autonomy statistics",
        description: "Returns overall autonomy engine statistics including learning metrics.",
        operationId: "getAutonomyStats",
        responses: {
          "200": {
            description: "Autonomy statistics",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    stats: { type: "object" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/autonomy/agent-performance": {
      get: {
        tags: ["Autonomy"],
        summary: "Get agent performance report",
        description: "Returns performance metrics for all agents including accuracy, speed, and confidence scores.",
        operationId: "getAgentPerformance",
        responses: {
          "200": {
            description: "Agent performance report",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    agents: { type: "object" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/knowledge/initialize": {
      post: {
        tags: ["Knowledge"],
        summary: "Initialize agent knowledge",
        description: "Initializes the knowledge folder structure for all agents in pCloud.",
        operationId: "initializeKnowledge",
        responses: {
          "200": {
            description: "Knowledge initialized",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    message: { type: "string" },
                    agents: {
                      type: "array",
                      items: { type: "string" },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/knowledge/stats/{agentName}": {
      get: {
        tags: ["Knowledge"],
        summary: "Get agent knowledge statistics",
        description: "Returns knowledge statistics for a specific agent.",
        operationId: "getKnowledgeStats",
        parameters: [
          {
            name: "agentName",
            in: "path",
            required: true,
            description: "Agent name",
            schema: {
              type: "string",
              enum: [
                "Visual_Aesthetics_Agent",
                "UX_Navigation_Agent",
                "Content_Storytelling_Agent",
                "Technical_Performance_Agent",
                "Color_Palette_Analyzer",
                "Typography_Analyzer",
                "Layout_Analyzer",
                "Navigation_Flow_Analyzer",
                "Interaction_Pattern_Analyzer",
                "Accessibility_Analyzer",
                "Headline_Analyzer",
                "Value_Proposition_Analyzer",
                "Engagement_Analyzer",
                "Performance_Metrics_Analyzer",
                "SEO_Analyzer",
                "Security_Analyzer",
              ],
            },
          },
        ],
        responses: {
          "200": {
            description: "Knowledge statistics",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    stats: { type: "object" },
                  },
                },
              },
            },
          },
          "400": {
            description: "Invalid agent name",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },
        },
      },
    },
    "/knowledge/documents/{agentName}": {
      get: {
        tags: ["Knowledge"],
        summary: "Get agent knowledge documents",
        description: "Returns knowledge documents for a specific agent.",
        operationId: "getKnowledgeDocuments",
        parameters: [
          {
            name: "agentName",
            in: "path",
            required: true,
            description: "Agent name",
            schema: { type: "string" },
          },
          {
            name: "limit",
            in: "query",
            description: "Maximum number of documents to return",
            schema: { type: "integer", default: 10 },
          },
          {
            name: "type",
            in: "query",
            description: "Filter by document type",
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": {
            description: "Knowledge documents",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    agentName: { type: "string" },
                    count: { type: "integer" },
                    documents: {
                      type: "array",
                      items: { type: "object" },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/knowledge/save-test": {
      post: {
        tags: ["Knowledge"],
        summary: "Save test knowledge document",
        description: "Saves a test knowledge document to verify the knowledge system is working.",
        operationId: "saveTestKnowledge",
        responses: {
          "200": {
            description: "Test document saved",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    message: { type: "string" },
                    result: { type: "object" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/config/stats": {
      get: {
        tags: ["Configuration"],
        summary: "Get configuration statistics",
        description: "Returns statistics about the agent configuration registry.",
        operationId: "getConfigStats",
        responses: {
          "200": {
            description: "Configuration statistics",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    stats: { type: "object" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/config/sync": {
      post: {
        tags: ["Configuration"],
        summary: "Sync configurations to pCloud",
        description: "Syncs all agent configurations to pCloud storage.",
        operationId: "syncConfig",
        responses: {
          "200": {
            description: "Sync result",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    synced: {
                      type: "array",
                      items: { type: "string" },
                    },
                    failed: {
                      type: "array",
                      items: { type: "string" },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/config/agents/{agentName}": {
      get: {
        tags: ["Configuration"],
        summary: "Get agent configuration",
        description: "Returns the full 9-layer configuration for a specific agent.",
        operationId: "getAgentConfig",
        parameters: [
          {
            name: "agentName",
            in: "path",
            required: true,
            description: "Agent name",
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": {
            description: "Agent configuration",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    config: { type: "object" },
                  },
                },
              },
            },
          },
          "404": {
            description: "Agent not found",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },
        },
      },
    },
    "/config/agents/{agentName}/save": {
      post: {
        tags: ["Configuration"],
        summary: "Save agent configuration to pCloud",
        description: "Persists the agent configuration to pCloud storage.",
        operationId: "saveAgentConfig",
        parameters: [
          {
            name: "agentName",
            in: "path",
            required: true,
            description: "Agent name",
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": {
            description: "Configuration saved",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    error: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/config/system-prompt/{agentName}": {
      get: {
        tags: ["Configuration"],
        summary: "Get agent system prompt",
        description: "Builds and returns the complete system prompt for an agent, optionally with industry-specific templates.",
        operationId: "getSystemPrompt",
        parameters: [
          {
            name: "agentName",
            in: "path",
            required: true,
            description: "Agent name",
            schema: { type: "string" },
          },
          {
            name: "industry",
            in: "query",
            description: "Industry for template customization (e.g., fintech, ecommerce)",
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": {
            description: "System prompt",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    agentName: { type: "string" },
                    industry: { type: "string", nullable: true },
                    systemPrompt: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/evolution/stats": {
      get: {
        tags: ["Evolution"],
        summary: "Get evolution statistics",
        description: "Returns performance statistics from the evolution service.",
        operationId: "getEvolutionStats",
        responses: {
          "200": {
            description: "Evolution statistics",
            content: {
              "application/json": {
                schema: { type: "object" },
              },
            },
          },
        },
      },
    },
    "/evolution/proposals": {
      get: {
        tags: ["Evolution"],
        summary: "Get pending evolution proposals",
        description: "Returns pending improvement proposals generated by the evolution service.",
        operationId: "getEvolutionProposals",
        responses: {
          "200": {
            description: "Pending proposals",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { type: "object" },
                },
              },
            },
          },
        },
      },
    },
    "/evolution/summary": {
      get: {
        tags: ["Evolution"],
        summary: "Get evolution summary",
        description: "Returns a summary of the evolution service state.",
        operationId: "getEvolutionSummary",
        responses: {
          "200": {
            description: "Evolution summary",
            content: {
              "application/json": {
                schema: { type: "object" },
              },
            },
          },
        },
      },
    },
    "/evolution/save": {
      post: {
        tags: ["Evolution"],
        summary: "Save evolution state to cloud",
        description: "Persists the evolution service state to pCloud.",
        operationId: "saveEvolutionState",
        responses: {
          "200": {
            description: "State saved",
            content: {
              "application/json": {
                schema: { type: "object" },
              },
            },
          },
        },
      },
    },
    "/evolution/load": {
      post: {
        tags: ["Evolution"],
        summary: "Load evolution state from cloud",
        description: "Loads the evolution service state from pCloud.",
        operationId: "loadEvolutionState",
        responses: {
          "200": {
            description: "State loaded",
            content: {
              "application/json": {
                schema: { type: "object" },
              },
            },
          },
        },
      },
    },
    "/evolution/proposals/{id}/status": {
      post: {
        tags: ["Evolution"],
        summary: "Update proposal status",
        description: "Approves or rejects an evolution proposal.",
        operationId: "updateProposalStatus",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "Proposal ID",
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["status"],
                properties: {
                  status: {
                    type: "string",
                    enum: ["approved", "rejected"],
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Status updated",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                  },
                },
              },
            },
          },
          "400": {
            description: "Invalid status",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },
        },
      },
    },
    "/skills/{agentName}": {
      get: {
        tags: ["Skills"],
        summary: "List agent skills",
        description: "Returns all skills for a specific agent.",
        operationId: "listSkills",
        parameters: [
          {
            name: "agentName",
            in: "path",
            required: true,
            description: "Agent name",
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": {
            description: "Skills list",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    agentName: { type: "string" },
                    count: { type: "integer" },
                    skills: {
                      type: "array",
                      items: {
                        $ref: "#/components/schemas/SkillSummary",
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ["Skills"],
        summary: "Create new skill",
        description: "Creates a new skill for an agent.",
        operationId: "createSkill",
        parameters: [
          {
            name: "agentName",
            in: "path",
            required: true,
            description: "Agent name",
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/CreateSkillRequest",
              },
              example: {
                name: "E-commerce Optimization",
                domain: "Visual Design",
                subDomain: "Product Pages",
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Skill created",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    skill: {
                      $ref: "#/components/schemas/SkillSummary",
                    },
                  },
                },
              },
            },
          },
          "400": {
            description: "Invalid request",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ValidationError",
                },
              },
            },
          },
        },
      },
    },
    "/skills/{agentName}/{skillId}": {
      get: {
        tags: ["Skills"],
        summary: "Get skill details",
        description: "Returns the full details of a specific skill.",
        operationId: "getSkill",
        parameters: [
          {
            name: "agentName",
            in: "path",
            required: true,
            description: "Agent name",
            schema: { type: "string" },
          },
          {
            name: "skillId",
            in: "path",
            required: true,
            description: "Skill ID",
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": {
            description: "Skill details",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    skill: { type: "object" },
                  },
                },
              },
            },
          },
          "404": {
            description: "Skill not found",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },
        },
      },
    },
    "/skills/{agentName}/{skillId}/learn": {
      post: {
        tags: ["Skills"],
        summary: "Add learning to skill",
        description: "Adds new learning content to a skill's knowledge base.",
        operationId: "addLearning",
        parameters: [
          {
            name: "agentName",
            in: "path",
            required: true,
            description: "Agent name",
            schema: { type: "string" },
          },
          {
            name: "skillId",
            in: "path",
            required: true,
            description: "Skill ID",
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/AddLearningRequest",
              },
              example: {
                type: "benchmark",
                content: { metric: "conversion_rate", value: 3.5 },
                source: "industry_report_2024",
                confidence: 0.85,
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Learning added",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    message: { type: "string" },
                    newVersion: { type: "string" },
                    evolutionHistory: {
                      type: "array",
                      items: { type: "object" },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/skills/{agentName}/{skillId}/evolve": {
      post: {
        tags: ["Skills"],
        summary: "Evolve skill expertise",
        description: "Updates a skill's expertise level based on performance data.",
        operationId: "evolveSkill",
        parameters: [
          {
            name: "agentName",
            in: "path",
            required: true,
            description: "Agent name",
            schema: { type: "string" },
          },
          {
            name: "skillId",
            in: "path",
            required: true,
            description: "Skill ID",
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["score", "successRate"],
                properties: {
                  score: {
                    type: "number",
                    minimum: 0,
                    maximum: 10,
                  },
                  successRate: {
                    type: "number",
                    minimum: 0,
                    maximum: 1,
                  },
                },
              },
              example: {
                score: 8.5,
                successRate: 0.92,
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Skill evolved",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    skillId: { type: "string" },
                    name: { type: "string" },
                    expertiseLevel: { type: "string" },
                    performanceMetrics: { type: "object" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/skills/{agentName}/recommendations": {
      get: {
        tags: ["Skills"],
        summary: "Get skill recommendations",
        description: "Generates specialization recommendations based on analysis history.",
        operationId: "getSkillRecommendations",
        parameters: [
          {
            name: "agentName",
            in: "path",
            required: true,
            description: "Agent name",
            schema: { type: "string" },
          },
          {
            name: "history",
            in: "query",
            description: "JSON-encoded analysis history",
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": {
            description: "Recommendations",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    agentName: { type: "string" },
                    recommendations: {
                      type: "array",
                      items: { type: "object" },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/subagents/{agentName}": {
      get: {
        tags: ["Skills"],
        summary: "List subagents",
        description: "Returns all dynamic subagents for an agent.",
        operationId: "listSubagents",
        parameters: [
          {
            name: "agentName",
            in: "path",
            required: true,
            description: "Agent name",
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": {
            description: "Subagents list",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    agentName: { type: "string" },
                    count: { type: "integer" },
                    subagents: {
                      type: "array",
                      items: {
                        $ref: "#/components/schemas/SubagentSummary",
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ["Skills"],
        summary: "Create subagent",
        description: "Creates a new dynamic subagent with specified skills.",
        operationId: "createSubagent",
        parameters: [
          {
            name: "agentName",
            in: "path",
            required: true,
            description: "Agent name",
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/CreateSubagentRequest",
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Subagent created",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    subagent: {
                      $ref: "#/components/schemas/SubagentSummary",
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/subagents/{agentName}/{subagentId}": {
      get: {
        tags: ["Skills"],
        summary: "Get subagent details",
        description: "Returns full details of a specific subagent.",
        operationId: "getSubagent",
        parameters: [
          {
            name: "agentName",
            in: "path",
            required: true,
            description: "Agent name",
            schema: { type: "string" },
          },
          {
            name: "subagentId",
            in: "path",
            required: true,
            description: "Subagent ID",
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": {
            description: "Subagent details",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    subagent: { type: "object" },
                  },
                },
              },
            },
          },
          "404": {
            description: "Subagent not found",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },
        },
      },
    },
    "/subagents/{agentName}/{subagentId}/execute": {
      post: {
        tags: ["Skills"],
        summary: "Execute subagent",
        description: "Executes a subagent with given context and optionally evolves its skills.",
        operationId: "executeSubagent",
        parameters: [
          {
            name: "agentName",
            in: "path",
            required: true,
            description: "Agent name",
            schema: { type: "string" },
          },
          {
            name: "subagentId",
            in: "path",
            required: true,
            description: "Subagent ID",
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["context"],
                properties: {
                  context: {
                    type: "string",
                    description: "Analysis context for the subagent",
                  },
                  evolveSkills: {
                    type: "boolean",
                    description: "Whether to evolve skills based on performance",
                    default: false,
                  },
                },
              },
              example: {
                context: "Analyze the e-commerce product page layout...",
                evolveSkills: true,
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Execution result",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    result: { type: "object" },
                    logs: {
                      type: "array",
                      items: { type: "string" },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/validation/run": {
      post: {
        tags: ["Validation"],
        summary: "Run golden dataset validation",
        description: "Executes validation against the golden dataset of known websites with expected scores.",
        operationId: "runValidation",
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  toleranceOverride: {
                    type: "number",
                    minimum: 0,
                    maximum: 5,
                    description: "Override default tolerance for score comparison",
                  },
                  initiatedBy: {
                    type: "string",
                    description: "Identifier for who initiated the validation",
                  },
                },
              },
              example: {
                toleranceOverride: 1.5,
                initiatedBy: "scheduled_job",
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Validation completed",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ValidationResult",
                },
              },
            },
          },
        },
      },
    },
    "/validation/runs": {
      get: {
        tags: ["Validation"],
        summary: "Get validation run history",
        description: "Returns a list of recent validation runs.",
        operationId: "getValidationRuns",
        parameters: [
          {
            name: "limit",
            in: "query",
            description: "Maximum number of runs to return",
            schema: { type: "integer", default: 10 },
          },
        ],
        responses: {
          "200": {
            description: "Validation runs",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    runs: {
                      type: "array",
                      items: { type: "object" },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/validation/runs/{id}": {
      get: {
        tags: ["Validation"],
        summary: "Get validation run details",
        description: "Returns detailed results for a specific validation run.",
        operationId: "getValidationRunDetails",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "Validation run ID",
            schema: { type: "integer" },
          },
        ],
        responses: {
          "200": {
            description: "Validation run details",
            content: {
              "application/json": {
                schema: { type: "object" },
              },
            },
          },
          "404": {
            description: "Run not found",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },
        },
      },
    },
    "/validation/sites": {
      get: {
        tags: ["Validation"],
        summary: "List golden dataset sites",
        description: "Returns all sites in the golden dataset.",
        operationId: "listValidationSites",
        parameters: [
          {
            name: "enabledOnly",
            in: "query",
            description: "Only return enabled sites",
            schema: { type: "boolean", default: true },
          },
        ],
        responses: {
          "200": {
            description: "Golden dataset sites",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    sites: {
                      type: "array",
                      items: {
                        $ref: "#/components/schemas/GoldenDatasetSite",
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ["Validation"],
        summary: "Add or update golden dataset site",
        description: "Creates or updates a site in the golden dataset.",
        operationId: "upsertValidationSite",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/GoldenDatasetSiteInput",
              },
              example: {
                url: "https://example.com",
                displayName: "Example Site",
                category: "Corporate",
                expectations: {
                  visual_design: { min: 7, max: 9 },
                  user_experience: { min: 6, max: 8 },
                  content_quality: { min: 7, max: 9 },
                  technical_performance: { min: 8, max: 10 },
                },
                enabled: 1,
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Site saved",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    site: {
                      $ref: "#/components/schemas/GoldenDatasetSite",
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/validation/sites/{id}": {
      delete: {
        tags: ["Validation"],
        summary: "Delete golden dataset site",
        description: "Removes a site from the golden dataset.",
        operationId: "deleteValidationSite",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "Site ID",
            schema: { type: "integer" },
          },
        ],
        responses: {
          "200": {
            description: "Site deleted",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    message: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/validation/seed": {
      post: {
        tags: ["Validation"],
        summary: "Seed golden dataset",
        description: "Populates the golden dataset with default test sites.",
        operationId: "seedGoldenDataset",
        responses: {
          "200": {
            description: "Dataset seeded",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    message: { type: "string" },
                    sitesCount: { type: "integer" },
                    sites: {
                      type: "array",
                      items: {
                        $ref: "#/components/schemas/GoldenDatasetSite",
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/pcloud/test": {
      get: {
        tags: ["pCloud"],
        summary: "Test pCloud connection",
        description: "Tests the pCloud connection and creates a test folder.",
        operationId: "testPCloudConnection",
        responses: {
          "200": {
            description: "Connection successful",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    connection: { type: "object" },
                    testFolder: {
                      type: "object",
                      properties: {
                        path: { type: "string" },
                        folderId: { type: "integer" },
                      },
                    },
                  },
                },
              },
            },
          },
          "500": {
            description: "Connection failed",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },
        },
      },
    },
    "/pcloud/list/{agentName}": {
      get: {
        tags: ["pCloud"],
        summary: "List pCloud folder contents",
        description: "Lists contents of an agent's pCloud folder.",
        operationId: "listPCloudFolder",
        parameters: [
          {
            name: "agentName",
            in: "path",
            required: false,
            description: "Agent name (optional - lists root if not provided)",
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": {
            description: "Folder contents",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    path: { type: "string" },
                    contents: { type: "object" },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      AnalyzeRequest: {
        type: "object",
        required: ["clientUrl", "competitorUrls"],
        properties: {
          clientUrl: {
            type: "string",
            format: "uri",
            description: "The client website URL to analyze",
          },
          competitorUrls: {
            type: "array",
            items: { type: "string", format: "uri" },
            minItems: 1,
            description: "List of competitor URLs to compare against",
          },
        },
      },
      Report: {
        type: "object",
        properties: {
          report_title: { type: "string" },
          report_metadata: {
            type: "object",
            properties: {
              generatedAt: { type: "string", format: "date-time" },
              analysisVersion: { type: "string" },
              clientUrl: { type: "string" },
              competitorCount: { type: "integer" },
              consensusScore: { type: "number" },
            },
          },
          executive_summary: { type: "object" },
          client_website_analysis: {
            $ref: "#/components/schemas/SiteAnalysis",
          },
          competitor_analyses: {
            type: "array",
            items: { $ref: "#/components/schemas/SiteAnalysis" },
          },
          councilResult: { type: "object" },
          prioritized_tasks: {
            type: "array",
            items: { type: "object" },
          },
          execution_order: {
            type: "array",
            items: { type: "string" },
          },
          completion_criteria: { type: "object" },
        },
      },
      SiteAnalysis: {
        type: "object",
        properties: {
          name: { type: "string" },
          url: { type: "string", format: "uri" },
          visual_design: {
            type: "object",
            properties: {
              score: { type: "number" },
              observations: { type: "string" },
              strengths: { type: "array", items: { type: "string" } },
              weaknesses: { type: "array", items: { type: "string" } },
            },
          },
          user_experience: {
            type: "object",
            properties: {
              score: { type: "number" },
              observations: { type: "string" },
              strengths: { type: "array", items: { type: "string" } },
              weaknesses: { type: "array", items: { type: "string" } },
            },
          },
          content_quality: {
            type: "object",
            properties: {
              score: { type: "number" },
              observations: { type: "string" },
              strengths: { type: "array", items: { type: "string" } },
              weaknesses: { type: "array", items: { type: "string" } },
            },
          },
          technical_performance: {
            type: "object",
            properties: {
              score: { type: "number" },
              observations: { type: "string" },
              strengths: { type: "array", items: { type: "string" } },
              weaknesses: { type: "array", items: { type: "string" } },
            },
          },
          overall_score: { type: "number" },
        },
      },
      ResilienceStats: {
        type: "object",
        properties: {
          success: { type: "boolean" },
          stats: {
            type: "object",
            additionalProperties: {
              type: "object",
              properties: {
                totalCalls: { type: "integer" },
                successfulCalls: { type: "integer" },
                failedCalls: { type: "integer" },
                retriedCalls: { type: "integer" },
                cacheHits: { type: "integer" },
                averageLatency: { type: "number" },
              },
            },
          },
        },
      },
      CircuitBreakerSnapshot: {
        type: "object",
        properties: {
          name: { type: "string" },
          state: {
            type: "string",
            enum: ["CLOSED", "OPEN", "HALF_OPEN"],
          },
          failures: { type: "integer" },
          successes: { type: "integer" },
          lastFailure: { type: "string", format: "date-time", nullable: true },
        },
      },
      SkillSummary: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          version: { type: "string" },
          domain: { type: "string" },
          subDomain: { type: "string" },
          expertiseLevel: {
            type: "string",
            enum: ["novice", "beginner", "intermediate", "advanced", "expert", "master"],
          },
          usageCount: { type: "integer" },
          averageScore: { type: "number" },
        },
      },
      CreateSkillRequest: {
        type: "object",
        required: ["name", "domain", "subDomain"],
        properties: {
          name: { type: "string", minLength: 1 },
          domain: { type: "string", minLength: 1 },
          subDomain: { type: "string", minLength: 1 },
          initialKnowledge: {
            type: "object",
            properties: {
              theoreticalFrameworks: { type: "array", items: { type: "object" } },
              glossary: { type: "array", items: { type: "object" } },
              benchmarks: { type: "array", items: { type: "object" } },
              industryStandards: { type: "array", items: { type: "object" } },
            },
          },
        },
      },
      AddLearningRequest: {
        type: "object",
        required: ["type", "content", "source", "confidence"],
        properties: {
          type: {
            type: "string",
            enum: ["benchmark", "case_study", "framework", "trend", "glossary"],
          },
          content: { type: "object" },
          source: { type: "string" },
          confidence: {
            type: "number",
            minimum: 0,
            maximum: 1,
          },
        },
      },
      SubagentSummary: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          purpose: { type: "string" },
          skillCount: { type: "integer" },
          isActive: { type: "boolean" },
          executionCount: { type: "integer" },
          averageScore: { type: "number" },
          lastExecuted: { type: "string", format: "date-time", nullable: true },
        },
      },
      CreateSubagentRequest: {
        type: "object",
        required: ["name", "purpose", "skillIds"],
        properties: {
          name: { type: "string", minLength: 1 },
          purpose: { type: "string", minLength: 1 },
          skillIds: {
            type: "array",
            items: { type: "string" },
            minItems: 1,
          },
          activationConditions: {
            type: "array",
            items: { type: "string" },
          },
        },
      },
      GoldenDatasetSite: {
        type: "object",
        properties: {
          id: { type: "integer" },
          url: { type: "string", format: "uri" },
          displayName: { type: "string" },
          category: { type: "string" },
          expectations: {
            $ref: "#/components/schemas/SiteExpectations",
          },
          enabled: { type: "integer" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      GoldenDatasetSiteInput: {
        type: "object",
        required: ["url", "displayName", "category", "expectations"],
        properties: {
          url: { type: "string", format: "uri" },
          displayName: { type: "string", minLength: 1 },
          category: { type: "string", minLength: 1 },
          expectations: {
            $ref: "#/components/schemas/SiteExpectations",
          },
          enabled: {
            type: "integer",
            minimum: 0,
            maximum: 1,
          },
        },
      },
      SiteExpectations: {
        type: "object",
        required: ["visual_design", "user_experience", "content_quality", "technical_performance"],
        properties: {
          visual_design: {
            $ref: "#/components/schemas/CategoryExpectation",
          },
          user_experience: {
            $ref: "#/components/schemas/CategoryExpectation",
          },
          content_quality: {
            $ref: "#/components/schemas/CategoryExpectation",
          },
          technical_performance: {
            $ref: "#/components/schemas/CategoryExpectation",
          },
        },
      },
      CategoryExpectation: {
        type: "object",
        required: ["min", "max"],
        properties: {
          min: { type: "number", minimum: 0, maximum: 10 },
          max: { type: "number", minimum: 0, maximum: 10 },
          tolerance: { type: "number" },
        },
      },
      ValidationResult: {
        type: "object",
        properties: {
          success: { type: "boolean" },
          runId: { type: "integer" },
          status: { type: "string" },
          totalSites: { type: "integer" },
          passedSites: { type: "integer" },
          failedSites: { type: "integer" },
          passRate: { type: "number" },
          results: {
            type: "array",
            items: { type: "object" },
          },
          logs: {
            type: "array",
            items: { type: "string" },
          },
        },
      },
      Error: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          error: { type: "string" },
        },
      },
      ValidationError: {
        type: "object",
        properties: {
          error: { type: "string" },
          details: {
            type: "array",
            items: {
              type: "object",
              properties: {
                code: { type: "string" },
                path: {
                  type: "array",
                  items: { type: "string" },
                },
                message: { type: "string" },
              },
            },
          },
        },
      },
    },
  },
};
