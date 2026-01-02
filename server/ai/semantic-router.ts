import { type AgentName, type RAGContext, type RAGResult } from "../agent-knowledge";
import { getCrossAgentRAGService } from "../agent-knowledge";

/**
 * TSIP/1.0: Semantic Router
 * Optimizes token usage and manages branching between Cache, RAG, and LLM.
 */
export interface RouterDecision {
    source: 'CACHE' | 'RAG' | 'LLM_THINKING';
    tokensUsed: number;
    reason: string;
    payload?: any;
}

export class SemanticRouter {
    private ragService = getCrossAgentRAGService();
    private TOKEN_THRESHOLD = 1024; // Phase 1 Threshold

    /**
     * Estimates token count (rough heuristic: chars / 4)
     * In a production environment, this would use tiktoken.
     */
    private estimateTokens(text: string): number {
        return Math.ceil(text.length / 4);
    }

    /**
     * Analyzes an intent and decides the best path for resolution.
     */
    async route(
        agentName: AgentName,
        intent: string,
        context: RAGContext
    ): Promise<RouterDecision> {
        const tokens = this.estimateTokens(intent);

        // 1. Try RAG first for existing knowledge (Neon pgvector)
        const priorKnowledge = await this.ragService.retrieveRelevantKnowledge(agentName, context, 1);

        if (priorKnowledge.length > 0 && priorKnowledge[0].relevanceScore > 0.9) {
            return {
                source: 'CACHE',
                tokensUsed: tokens,
                reason: 'High-confidence match found in prior knowledge cache.',
                payload: priorKnowledge[0].document.content
            };
        }

        // 2. Branching based on context size
        if (tokens < this.TOKEN_THRESHOLD) {
            return {
                source: 'RAG',
                tokensUsed: tokens,
                reason: 'Context size below threshold, performing RAG-augmented lookup.',
                payload: await this.ragService.retrieveRelevantKnowledge(agentName, context, 5)
            };
        }

        // 3. Complex intent or large context -> Full LLM Thinking (Gemini 3 Pro)
        return {
            source: 'LLM_THINKING',
            tokensUsed: tokens,
            reason: 'Complex intent or large context requires full model reasoning.',
        };
    }

    /**
     * Generates a "Thought Signature" for deterministic context tracking.
     */
    generateThoughtSignature(intent: string, agentName: string): string {
        const input = `${agentName}:${intent.trim().toLowerCase()}`;
        // Simple hash for demo purposes
        let hash = 0;
        for (let i = 0; i < input.length; i++) {
            hash = (hash << 5) - hash + input.charCodeAt(i);
            hash |= 0;
        }
        return `sig_${Math.abs(hash).toString(16)}`;
    }
}

export const semanticRouter = new SemanticRouter();
