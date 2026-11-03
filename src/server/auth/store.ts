import "server-only";
import { randomBytes } from "node:crypto";
import { and, eq, sql } from "drizzle-orm";
import { site } from "@/config/site";
import {
  rolePermissions,
  type AdminIdentity,
  type AdminPermission,
  type AdminRole,
} from "@/types/admin-auth";
import type { Database, Transaction } from "../db/connection";
import {
  administrativeUsers,
  administrativeSessions,
  businessSettings,
  auditEvents,
} from "../db/schema";
import { BackendError, operation } from "../errors";
import { sessionHash, seal, unseal, type ProviderTokens } from "./crypto";
import { sessionHours, idleMinutes, type AuthPolicy } from "./config";
import type { AuthProvider, ProviderIdentity } from "./provider";

const rawSession = (value: string | undefined) => {
  if (!value || !/^[a-f0-9]{64}$/.test(value)) throw new BackendError("UNAUTHENTICATED");
  return sessionHash(value);
};
export function authStore(
  db: Database,
  policy: AuthPolicy,
  provider: AuthProvider,
  clock = () => new Date(),
) {
  async function deployment(tx: Database | Transaction) {
    const [business] = await tx
      .select({ profileId: businessSettings.profileId })
      .from(businessSettings)
      .where(eq(businessSettings.id, 1));
    if (business?.profileId !== site.id) throw new BackendError("CONFIGURATION");
  }
  async function member(tx: Database | Transaction, userId: string) {
    const [row] = await tx
      .select()
      .from(administrativeUsers)
      .where(
        and(
          eq(administrativeUsers.userId, userId),
          eq(administrativeUsers.authIssuer, `${policy.url}/auth/v1`),
          eq(administrativeUsers.active, true),
        ),
      );
    if (!row || !["owner", "receptionist"].includes(row.roleKey))
      throw new BackendError("UNAUTHENTICATED");
    return row.roleKey as AdminRole;
  }
  const audit = (
    tx: Transaction,
    userId: string,
    key: string,
    action: "signed_in" | "signed_out" | "mfa_verified",
  ) =>
    tx
      .insert(auditEvents)
      .values({
        actorId: userId,
        entityType: "administration",
        entityId: key,
        action,
        metadata: { source: "authentication" },
      });
  type Result = {
    principal: AdminIdentity;
    factors: ProviderIdentity["factors"];
    enrollment?: { id: string; qrCode: string; secret: string };
    error?: BackendError;
  };
  async function session(
    raw: string | undefined,
    action?: { enroll: true } | { factorId: string; code: string },
  ): Promise<Result> {
    const keyHash = rawSession(raw);
    return operation(() =>
      db.transaction(async (tx) => {
        await tx.execute(
          sql`select set_config('lock_timeout', '10000', true), set_config('statement_timeout', '15000', true)`,
        );
        await deployment(tx);
        const [row] = await tx
          .select()
          .from(administrativeSessions)
          .where(eq(administrativeSessions.keyHash, keyHash))
          .for("update");
        const now = clock();
        if (
          !row ||
          row.expiresAt <= now ||
          row.lastSeenAt.valueOf() + idleMinutes * 60000 <= now.valueOf()
        )
          throw new BackendError("UNAUTHENTICATED");
        const role = await member(tx, row.userId);
        let tokens = unseal(row.encryptedTokens, policy.encryptionKey, keyHash);
        if (tokens.expires_at * 1000 <= now.valueOf() + 60000)
          tokens = await provider.refresh(tokens);
        let identity = await provider.verify(tokens);
        if (identity.userId !== row.userId) throw new BackendError("UNAUTHENTICATED");
        if (
          policy.requireMfa &&
          identity.aal !== "aal2" &&
          row.createdAt.valueOf() + 10 * 60000 <= now.valueOf()
        )
          throw new BackendError("UNAUTHENTICATED");
        let enrollment: Result["enrollment"];
        let failure: BackendError | undefined;
        if (action) {
          try {
            if ("enroll" in action) enrollment = await provider.enroll(tokens);
            else {
              if (!identity.factors.some((f) => f.id === action.factorId))
                throw new BackendError("VERIFICATION_FAILED");
              const upgraded = await provider.verifyMfa(tokens, action.factorId, action.code);
              const verified = await provider.verify(upgraded);
              if (
                verified.userId !== row.userId ||
                verified.aal !== "aal2" ||
                !verified.factors.some((f) => f.status === "verified")
              )
                throw new BackendError("VERIFICATION_FAILED");
              tokens = upgraded;
              identity = verified;
              await audit(tx, row.userId, keyHash, "mfa_verified");
            }
          } catch (error) {
            // Commit a legitimate refresh even when an entered MFA code fails.
            if (error instanceof BackendError) failure = error;
            else throw error;
          }
        }
        await tx
          .update(administrativeSessions)
          .set({ encryptedTokens: seal(tokens, policy.encryptionKey, keyHash), lastSeenAt: now })
          .where(eq(administrativeSessions.keyHash, keyHash));
        return {
          principal: {
            userId: row.userId,
            role,
            aal: identity.aal,
            expiresAt: row.expiresAt.toISOString(),
          },
          factors: identity.factors,
          enrollment,
          error: failure,
        };
      }),
    );
  }
  return {
    async signIn(email: string, password: string, previous?: string) {
      await operation(() => deployment(db));
      const tokens = await provider.signIn(email, password);
      let verified: ProviderIdentity;
      try {
        verified = await provider.verify(tokens);
        await member(db, verified.userId);
      } catch (error) {
        try {
          await provider.signOut(tokens);
        } catch {}
        if (error instanceof BackendError && error.code === "UNAUTHENTICATED")
          throw new BackendError("LOGIN_FAILED");
        throw error;
      }
      const raw = randomBytes(32).toString("hex");
      const keyHash = sessionHash(raw);
      const now = clock();
      const expiresAt = new Date(now.valueOf() + sessionHours * 3600000);
      try {
        await operation(() =>
          db.transaction(async (tx) => {
            await deployment(tx);
            await member(tx, verified.userId);
            if (previous && /^[a-f0-9]{64}$/.test(previous))
              await tx
                .delete(administrativeSessions)
                .where(eq(administrativeSessions.keyHash, sessionHash(previous)));
            await tx.execute(
              sql`delete from healthcare.administrative_sessions where key_hash in (select key_hash from healthcare.administrative_sessions where expires_at < now() limit 100)`,
            );
            await tx
              .insert(administrativeSessions)
              .values({
                keyHash,
                userId: verified.userId,
                encryptedTokens: seal(tokens, policy.encryptionKey, keyHash),
                createdAt: now,
                lastSeenAt: now,
                expiresAt,
              });
            await audit(tx, verified.userId, keyHash, "signed_in");
          }),
        );
      } catch (error) {
        try {
          await provider.signOut(tokens);
        } catch {}
        throw error;
      }
      return {
        raw,
        needsMfa:
          policy.requireMfa &&
          (verified.aal !== "aal2" || !verified.factors.some((f) => f.status === "verified")),
      };
    },
    async authorize(raw: string | undefined, permission?: AdminPermission, requireMfa = true) {
      const result = await session(raw);
      if (
        requireMfa &&
        policy.requireMfa &&
        (result.principal.aal !== "aal2" || !result.factors.some((f) => f.status === "verified"))
      )
        throw new BackendError("MFA_REQUIRED");
      if (permission && !rolePermissions[result.principal.role].includes(permission))
        throw new BackendError("FORBIDDEN");
      return { principal: result.principal, factors: result.factors };
    },
    async enroll(raw: string | undefined) {
      const result = await session(raw, { enroll: true });
      if (result.error) throw result.error;
      if (!result.enrollment) throw new BackendError("UNAVAILABLE");
      return result.enrollment;
    },
    async verifyMfa(raw: string | undefined, factorId: string, code: string) {
      const result = await session(raw, { factorId, code });
      if (result.error) throw result.error;
      return result.principal;
    },
    async signOut(raw: string | undefined) {
      if (!raw || !/^[a-f0-9]{64}$/.test(raw)) return;
      const keyHash = sessionHash(raw);
      let tokens: ProviderTokens | undefined;
      await operation(() =>
        db.transaction(async (tx) => {
          const [row] = await tx
            .select()
            .from(administrativeSessions)
            .where(eq(administrativeSessions.keyHash, keyHash))
            .for("update");
          if (!row) return;
          try {
            tokens = unseal(row.encryptedTokens, policy.encryptionKey, keyHash);
          } catch {}
          await tx
            .delete(administrativeSessions)
            .where(eq(administrativeSessions.keyHash, keyHash));
          await audit(tx, row.userId, keyHash, "signed_out");
        }),
      );
      // Local revocation commits first: copied cookies cannot regain access even
      // if the provider is unavailable or its JWT has not expired yet.
      if (tokens) {
        try {
          await provider.signOut(tokens);
        } catch {}
      }
    },
  };
}
