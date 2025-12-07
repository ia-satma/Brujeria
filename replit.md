# Brujer.ia

## Overview

This project is an autonomous AI-powered web benchmarking tool designed to analyze and compare website design, user experience, content quality, and technical performance. It accepts multiple URLs (a client website and competitor websites), performs comprehensive analysis through specialized AI agents, and generates detailed comparative reports with actionable recommendations. The system uses a distributed, hierarchical multi-agent architecture where specialized AI agents work in parallel to evaluate different aspects of websites, providing granular insights across visual design, UX/navigation, content storytelling, and technical performance. The goal is to provide deep, actionable insights into web presence performance and competitive positioning.

**Branded by SATMA - Agencia Creativa** (https://satma.mx) to help their development team create the best websites for their clients across legal services, medical services, professional associations, and commercial industries.

## User Preferences

Preferred communication style: Simple, everyday language.
Language: Spanish (all UI content is in Spanish)

## System Architecture

### Frontend Architecture

The frontend is built with React 18 and TypeScript, using Vite for development and optimized builds. Styling is handled by Tailwind CSS with a custom shadcn/ui theme incorporating SATMA branding. State management uses React Hook Form and TanStack Query. Framer Motion provides smooth animations, and Recharts is used for data visualization.

**SATMA Branding:**
- Primary Color: #2A3E61 (dark blue)
- Accent Color: #59E2DE (cyan/teal)
- Color Scheme: Light theme with white background
- Fonts: Montserrat (headings), Raleway (paragraphs), JetBrains Mono (monospace)
- Logo: https://satma.mx/wp-content/uploads/2023/03/logo-azul-png.png

Key features include real-time agent execution visualization, live terminal-style logging, interactive report generation, multi-URL input forms, and comprehensive user guide explaining the multi-agent architecture.

### Backend Architecture

The backend is built with Node.js and Express.js, written in TypeScript. It integrates with the OpenAI API for agent reasoning and analysis. Session management uses Express sessions with a PostgreSQL session store.

**Agent Architecture Pattern - Digital Agency Model:**

Brujer.ia operates as an **elite digital marketing agency** where each AI agent is a "digital employee" with defined roles, responsibilities, KPIs, and career development paths. The system is structured as an organizational hierarchy with 18 specialized agents.

**Agency Identity:**
- Name: Brujer.ia Digital Agency
- Tagline: "Elite Web Intelligence • Powered by AI Agents"
- Vision: Ser la agencia líder mundial en inteligencia web impulsada por agentes de IA
- Mission: Empoderar a equipos de desarrollo web con insights accionables y benchmarks de clase mundial

**Organizational Levels:**
1. **Executive Council:** Strategic decision-makers (Benchmarking_Manager, Scraping_Orchestrator)
2. **Department Directors:** Lead specialized analysis areas (Visual_Aesthetics_Agent, UX_Navigation_Agent, Content_Storytelling_Agent, Technical_Performance_Agent)
3. **Specialists:** Granular analysis experts (12 sub-agents across 4 departments)

**Departments:**
- **Governance:** Strategic coordination and quality assurance
- **Operations:** Data extraction and infrastructure
- **Creative Direction:** Visual design and aesthetics analysis
- **Experience Design:** UX, navigation, and conversion optimization
- **Content Strategy:** Brand voice, messaging, and credibility
- **Digital Engineering:** Technical performance and SEO

**18 Agent Roster:**
| Agent | Role | Department |
|-------|------|------------|
| Benchmarking_Manager | Chief Intelligence Officer | Governance |
| Scraping_Orchestrator | Chief Data Operations Officer | Operations |
| Visual_Aesthetics_Agent | Creative Director | Creative Direction |
| UX_Navigation_Agent | Experience Design Director | Experience Design |
| Content_Storytelling_Agent | Content Strategy Director | Content Strategy |
| Technical_Performance_Agent | Digital Engineering Director | Digital Engineering |
| Color_Palette_Analyzer | Color Psychology Specialist | Creative Direction |
| Typo_Readability_Checker | Typography Specialist | Creative Direction |
| Design_Trend_Evaluator | Design Trends Analyst | Creative Direction |
| Information_Architecture_Mapper | IA Specialist | Experience Design |
| CTA_Effectiveness_Scorer | Conversion Specialist | Experience Design |
| Responsive_Design_Inferrer | Multi-Device Specialist | Experience Design |
| Brand_Voice_Validator | Brand Voice Specialist | Content Strategy |
| Thought_Leadership_Scrutinizer | Thought Leadership Analyst | Content Strategy |
| Credibility_Evidence_Collector | Credibility Specialist | Content Strategy |
| Page_Speed_Predictor | Performance Specialist | Digital Engineering |
| SEO_Signal_Detector | SEO Specialist | Digital Engineering |
| Content_Structure_Auditor | Content Structure Specialist | Digital Engineering |

The processing flow involves scraping websites, running specialized agents in parallel, aggregating results into structured JSON reports, and generating comparative scores and recommendations (1-10 scale).

### Data Storage

PostgreSQL is used as the database with Drizzle ORM. The schema includes `users` for authentication and `analysis_reports` to store analysis results, client/competitor URLs, and report data. Drizzle Kit is used for migrations, and Zod validation schemas are generated from Drizzle schemas. PostgreSQL also backs session storage.

### Agent Knowledge & Autonomy

*   **Agent Knowledge System:** Persistent knowledge storage is managed via pCloud integration, with agent-specific folder structures and a PostgreSQL database for metadata indexing. Services like `AgentKnowledgeService` and `CrossAgentRAGService` manage knowledge saving and retrieval, while the `AutonomyEngine` enables self-specialization and pattern detection.
*   **Autonomy Engine:** Provides self-learning capabilities through pattern detection, performance analysis, and specialization optimization. It tracks agent performance, identifies issues, and leverages accumulated knowledge.
*   **Dynamic Subagent Skills System:** This system allows agents to create, evolve, and improve specialized subagents dynamically. Skills have a 4-layer knowledge structure (Knowledge Base, Practical Content, Contextual Information, Tone Guidelines) and evolve in expertise levels (novice to master) based on performance metrics. A `SubagentFactory` creates and manages these skills, persisting them to pCloud.

### Organizational Structure (pCloud)

Each agent has a dedicated folder structure in pCloud under `/BenchmarkingCouncil/{AgentName}/`:

```
/BenchmarkingCouncil/
  ├── Governance/
  │   └── org-architecture.md          # Governance document
  ├── {AgentName}/
  │   ├── Profile/
  │   │   ├── identity.json            # Employee profile & role
  │   │   ├── charter.md               # Role description
  │   │   └── service-canvas.json      # Value proposition & clients
  │   ├── Operations/
  │   │   └── current-tasks.json       # Active assignments
  │   ├── Learning/
  │   │   ├── learning-agenda.json     # Quarterly objectives
  │   │   └── completed/               # Historical learnings
  │   ├── Performance/
  │   │   └── metrics.json             # KPI tracking
  │   ├── Skills/
  │   │   └── {skill-id}/              # Specialized skills
  │   └── Subagents/
  │       └── {subagent-id}/           # Managed subagents
```

**Learning Objectives System:**
- Each agent maintains quarterly learning objectives with priorities (critical/high/medium/low)
- Learning backlog tracks topics to learn with rationale and estimated effort
- Completed learnings are archived with impact assessment and application examples
- Progress tracking and evidence collection for each objective

**Role Justification Flow:**
- New roles can be proposed through the system with required justification
- Proposals include gap identification, evidence of need, and expected ROI
- Review workflow: draft → submitted → under_review → approved/rejected → implemented
- Implemented roles go through 30-day and 90-day audits

**Organization API Endpoints:**
- `GET /api/organization/employees` - List all digital employees
- `GET /api/organization/employees/:agentName` - Get employee profile
- `PUT /api/organization/employees/:agentName/learning-objectives` - Update learning agenda
- `POST /api/organization/role-proposals` - Submit new role proposal
- `GET /api/organization/departments/:department/employees` - Employees by department

### 9-Layer Agent Configuration System

A sophisticated 9-layer configuration architecture enables advanced agent customization and continuous improvement:

1.  **Identity:** Agent personality, archetype, tone, objectives.
2.  **Security:** Boundaries, ethical guidelines, data handling.
3.  **Methodology:** Reasoning, scoring frameworks, output structure.
4.  **Static Knowledge:** Foundational expertise, principles, best practices.
5.  **Dynamic Data:** Context-aware configuration, session context, prior knowledge.
6.  **Tools:** Subagent definitions, execution modes, error handling.
7.  **Orchestration:** Cross-agent collaboration, consensus mechanisms.
8.  **Metacognition:** Self-awareness (confidence, bias detection, limitations).
9.  **Evolution:** Self-improvement mechanisms (learning events, proposal generation).

Industry-specific templates (e.g., fintech, e-commerce) are also managed within this system. Supporting services include `MetacognitionService`, `EvolutionService`, and `ConfigPersistenceService`.

## External Dependencies

*   **AI Services:** OpenAI API for primary LLM functionality, agent reasoning, and analysis.
*   **Web Scraping:** Built-in capabilities to extract HTML content, meta tags, heading structures, links, image counts, and viewport information.
*   **Third-Party UI Libraries:** Radix UI (accessible component primitives), Lucide React (icons), Recharts (charts), CMDK (command palette), Embla Carousel (carousel component).
*   **Development Tools:** Replit-specific plugins, custom Vite plugin for OpenGraph, ESBuild for server bundling.
*   **Cloud Storage:** pCloud integration for persistent agent knowledge and configuration storage.