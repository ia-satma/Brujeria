# AGENTS.md - Proyecto ia-satma/Brujeria

## Misión
Construir una plataforma SaaS agéntica industrial utilizando el protocolo TSIP/1.0. El sistema debe ser seguro por diseño (Secure by Design) y económicamente eficiente.

## Stack Tecnológico (Estricto)
- **Core**: Node.js (TypeScript), FastMCP.
- **Datos**: Neon PostgreSQL (Serverless) con pgvector.
- **ORM**: Drizzle ORM.
- **IA**: Google Gemini 3 Pro (Thinking) + Semantic Router.
- **Frontend**: React, Tailwind CSS, Shadcn/UI (FSD Architecture).

## Protocolos Activos
1. **Semantic Router**: Antes de consultar al LLM, verificar si la respuesta está en caché o si se puede resolver con RAG simple (Neon).
2. **Aegis Middleware**: Todo input debe pasar por sanitización PII (Presidio) antes de tocar el LLM.
