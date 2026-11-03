import { beforeAll, beforeEach, afterAll, describe, it, expect, vi } from "vitest";
import { randomBytes, randomUUID } from "node:crypto";
import { NextRequest } from "next/server";
import { openDatabase } from "../../src/server/db/connection";
import { seedDemoProfile } from "../../src/server/db/fixtures";
import { assertTestDatabase } from "../../src/server/env";
import { authStore } from "../../src/server/auth/store";
import { authPolicy, safeAdminNext, type AuthPolicy } from "../../src/server/auth/config";
import { seal, unseal, sessionHash, type ProviderTokens } from "../../src/server/auth/crypto";
import { handleAuth, handleAdminRead } from "../../src/server/auth/http";
import type { AuthProvider, ProviderIdentity } from "../../src/server/auth/provider";
import { BackendError } from "../../src/server/errors";
import { totp } from "../../qa/totp";

assertTestDatabase(process.env.TEST_AUTH_DATABASE_URL, [
  process.env.DATABASE_URL,
  process.env.DIRECT_URL,
]);
assertTestDatabase(process.env.TEST_AUTH_MIGRATION_URL, [
  process.env.DATABASE_URL,
  process.env.DIRECT_URL,
]);
const app = openDatabase(process.env.TEST_AUTH_DATABASE_URL);
const admin = openDatabase(process.env.TEST_AUTH_MIGRATION_URL, "migration");
const owner = randomUUID(),
  receptionist = randomUUID(),
  unknown = randomUUID(),
  factorId = randomUUID();
const issuer = "http://127.0.0.1:54321/auth/v1";
const policy: AuthPolicy = {
  mode: "local",
  url: "http://127.0.0.1:54321",
  publicKey: "sb_publishable_controlled_test",
  encryptionKey: randomBytes(32).toString("hex"),
  origins: ["http://127.0.0.1:3103"],
  secure: false,
  requireMfa: true,
  ipHeader: "none",
};
let provider: AuthProvider;
let tokens: ProviderTokens;
let identity: ProviderIdentity;
let store: ReturnType<typeof authStore>;
const request = (
  path: string,
  value: unknown,
  cookie?: string,
  headers: Record<string, string> = {},
) =>
  new NextRequest(`http://127.0.0.1:3103${path}`, {
    method: "POST",
    headers: {
      origin: policy.origins[0],
      "content-type": "application/json",
      ...(cookie ? { cookie: `healthcare-admin=${cookie}` } : {}),
      ...headers,
    },
    body: JSON.stringify(value),
  });
const read = (cookie?: string) =>
  new NextRequest("http://127.0.0.1:3103/api/admin/permissions", {
    headers: cookie ? { cookie: `healthcare-admin=${cookie}` } : {},
  });

beforeAll(async () => {
  await seedDemoProfile(admin.db, "default");
  await admin.client`insert into healthcare.administrative_users (user_id,role_key,active,auth_issuer) values (${owner},'owner',true,${issuer}),(${receptionist},'receptionist',true,${issuer})`;
});
beforeEach(async () => {
  await admin.client`truncate healthcare.administrative_sessions, healthcare.submission_limits`;
  await admin.client`update healthcare.administrative_users set active=true,auth_issuer=${issuer},role_key=case when user_id=${owner} then 'owner' else 'receptionist' end`;
  tokens = {
    access_token: "CONTROLLED_ACCESS_SECRET",
    refresh_token: "CONTROLLED_REFRESH_SECRET",
    expires_at: Math.floor(Date.now() / 1000) + 1200,
  };
  identity = { userId: owner, aal: "aal2", factors: [{ id: factorId, status: "verified" }] };
  provider = {
    signIn: vi.fn(async () => tokens),
    verify: vi.fn(async () => identity),
    refresh: vi.fn(async () => ({ ...tokens, expires_at: Math.floor(Date.now() / 1000) + 3600 })),
    signOut: vi.fn(async () => {}),
    enroll: vi.fn(async () => ({
      id: factorId,
      qrCode: "data:image/svg+xml;utf-8,<svg/>",
      secret: "CONTROLLED_TOTP_SECRET",
    })),
    verifyMfa: vi.fn(async () => {
      identity = { ...identity, aal: "aal2", factors: [{ id: factorId, status: "verified" }] };
      return tokens;
    }),
  };
  store = authStore(app.db, policy, provider);
});
afterAll(async () => {
  await Promise.all([app.close(), admin.close()]);
});

describe("private administrative sessions with a controlled Auth provider", () => {
  it("stores only a cookie hash and authenticated encrypted provider tokens", async () => {
    const login = await store.signIn("fictional-owner@example.com", "fictional password");
    const [row] = await app.client`select * from healthcare.administrative_sessions`;
    expect(row.key_hash).toBe(sessionHash(login.raw));
    expect(JSON.stringify(row)).not.toContain(login.raw);
    expect(JSON.stringify(row)).not.toContain(tokens.access_token);
    expect(JSON.stringify(row)).not.toContain(tokens.refresh_token);
    expect(unseal(row.encrypted_tokens, policy.encryptionKey, row.key_hash)).toEqual(tokens);
    expect((await store.authorize(login.raw, "access:read")).principal.role).toBe("owner");
  });
  it("rejects unknown, inactive and differently bound Auth identities", async () => {
    identity = { ...identity, userId: unknown };
    await expect(store.signIn("unknown@example.com", "example")).rejects.toMatchObject({
      code: "LOGIN_FAILED",
    });
    identity = { ...identity, userId: owner };
    await admin.client`update healthcare.administrative_users set active=false where user_id=${owner}`;
    await expect(store.signIn("inactive@example.com", "example")).rejects.toMatchObject({
      code: "LOGIN_FAILED",
    });
    await admin.client`update healthcare.administrative_users set active=true,auth_issuer='https://different.example/auth/v1' where user_id=${owner}`;
    await expect(store.signIn("wrong-project@example.com", "example")).rejects.toMatchObject({
      code: "LOGIN_FAILED",
    });
    expect(await app.client`select * from healthcare.administrative_sessions`).toHaveLength(0);
  });
  it("does not accept fabricated cookies, user IDs or JWT-shaped cookie values", async () => {
    for (const raw of [
      undefined,
      owner,
      "eyJhbGciOiJub25lIn0.eyJyb2xlIjoib3duZXIifQ.",
      randomBytes(32).toString("hex"),
    ])
      await expect(store.authorize(raw)).rejects.toMatchObject({ code: "UNAUTHENTICATED" });
    expect(provider.verify).not.toHaveBeenCalled();
  });
  it("refreshes role/activation from the database for every authorized request", async () => {
    const login = await store.signIn("role@example.com", "example");
    await admin.client`update healthcare.administrative_users set role_key='receptionist' where user_id=${owner}`;
    await expect(store.authorize(login.raw, "access:read")).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    expect((await store.authorize(login.raw, "workspace:read")).principal.role).toBe(
      "receptionist",
    );
    await admin.client`update healthcare.administrative_users set active=false where user_id=${owner}`;
    await expect(store.authorize(login.raw)).rejects.toMatchObject({ code: "UNAUTHENTICATED" });
  });
  it("ends idle and absolute sessions even if the Auth access token is valid", async () => {
    const now = new Date();
    const login = await authStore(app.db, policy, provider, () => now).signIn(
      "expiry@example.com",
      "example",
    );
    for (const elapsed of [31 * 60000, 8 * 3600000 + 1])
      await expect(
        authStore(app.db, policy, provider, () => new Date(now.valueOf() + elapsed)).authorize(
          login.raw,
        ),
      ).rejects.toMatchObject({ code: "UNAUTHENTICATED" });
    expect(provider.refresh).not.toHaveBeenCalled();
  });
  it("serializes concurrent refreshes and persists the new token pair", async () => {
    tokens.expires_at = Math.floor(Date.now() / 1000) + 30;
    const login = await store.signIn("refresh@example.com", "example");
    await Promise.all([store.authorize(login.raw), store.authorize(login.raw)]);
    expect(provider.refresh).toHaveBeenCalledTimes(1);
    const [row] = await app.client`select * from healthcare.administrative_sessions`;
    expect(
      unseal(row.encrypted_tokens, policy.encryptionKey, row.key_hash).expires_at,
    ).toBeGreaterThan(tokens.expires_at);
  });
  it("fails closed when provider identity changes or is unavailable", async () => {
    const login = await store.signIn("provider@example.com", "example");
    identity = { ...identity, userId: unknown };
    await expect(store.authorize(login.raw)).rejects.toMatchObject({ code: "UNAUTHENTICATED" });
    vi.mocked(provider.verify).mockRejectedValue(new BackendError("UNAVAILABLE"));
    await expect(store.authorize(login.raw)).rejects.toMatchObject({ code: "UNAVAILABLE" });
    expect(await app.client`select * from healthcare.administrative_sessions`).toHaveLength(1);
  });
  it("revokes copied cookies immediately on logout even if provider logout fails", async () => {
    const login = await store.signIn("logout@example.com", "example");
    vi.mocked(provider.signOut).mockRejectedValue(new BackendError("UNAVAILABLE"));
    await store.signOut(login.raw);
    await expect(store.authorize(login.raw)).rejects.toMatchObject({ code: "UNAUTHENTICATED" });
    const [audit] =
      await app.client`select action,metadata from healthcare.audit_events where entity_id=${sessionHash(login.raw)} and action='signed_out'`;
    expect(audit.metadata).toEqual({ source: "authentication" });
  });
  it("requires MFA server-side and limits pending sessions to ten minutes", async () => {
    identity = { ...identity, aal: "aal1", factors: [] };
    const now = new Date();
    const login = await authStore(app.db, policy, provider, () => now).signIn(
      "mfa@example.com",
      "example",
    );
    expect(login.needsMfa).toBe(true);
    await expect(store.authorize(login.raw)).rejects.toMatchObject({ code: "MFA_REQUIRED" });
    expect((await store.authorize(login.raw, undefined, false)).principal.aal).toBe("aal1");
    await expect(
      authStore(app.db, policy, provider, () => new Date(now.valueOf() + 11 * 60000)).authorize(
        login.raw,
      ),
    ).rejects.toMatchObject({ code: "UNAUTHENTICATED" });
  });
  it("upgrades MFA only for a factor belonging to the verified account", async () => {
    identity = { ...identity, aal: "aal1", factors: [{ id: factorId, status: "unverified" }] };
    const login = await store.signIn("factor@example.com", "example");
    await expect(store.verifyMfa(login.raw, randomUUID(), "123456")).rejects.toMatchObject({
      code: "VERIFICATION_FAILED",
    });
    expect(provider.verifyMfa).not.toHaveBeenCalled();
    await store.verifyMfa(login.raw, factorId, "123456");
    expect((await store.authorize(login.raw)).principal.aal).toBe("aal2");
    const rows =
      await app.client`select metadata from healthcare.audit_events where entity_id=${sessionHash(login.raw)} and action='mfa_verified'`;
    expect(rows).toHaveLength(1);
  });
  it("rejects a stale aal2 token if its verified factor has been removed", async () => {
    const login = await store.signIn("removed-factor@example.com", "example");
    identity = { ...identity, factors: [] };
    await expect(store.authorize(login.raw)).rejects.toMatchObject({ code: "MFA_REQUIRED" });
  });
  it("rolls back session creation if its audit fails", async () => {
    await admin.client.unsafe(
      "CREATE FUNCTION healthcare.qa_auth_failure() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'PRIVATE_AUTH_SENTINEL'; END $$; CREATE TRIGGER qa_auth_failure BEFORE INSERT ON healthcare.audit_events FOR EACH ROW EXECUTE FUNCTION healthcare.qa_auth_failure();",
    );
    try {
      const response = await handleAuth(
        request("/api/auth/login", { email: "rollback@example.com", password: "example" }),
        "login",
        { db: app.db, policy, provider },
      );
      expect(response.status).toBe(500);
      expect(await response.text()).not.toContain("PRIVATE_AUTH_SENTINEL");
      expect(await app.client`select * from healthcare.administrative_sessions`).toHaveLength(0);
      expect(provider.signOut).toHaveBeenCalled();
    } finally {
      await admin.client.unsafe(
        "DROP TRIGGER qa_auth_failure ON healthcare.audit_events; DROP FUNCTION healthcare.qa_auth_failure();",
      );
    }
  });
  it("keeps sessions private and prevents runtime role provisioning", async () => {
    const [table] =
      await admin.client`select rowsecurity from pg_tables where schemaname='healthcare' and tablename='administrative_sessions'`;
    expect(table.rowsecurity).toBe(true);
    for (const role of ["anon", "authenticated", "service_role"])
      expect(
        (
          await admin.client`select has_table_privilege(${role},'healthcare.administrative_sessions','SELECT') as allowed`
        )[0].allowed,
      ).toBe(false);
    await expect(
      app.client`update healthcare.administrative_users set role_key='owner'`,
    ).rejects.toMatchObject({ code: "42501" });
  });
});
describe("authentication HTTP boundary", () => {
  it("sets HttpOnly/SameSite cookies and limits redirect destinations", async () => {
    const response = await handleAuth(
      request("/api/auth/login", {
        email: "cookie@example.com",
        password: "example",
        next: "https://evil.example",
      }),
      "login",
      { db: app.db, policy, provider },
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ next: "/admin" });
    expect(response.headers.get("set-cookie")).toContain("HttpOnly");
    expect(response.headers.get("set-cookie")).toContain("SameSite=strict");
    expect(response.headers.get("cache-control")).toContain("no-store");
    for (const value of [
      "//evil.example",
      "/admin/../external",
      "/admin?next=//evil",
      "/admin/login",
      "/admin\\evil",
      "%2f%2fevil",
    ])
      expect(safeAdminNext(value)).toBe("/admin");
    expect(safeAdminNext("/admin/access")).toBe("/admin/access");
  });
  it("enforces Owner permissions on direct API calls independently of the UI", async () => {
    const login = await store.signIn("owner-api@example.com", "example");
    expect(
      (await handleAdminRead(read(login.raw), "access:read", { db: app.db, policy, provider }))
        .status,
    ).toBe(200);
    await admin.client`update healthcare.administrative_users set role_key='receptionist' where user_id=${owner}`;
    expect(
      (await handleAdminRead(read(login.raw), "access:read", { db: app.db, policy, provider }))
        .status,
    ).toBe(403);
    expect(
      (await handleAdminRead(read(login.raw), "workspace:read", { db: app.db, policy, provider }))
        .status,
    ).toBe(200);
    expect(
      (await handleAdminRead(read(), "workspace:read", { db: app.db, policy, provider })).status,
    ).toBe(401);
  });
  it("rejects cross-origin writes, oversized bodies and unrecognized input", async () => {
    const deps = { db: app.db, policy, provider };
    expect(
      (
        await handleAuth(
          request("/api/auth/login", {}, undefined, { origin: "https://evil.example" }),
          "login",
          deps,
        )
      ).status,
    ).toBe(403);
    expect(
      (
        await handleAuth(
          request("/api/auth/login", { email: "a@example.com", password: "x", role: "owner" }),
          "login",
          deps,
        )
      ).status,
    ).toBe(422);
    expect(
      (await handleAuth(request("/api/auth/login", { extra: "x".repeat(9000) }), "login", deps))
        .status,
    ).toBe(413);
    expect(provider.signIn).not.toHaveBeenCalled();
  });
  it("rate limits failed logins durably without trusting forwarding headers", async () => {
    vi.mocked(provider.signIn).mockRejectedValue(new BackendError("LOGIN_FAILED"));
    for (let i = 0; i < 6; i++) {
      const response = await handleAuth(
        request("/api/auth/login", { email: "limited@example.com", password: "wrong" }, undefined, {
          "x-forwarded-for": `192.0.2.${i}`,
        }),
        "login",
        { db: app.db, policy, provider },
      );
      expect(response.status).toBe(i < 5 ? 401 : 429);
      if (i === 5) expect(Number(response.headers.get("retry-after"))).toBeGreaterThan(0);
    }
    expect(provider.signIn).toHaveBeenCalledTimes(5);
    const rows = await app.client`select * from healthcare.submission_limits`;
    expect(JSON.stringify(rows)).not.toContain("limited@example.com");
  });
});
describe("authentication cryptography/configuration", () => {
  it("uses a test authenticator generator matching the RFC 6238 SHA-1 vector", () => {
    expect(totp("GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ", 59000)).toBe("287082");
  });
  it("rejects changed ciphertext, wrong keys and cross-session token swaps", () => {
    const encrypted = seal(tokens, policy.encryptionKey, "one-session");
    expect(unseal(encrypted, policy.encryptionKey, "one-session")).toEqual(tokens);
    for (const [value, key, binding] of [
      [encrypted + "x", policy.encryptionKey, "one-session"],
      [encrypted, randomBytes(32).toString("hex"), "one-session"],
      [encrypted, policy.encryptionKey, "other-session"],
    ])
      expect(() => unseal(value, key, binding)).toThrow();
  });
  it("requires explicit local config and disallows elevated keys, public local mode or live MFA bypass", () => {
    expect(authPolicy({})).toBeNull();
    const env = {
      ADMIN_AUTH_MODE: "local",
      SUPABASE_URL: policy.url,
      SUPABASE_PUBLISHABLE_KEY: policy.publicKey,
      ADMIN_SESSION_ENCRYPTION_KEY: policy.encryptionKey,
      ADMIN_ALLOWED_ORIGINS: policy.origins[0],
    };
    expect(authPolicy(env)?.requireMfa).toBe(true);
    for (const change of [
      { VERCEL_ENV: "production" },
      { SUPABASE_URL: "https://external.example" },
      { SUPABASE_PUBLISHABLE_KEY: "sb_secret_private" },
      { ADMIN_ALLOWED_ORIGINS: "https://external.example" },
      { ADMIN_SESSION_ENCRYPTION_KEY: "weak" },
      {
        ADMIN_AUTH_MODE: "live",
        SUPABASE_URL: "https://auth.example",
        ADMIN_ALLOWED_ORIGINS: "https://app.example",
        ADMIN_REQUIRE_MFA: "false",
      },
    ])
      expect(() => authPolicy({ ...env, ...change })).toThrow();
  });
});
