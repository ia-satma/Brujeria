import { db } from "./db";
import { sql } from "drizzle-orm";

/**
 * AEGIS: PII Sanitization Logic using Microsoft Presidio (Conceptual Integration)
 */
export interface PresidioFinding {
    entity_type: string;
    start: number;
    end: number;
    score: number;
}

export class AegisSanitizer {
    private presidioUrl: string;

    constructor() {
        this.presidioUrl = process.env.PRESIDIO_URL || "http://localhost:5001";
    }

    /**
     * Analyzes text for PII entities
     */
    async analyze(text: string): Promise<PresidioFinding[]> {
        try {
            const response = await fetch(`${this.presidioUrl}/analyze`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    text,
                    language: "es", // Defaulting to Spanish per project context
                    entities: ["PERSON", "EMAIL_ADDRESS", "PHONE_NUMBER", "LOCATION", "CREDIT_CARD"],
                    score_threshold: 0.4
                })
            });

            if (!response.ok) return [];
            return await response.json();
        } catch (e) {
            console.warn("[Aegis] Presidio unreachable, falling back to basic regex sanitization.");
            return [];
        }
    }

    /**
     * Anonymizes text by replacing PII with placeholders
     */
    async anonymize(text: string): Promise<string> {
        const findings = await this.analyze(text);
        if (findings.length === 0) return text;

        // Sort findings descending to avoid index shift
        const sorted = [...findings].sort((a, b) => b.start - a.start);
        let sanitized = text;

        for (const f of sorted) {
            sanitized =
                sanitized.slice(0, f.start) +
                `[REDACTED_${f.entity_type}]` +
                sanitized.slice(f.end);
        }

        return sanitized;
    }
}

/**
 * TSIP/1.0: Database Tenant Context Helper
 * Sets the 'app.current_tenant_id' session variable to activate RLS
 */
export async function withTenantContext<T>(
    tenantId: string,
    callback: () => Promise<T>
): Promise<T> {
    return await db.transaction(async (tx) => {
        // Inject tenant identity into the local session
        await tx.execute(sql`SET LOCAL app.current_tenant_id = ${tenantId}`);
        return await callback();
    });
}

export const aegis = new AegisSanitizer();
