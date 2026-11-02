import { loadEnvConfig } from "@next/env";
import { sql } from "drizzle-orm";
import { openDatabase } from "../src/server/db/connection";
import { migrateDatabase } from "../src/server/db/migrate";
import { seedDemoProfile } from "../src/server/db/fixtures";
import { safeError } from "../src/server/errors";

loadEnvConfig(process.cwd());
async function main() {
  const action = process.argv[2];
  if (!["check", "migrate", "seed"].includes(action))
    throw new Error("Unsupported database action.");
  const connection = openDatabase(
    action === "migrate" ? process.env.DIRECT_URL : process.env.DATABASE_URL,
    action === "migrate" ? "migration" : "runtime",
  );
  try {
    if (action === "migrate") {
      await migrateDatabase(connection.db);
      console.log("Versioned database migrations applied successfully.");
    } else if (action === "seed") {
      if (process.env.ALLOW_DEMO_SEED !== "true" || process.env.NODE_ENV === "production")
        throw new Error("Demo fixtures are disabled.");
      const result = await seedDemoProfile(
        connection.db,
        process.env.NEXT_PUBLIC_SITE_PROFILE ?? "default",
      );
      console.log(
        `Demo profile seeded: ${result.profile}; ${result.services} enabled services. Existing content retained.`,
      );
    } else {
      const result = await connection.db.execute(
        sql`select current_user as role, current_database() is not null as connected`,
      );
      if (result[0]?.role !== "healthcare_app" || !result[0]?.connected)
        throw new Error("Unexpected runtime role.");
      await connection.db.execute(sql`select id from healthcare.business_settings limit 1`);
      console.log("Database connected; restricted application role and migrated schema verified.");
    }
  } finally {
    await connection.close();
  }
}
main().catch((error) => {
  const safe = safeError(error);
  console.error(`${safe.code}: ${safe.message}`);
  process.exitCode = 1;
});
