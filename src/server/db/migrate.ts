import "server-only";
import { resolve } from "node:path";
import { sql } from "drizzle-orm";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { readMigrationFiles } from "drizzle-orm/migrator";
import type { Database } from "./connection";

export async function migrateDatabase(db: Database) {
  // Migration connections have max:1 and must use direct/session mode. Drizzle
  // owns the migration transaction; nesting its migrator inside one is unsupported.
  await db.execute(sql`select pg_advisory_lock(510005)`);
  try {
    const config = { migrationsFolder: resolve("drizzle"), migrationsSchema: "drizzle" };
    const [journal] = await db.execute(
      sql`select to_regclass('drizzle.__drizzle_migrations') as name`,
    );
    if (journal?.name) {
      const files = readMigrationFiles(config);
      const applied = await db.execute(
        sql`select hash, created_at from drizzle.__drizzle_migrations`,
      );
      if (
        applied.some(
          (row) =>
            !files.some(
              (file) => file.folderMillis === Number(row.created_at) && file.hash === row.hash,
            ),
        )
      )
        throw new Error("Applied migration history does not match the versioned migration files.");
    }
    await migrate(db, config);
  } finally {
    await db.execute(sql`select pg_advisory_unlock(510005)`);
  }
}
