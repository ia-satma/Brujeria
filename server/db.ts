import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { sql } from "drizzle-orm";
import * as schema from "@shared/schema";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool, { schema });

/**
 * Activates Tenant Isolation for the current transaction.
 * This sets the 'app.current_tenant_id' which is used by Postgres RLS policies.
 */
export async function withTenantContext<T>(
  tenantId: string,
  callback: (tx: any) => Promise<T>
): Promise<T> {
  return await db.transaction(async (tx) => {
    await tx.execute(sql`SET LOCAL app.current_tenant = ${tenantId}`);
    return await callback(tx);
  });
}
