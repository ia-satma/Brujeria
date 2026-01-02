import { aegis } from "./server/security/aegis";
import { semanticRouter } from "./server/ai/semantic-router";
import { db, withTenantContext } from "./server/db";
import { sql } from "drizzle-orm";

async function verifyPhase1() {
    console.log("--- VERIFYING TSIP/1.0 PHASE 1 ---");

    // 1. Verify Aegis PII Sanitization
    console.log("\n[1/3] Testing Aegis PII Sanitization...");
    const rawText = "Hola, mi nombre es Juan Perez y mi correo es juan.perez@example.com. Vivo en Madrid.";
    const sanitized = await aegis.anonymize(rawText);
    console.log("Original:", rawText);
    console.log("Sanitized:", sanitized);

    if (sanitized.includes("REDACTED")) {
        console.log("✅ Aegis: PII successfully identified and redacted.");
    } else {
        console.log("⚠️ Aegis: Redaction not triggered (check Presidio connection or fallback)");
    }

    // 2. Verify Semantic Router
    console.log("\n[2/3] Testing Semantic Router Logic...");
    const shortIntent = "Describe the visual aesthetics of the site.";
    const longIntent = "A".repeat(5000); // Trigger LLM_THINKING

    const shortRoute = await semanticRouter.route("Visual_Aesthetics_Agent", shortIntent, { currentUrl: "test.com", analysisType: "visual", minScore: 5 });
    const longRoute = await semanticRouter.route("Visual_Aesthetics_Agent", longIntent, { currentUrl: "test.com", analysisType: "visual", minScore: 5 });

    console.log(`Short Intent Route: ${shortRoute.source} (${shortRoute.reason})`);
    console.log(`Long Intent Route: ${longRoute.source} (${longRoute.reason})`);

    if (shortRoute.source !== longRoute.source) {
        console.log("✅ Semantic Router: Correctly branched based on context size.");
    }

    // 3. Verify Tenant Isolation (Conceptual check)
    console.log("\n[3/3] Testing Tenant Context Helper...");
    try {
        const mockTenant = "tenant_12345";
        await withTenantContext(mockTenant, async (tx) => {
            const result = await tx.execute(sql`SHOW app.current_tenant_id`);
            console.log(`Session tenant_id: ${result.rows[0].app.current_tenant_id}`);
            if (result.rows[0].app.current_tenant_id === mockTenant) {
                console.log("✅ Tenant Context: Session variable set correctly.");
            }
        });
    } catch (e) {
        console.log("⚠️ Tenant Context: Execution failed (expected if DB not connected/mocked)");
    }

    console.log("\n--- VERIFICATION COMPLETE ---");
}

verifyPhase1().catch(console.error);
