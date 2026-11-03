import { readFileSync } from "node:fs";
import { parseEnv } from "node:util";
import { randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import type { openDatabase } from "../src/server/db/connection";
import { totp } from "./totp";

export async function createAuthFixture(
  connection: ReturnType<typeof openDatabase>,
  suffix: string,
) {
  const local = parseEnv(readFileSync(".local/supabase/provisioning.env", "utf8"));
  const env = parseEnv(readFileSync(".env.local", "utf8"));
  const url = new URL(local.SUPABASE_URL || "");
  if (
    !["127.0.0.1", "localhost"].includes(url.hostname) ||
    env.SUPABASE_URL !== url.origin ||
    !local.SUPABASE_PROVISIONING_KEY ||
    !env.SUPABASE_PUBLISHABLE_KEY
  )
    throw new Error("Configure a running local Supabase Auth service before real Auth tests.");
  const options = {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: {
      fetch: (url: RequestInfo | URL, init?: RequestInit) =>
        fetch(url, { ...init, signal: AbortSignal.timeout(10000), cache: "no-store" as const }),
    },
  };
  const privileged = createClient(url.origin, local.SUPABASE_PROVISIONING_KEY, options);
  const ids: string[] = [];
  const values: Record<string, string> = {
    QA_AUTH_URL: url.origin,
    QA_AUTH_PUBLIC_KEY: env.SUPABASE_PUBLISHABLE_KEY,
    QA_AUTH_ENCRYPTION_KEY: randomBytes(32).toString("hex"),
  };
  const cleanup = async () => {
    let failed = false;
    for (const id of ids) {
      const { error } = await privileged.auth.admin.deleteUser(id);
      if (error) failed = true;
    }
    if (failed)
      throw new Error(
        "An ephemeral Auth test identity could not be removed; inspect the local test service before reusing it.",
      );
  };
  try {
    for (const label of ["OWNER", "RECEPTIONIST", "ENROLL", "OUTSIDER", "INACTIVE"] as const) {
      const email = `qa-${label.toLowerCase()}-${suffix}@example.com`;
      const password = `${randomBytes(24).toString("base64url")}aA1!`;
      const created = await privileged.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });
      if (created.data.user?.id) ids.push(created.data.user.id);
      if (created.error || !created.data.user?.email_confirmed_at)
        throw new Error("Could not create an ephemeral confirmed Auth test identity.");
      const id = created.data.user.id;
      values[`QA_AUTH_${label}_ID`] = id;
      values[`QA_AUTH_${label}_EMAIL`] = email;
      values[`QA_AUTH_${label}_PASSWORD`] = password;
      if (label !== "OUTSIDER") {
        await connection.client`insert into healthcare.administrative_users (user_id,role_key,active,auth_issuer) values (${id},${label === "RECEPTIONIST" ? "receptionist" : "owner"},${label !== "INACTIVE"},${url.origin + "/auth/v1"})`;
      }
      if (label === "OWNER" || label === "RECEPTIONIST") {
        const sdk = createClient(url.origin, env.SUPABASE_PUBLISHABLE_KEY, options);
        const signed = await sdk.auth.signInWithPassword({ email, password });
        if (signed.error) throw new Error("Local Auth fixture sign-in failed.");
        const enrolled = await sdk.auth.mfa.enroll({ factorType: "totp" });
        if (enrolled.error || enrolled.data.type !== "totp")
          throw new Error("Local Auth fixture enrollment failed.");
        values[`QA_AUTH_${label}_SECRET`] = enrolled.data.totp.secret;
        values[`QA_AUTH_${label}_FACTOR_ID`] = enrolled.data.id;
        const verified = await sdk.auth.mfa.challengeAndVerify({
          factorId: enrolled.data.id,
          code: totp(enrolled.data.totp.secret),
        });
        if (verified.error)
          throw new Error("Local Auth fixture MFA verification failed; check device/Docker time.");
        await sdk.auth.signOut({ scope: "local" });
      }
    }
    return { env: values, cleanup };
  } catch (error) {
    await cleanup();
    throw error;
  }
}
