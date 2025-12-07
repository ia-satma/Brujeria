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

**Agent Architecture Pattern:**

The system employs a hierarchical multi-agent architecture:

*   **Orchestrator Layer:** `Benchmarking_Manager` (main coordinator) and `Scraping_Orchestrator`.
*   **Specialized Analyst Agents:** `Visual_Aesthetics_Agent`, `UX_Navigation_Agent`, `Content_Storytelling_Agent`, and `Technical_Performance_Agent` work in parallel.
*   **Sub-Agents:** Each analyst agent delegates to specialized sub-agents for granular analysis.

The processing flow involves scraping websites, running specialized agents in parallel, aggregating results into structured JSON reports, and generating comparative scores and recommendations (1-10 scale).

### Data Storage

PostgreSQL is used as the database with Drizzle ORM. The schema includes `users` for authentication and `analysis_reports` to store analysis results, client/competitor URLs, and report data. Drizzle Kit is used for migrations, and Zod validation schemas are generated from Drizzle schemas. PostgreSQL also backs session storage.

### Agent Knowledge & Autonomy

*   **Agent Knowledge System:** Persistent knowledge storage is managed via pCloud integration, with agent-specific folder structures and a PostgreSQL database for metadata indexing. Services like `AgentKnowledgeService` and `CrossAgentRAGService` manage knowledge saving and retrieval, while the `AutonomyEngine` enables self-specialization and pattern detection.
*   **Autonomy Engine:** Provides self-learning capabilities through pattern detection, performance analysis, and specialization optimization. It tracks agent performance, identifies issues, and leverages accumulated knowledge.
*   **Dynamic Subagent Skills System:** This system allows agents to create, evolve, and improve specialized subagents dynamically. Skills have a 4-layer knowledge structure (Knowledge Base, Practical Content, Contextual Information, Tone Guidelines) and evolve in expertise levels (novice to master) based on performance metrics. A `SubagentFactory` creates and manages these skills, persisting them to pCloud.

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