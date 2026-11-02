import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import postgres from "postgres";
import { openDatabase } from "../src/server/db/connection";
import { migrateDatabase } from "../src/server/db/migrate";
import { assertTestDatabase, connectionSettings } from "../src/server/env";
import { safeError } from "../src/server/errors";
import { startLocalPostgres } from "../scripts/local-postgres";

function runTests(env: NodeJS.ProcessEnv) {
  return new Promise<number>((done, reject) => {
    const child = spawn(
      process.execPath,
      ["node_modules/vitest/vitest.mjs", "run", "--config", "vitest.database.config.mts"],
      { env, stdio: "inherit", windowsHide: true },
    );
    child.on("error", reject);
    child.on("exit", (code) => done(code ?? 1));
  });
}
async function main() {
  mkdirSync(".db-results", { recursive: true });
  let serverUrl = process.env.TEST_DATABASE_SERVER_URL;
  let local: ReturnType<typeof startLocalPostgres> | undefined;
  const suffix = randomBytes(6).toString("hex");
  const names = [`healthcare_phase5_test_${suffix}`, `healthcare_isolation_test_${suffix}`];
  const appPassword = randomBytes(32).toString("hex");
  if (!serverUrl) {
    local = startLocalPostgres("test");
    serverUrl = local.url;
    console.log("Using an isolated workspace PostgreSQL cluster on loopback port 55432.");
  }
  const source = new URL(serverUrl);
  if (!["localhost", "127.0.0.1", "[::1]"].includes(source.hostname))
    throw new Error("Tests require a dedicated local PostgreSQL server.");
  const { url, ...options } = connectionSettings(serverUrl, "test");
  const maintenance = postgres(url, { ...options, onnotice: () => {} });
  const created: string[] = [];
  const migrations: ReturnType<typeof openDatabase>[] = [];
  let exitCode = 1;
  try {
    if (process.env.TEST_DATABASE_SERVER_URL) {
      const [role] = await maintenance`select 1 from pg_roles where rolname = 'healthcare_app'`;
      if (role)
        throw new Error(
          "Refusing to modify an existing application role on an external test server; use a fresh dedicated CI server.",
        );
    }
    const appUrls: string[] = [];
    for (const role of ["anon", "authenticated", "service_role"]) {
      const [existing] = await maintenance`select 1 from pg_roles where rolname = ${role}`;
      if (!existing) await maintenance.unsafe(`CREATE ROLE ${role} NOLOGIN`);
    }
    for (const name of names) {
      const target = new URL(serverUrl);
      target.pathname = `/${name}`;
      assertTestDatabase(target.toString(), [process.env.DATABASE_URL, process.env.DIRECT_URL]);
      await maintenance`create database ${maintenance(name)}`;
      created.push(name);
      const connection = openDatabase(target.toString(), "migration");
      migrations.push(connection);
      // Model Supabase's default API grants, then verify the security migration removes them.
      await connection.client.unsafe(
        "ALTER DEFAULT PRIVILEGES GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO anon, authenticated, service_role",
      );
      console.log(`Applying/replaying migrations on fresh test database ${name}.`);
      // Twice checks fresh migration and replay/idempotence using the real journal.
      await migrateDatabase(connection.db);
      await migrateDatabase(connection.db);
      target.username = "healthcare_app";
      target.password = appPassword;
      appUrls.push(target.toString());
    }
    // Only a freshly created CI role or our own isolated workspace role is changed.
    await maintenance.unsafe(`ALTER ROLE healthcare_app LOGIN PASSWORD '${appPassword}'`);
    exitCode = await runTests({
      ...process.env,
      NODE_ENV: "test",
      TEST_DATABASE_URL: appUrls[0],
      TEST_ISOLATION_DATABASE_URL: appUrls[1],
      TEST_MIGRATION_URL: new URL(`/${names[0]}`, serverUrl).toString(),
    });
    writeFileSync(
      ".db-results/summary.json",
      JSON.stringify(
        {
          passed: exitCode === 0,
          freshDatabases: 2,
          migrationReplays: 2,
          isolatedRuntimeRole: true,
          loopbackOnly: true,
        },
        null,
        2,
      ),
    );
  } finally {
    for (const connection of migrations) await connection.close();
    for (const name of created.reverse()) await maintenance`drop database ${maintenance(name)}`;
    await maintenance.end({ timeout: 5 });
    if (local?.started) local.stop();
  }
  process.exitCode = exitCode;
}
main().catch((error) => {
  // No driver errors, connection strings, query parameters or credentials in output.
  const diagnostics = [];
  let current: unknown = error;
  for (let depth = 0; depth < 4 && current instanceof Error; depth++) {
    diagnostics.push({
      name: current.name,
      message: current.message
        .replace(/postgres(?:ql)?:\/\/[^\s"'<>]+/gi, "[REDACTED_URL]")
        .replace(/PASSWORD\s+'[^']*'/gi, "PASSWORD '[REDACTED]'")
        .slice(0, 500),
    });
    current = current.cause;
  }
  writeFileSync(".db-results/failure.json", JSON.stringify(diagnostics, null, 2));
  const safe = safeError(error);
  console.error(
    `Database verification failed (${safe.code}). Check local PostgreSQL/PG_BIN and the protected local server log.`,
  );
  process.exitCode = 1;
});
