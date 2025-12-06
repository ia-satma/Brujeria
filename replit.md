# Web Benchmarking Analyst Agent

## Overview

This application is an autonomous AI-powered web benchmarking tool designed to analyze and compare website design, user experience, content quality, and technical performance. It accepts multiple URLs (a client website and competitor websites), performs comprehensive analysis through specialized AI agents, and generates detailed comparative reports with actionable recommendations.

The system uses a distributed agent architecture where specialized AI agents work in parallel to evaluate different aspects of websites, providing granular insights across visual design, UX/navigation, content storytelling, and technical performance.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:**
- **Framework:** React 18 with TypeScript
- **Build Tool:** Vite for fast development and optimized production builds
- **Styling:** Tailwind CSS with custom theme configuration using the "new-york" shadcn/ui style
- **UI Components:** Comprehensive shadcn/ui component library (Radix UI primitives)
- **State Management:** React Hook Form for form handling, TanStack Query for server state
- **Animations:** Framer Motion for smooth transitions and agent network visualization
- **Charts:** Recharts for data visualization in reports

**Design System:**
- Custom dark theme with cyberpunk/terminal aesthetic
- Custom fonts: Inter (sans), Space Grotesk (display), JetBrains Mono (monospace)
- Responsive design with mobile-first approach
- Component aliases configured for clean imports (@/components, @/lib, etc.)

**Key Frontend Features:**
- Real-time agent execution visualization with network graph
- Live terminal-style logging showing agent activity
- Interactive report generation with charts and comparative analysis
- Multi-URL input form with dynamic competitor field management

### Backend Architecture

**Technology Stack:**
- **Runtime:** Node.js with Express.js
- **Language:** TypeScript with ESNext module system
- **AI Integration:** OpenAI API for agent reasoning and analysis
- **Session Management:** Express sessions with PostgreSQL session store (connect-pg-simple)

**Agent Architecture Pattern:**

The system implements a **hierarchical multi-agent architecture** with specialized agents:

1. **Orchestrator Layer:**
   - `Benchmarking_Manager`: Main coordinator that distributes tasks and consolidates results
   - `Scraping_Orchestrator`: Manages web scraping and data extraction

2. **Specialized Analyst Agents (work in parallel):**
   - `Visual_Aesthetics_Agent`: Analyzes color palettes, typography, design trends
   - `UX_Navigation_Agent`: Evaluates information architecture, CTAs, responsive design
   - `Content_Storytelling_Agent`: Assesses brand voice, thought leadership, credibility
   - `Technical_Performance_Agent`: Reviews page speed, SEO optimization, content structure

3. **Sub-Agents:** Each analyst agent delegates to specialized sub-agents for granular analysis (e.g., Color_Palette_Analyzer, Typo_Readability_Checker, CTA_Effectiveness_Scorer)

**Processing Flow:**
- Accepts client URL and competitor URLs via REST API
- Sequentially scrapes and analyzes each website
- Runs specialized agents in parallel for each site
- Aggregates results into structured JSON report
- Calculates comparative scores and generates recommendations

**Scoring System:**
- Each analysis area receives a 1-10 score
- Overall score calculated as average across all areas
- Scores compared across client and competitor sites
- Industry benchmarks and best practices identified

### Data Storage

**Database:** PostgreSQL with Drizzle ORM

**Schema Design:**
- `users` table: Basic authentication (username/password)
- `analysis_reports` table: Stores complete analysis results with:
  - Client and competitor URLs (JSON array)
  - Full report data (JSON object)
  - Timestamp for historical tracking

**ORM Configuration:**
- Drizzle Kit for migrations (output to ./migrations)
- Schema defined in shared/schema.ts for full-stack type safety
- Zod validation schemas generated from Drizzle schemas

**Session Storage:** PostgreSQL-backed sessions for production scalability

### External Dependencies

**AI Services:**
- **OpenAI API:** Primary LLM provider for agent reasoning and analysis
  - Configured via environment variables (AI_INTEGRATIONS_OPENAI_API_KEY, AI_INTEGRATIONS_OPENAI_BASE_URL)
  - Used for multi-turn agent conversations and structured output generation

**Web Scraping:**
- Built-in web scraping capability to extract:
  - HTML content and parsed text
  - Meta tags (title, description)
  - Heading structure (H1, H2 tags)
  - Links and image counts
  - Viewport and responsive design indicators

**Third-Party UI Libraries:**
- Radix UI: Accessible component primitives (40+ components installed)
- Lucide React: Icon library
- Recharts: Chart rendering
- CMDK: Command palette functionality
- Embla Carousel: Carousel component

**Development Tools:**
- Replit-specific plugins for development banner, error overlay, and cartographer
- Custom Vite plugin for OpenGraph image meta tag injection
- ESBuild for optimized server bundling

**Production Build:**
- Client built with Vite to dist/public
- Server bundled with ESBuild to dist/index.cjs
- Selective dependency bundling to reduce cold start times
- Static file serving from Express

**Environment Configuration:**
- DATABASE_URL required for PostgreSQL connection
- OpenAI credentials for AI agent execution
- NODE_ENV switching between development (Vite middleware) and production (static serving)

### Agent Knowledge System

**Knowledge Storage:**
- pCloud integration for persistent knowledge document storage
- Agent-specific folder structure: `/BenchmarkingCouncil/<Agent>/<YYYY-MM>/`
- PostgreSQL database for metadata indexing and fast retrieval

**Database Tables for Knowledge:**
- `agent_knowledge_documents`: Stores document metadata, pCloud paths, tags, scores
- `agent_states`: Tracks agent performance metrics, specializations, learning progress
- `agent_learning_events`: Audit log of all learning activities

**Key Services:**
- `AgentKnowledgeService` (server/agent-knowledge.ts): Saves analysis results and patterns to pCloud + DB
- `CrossAgentRAGService`: Retrieves relevant prior knowledge across agents before analysis
- `AutonomyEngine` (server/autonomy-engine.ts): Proactive self-specialization and pattern detection

### Autonomy Engine

**Self-Learning Capabilities:**
1. **Pattern Detection**: Analyzes accumulated knowledge to identify common issues, industry trends, and best practices
2. **Performance Analysis**: Monitors agent consistency, scoring trends, and identifies weak areas
3. **Specialization Optimization**: Automatically recommends and applies specializations based on performance data

**API Endpoints:**
- `POST /api/autonomy/run-learning-cycle`: Triggers a full learning cycle
- `GET /api/autonomy/stats`: Returns engine statistics (patterns detected, agents optimized)
- `GET /api/autonomy/agent-performance`: Returns detailed performance metrics for all agents

**Integration Points:**
- Pattern extraction runs automatically after each agent analysis
- Agents retrieve prior knowledge via RAG before performing new analysis
- Learning metrics stored in agent_states table