
import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function verifyDb() {
    console.log("Verifying tenant_id column existence...");
    try {
        // Check if the column exists in the 'users' table information schema
        const result = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'tenant_id';
    `);

        if (result.rows.length > 0) {
            console.log("SUCCESS: 'tenant_id' column found in 'users' table.");
        } else {
            console.error("FAILURE: 'tenant_id' column NOT found in 'users' table.");
            process.exit(1);
        }
    } catch (error) {
        console.error("Error verifying database:", error);
        process.exit(1);
    }
}

verifyDb().catch((err) => {
    console.error(err);
    process.exit(1);
});
