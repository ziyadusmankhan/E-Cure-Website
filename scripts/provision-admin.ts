import { readFileSync } from "node:fs";
import { parseEnv } from "node:util";
import { loadEnvConfig } from "@next/env";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { eq, sql } from "drizzle-orm";
import { site } from "../src/config/site";
import { authPolicy } from "../src/server/auth/config";
import { openDatabase } from "../src/server/db/connection";
import {
  administrativeUsers,
  administrativeSessions,
  businessSettings,
  auditEvents,
} from "../src/server/db/schema";
import { startLocalPostgres } from "./local-postgres";

loadEnvConfig(process.cwd());
async function main() {
  const args = process.argv.slice(2);
  if (
    args.length !== 6 ||
    args[0] !== "--user-id" ||
    args[2] !== "--role" ||
    args[4] !== "--active"
  )
    throw new Error("Use --user-id UUID --role owner|receptionist --active true|false.");
  const userId = z.uuid().parse(args[1]);
  const role = z.enum(["owner", "receptionist"]).parse(args[3]);
  const active = z.enum(["true", "false"]).parse(args[5]) === "true";
  const policy = authPolicy();
  if (!policy) throw new Error("Configure authentication first.");
  const privateEnv =
    policy.mode === "local"
      ? parseEnv(readFileSync(".local/supabase/provisioning.env", "utf8"))
      : process.env;
  if (privateEnv.SUPABASE_URL !== policy.url || !privateEnv.SUPABASE_PROVISIONING_KEY)
    throw new Error(
      "A matching provisioning credential is required outside the runtime environment.",
    );
  const provider = createClient(policy.url, privateEnv.SUPABASE_PROVISIONING_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (url, init) =>
        fetch(url, { ...init, cache: "no-store", signal: AbortSignal.timeout(10000) }),
    },
  });
  if (active) {
    const { data, error } = await provider.auth.admin.getUserById(userId);
    if (error || !data.user?.email_confirmed_at || data.user.is_anonymous)
      throw new Error("An existing verified non-anonymous Supabase identity is required.");
  }
  let ownerUrl = process.env.DIRECT_URL;
  if (policy.mode === "local") {
    const local = await startLocalPostgres("development");
    const url = new URL(local.url);
    url.pathname = "/healthcare_development";
    ownerUrl = url.toString();
  }
  const connection = openDatabase(ownerUrl, "migration");
  try {
    await connection.db.transaction(async (tx) => {
      await tx.execute(sql`select pg_advisory_xact_lock(710007)`);
      const [business] = await tx.select().from(businessSettings).where(eq(businessSettings.id, 1));
      if (business?.profileId !== site.id)
        throw new Error("The database identity does not match this deployment.");
      const owners = await tx
        .select()
        .from(administrativeUsers)
        .where(sql`role_key='owner' and active=true and auth_issuer=${`${policy.url}/auth/v1`}`);
      if (owners.length === 1 && owners[0].userId === userId && (!active || role !== "owner"))
        throw new Error("Refusing to deactivate or demote the last active Owner.");
      await tx
        .insert(administrativeUsers)
        .values({ userId, roleKey: role, active, authIssuer: `${policy.url}/auth/v1` })
        .onConflictDoUpdate({
          target: administrativeUsers.userId,
          set: { roleKey: role, active, authIssuer: `${policy.url}/auth/v1` },
        });
      await tx.delete(administrativeSessions).where(eq(administrativeSessions.userId, userId));
      await tx
        .insert(auditEvents)
        .values({
          actorId: null,
          entityType: "administration",
          entityId: userId,
          action: "updated",
          metadata: { source: "authentication" },
        });
    });
    console.log(
      `Verified staff mapping saved with role ${role}, active=${active}. Existing application sessions for that identity were revoked. No password or provider credential was printed.`,
    );
  } finally {
    await connection.close();
  }
}
main().catch((error) => {
  // Provider/driver errors may contain query arguments or credentials: never print them.
  console.error(
    error instanceof Error &&
      [
        "Use --user-id UUID --role owner|receptionist --active true|false.",
        "Configure authentication first.",
        "Refusing to deactivate or demote the last active Owner.",
      ].includes(error.message)
      ? error.message
      : "Staff provisioning failed. Check the verified identity, matching local Auth configuration, migration status and protected provisioning credential.",
  );
  process.exitCode = 1;
});
