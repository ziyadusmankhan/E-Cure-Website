import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { AuthPolicy } from "./config";
import type { ProviderTokens } from "./crypto";
import { BackendError } from "../errors";

export type ProviderIdentity = {
  userId: string;
  aal: "aal1" | "aal2";
  factors: { id: string; status: "verified" | "unverified" }[];
};
export type AuthProvider = {
  signIn(email: string, password: string): Promise<ProviderTokens>;
  refresh(tokens: ProviderTokens): Promise<ProviderTokens>;
  verify(tokens: ProviderTokens): Promise<ProviderIdentity>;
  signOut(tokens: ProviderTokens): Promise<void>;
  enroll(tokens: ProviderTokens): Promise<{ id: string; qrCode: string; secret: string }>;
  verifyMfa(tokens: ProviderTokens, factorId: string, code: string): Promise<ProviderTokens>;
};
const tokenData = (
  session: {
    access_token: string;
    refresh_token: string;
    expires_at?: number;
    expires_in?: number;
  } | null,
): ProviderTokens => {
  const expiresAt =
    session?.expires_at ??
    (session?.expires_in ? Math.floor(Date.now() / 1000) + session.expires_in : undefined);
  if (!session?.access_token || !session.refresh_token || !expiresAt || !Number.isFinite(expiresAt))
    throw new BackendError("UNAUTHENTICATED");
  return {
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_at: expiresAt,
  };
};
function providerError(
  error: { status?: number; name?: string } | null,
  code: "LOGIN_FAILED" | "UNAUTHENTICATED" | "VERIFICATION_FAILED",
) {
  if (!error) return;
  if (error.status === 429) throw new BackendError("RATE_LIMITED", 60);
  if ((error.status ?? 0) >= 500 || error.name === "AuthRetryableFetchError")
    throw new BackendError("UNAVAILABLE");
  throw new BackendError(code);
}
export function supabaseAuthProvider(policy: AuthPolicy): AuthProvider {
  const client = () =>
    createClient(policy.url, policy.publicKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      global: {
        fetch: (url, init) =>
          fetch(url, {
            ...init,
            cache: "no-store",
            redirect: "error",
            signal: init?.signal
              ? AbortSignal.any([init.signal, AbortSignal.timeout(8000)])
              : AbortSignal.timeout(8000),
          }),
      },
    });
  const withSession = async (tokens: ProviderTokens): Promise<SupabaseClient> => {
    const sdk = client();
    const { error } = await sdk.auth.setSession(tokens);
    providerError(error, "UNAUTHENTICATED");
    return sdk;
  };
  return {
    async signIn(email, password) {
      const { data, error } = await client().auth.signInWithPassword({ email, password });
      providerError(error, "LOGIN_FAILED");
      return tokenData(data.session);
    },
    async refresh(tokens) {
      const { data, error } = await client().auth.refreshSession({
        refresh_token: tokens.refresh_token,
      });
      providerError(error, "UNAUTHENTICATED");
      return tokenData(data.session);
    },
    async verify(tokens) {
      const sdk = client();
      const claims = await sdk.auth.getClaims(tokens.access_token);
      providerError(claims.error, "UNAUTHENTICATED");
      const parsed = z
        .object({
          sub: z.uuid(),
          session_id: z.uuid(),
          aal: z.enum(["aal1", "aal2"]).default("aal1"),
          iss: z.literal(`${policy.url}/auth/v1`),
          exp: z.number(),
          aud: z.union([
            z.literal("authenticated"),
            z.array(z.string()).refine((a) => a.includes("authenticated")),
          ]),
        })
        .safeParse(claims.data?.claims);
      if (!parsed.success || parsed.data.exp * 1000 <= Date.now())
        throw new BackendError("UNAUTHENTICATED");
      const { data, error } = await sdk.auth.getUser(tokens.access_token);
      providerError(error, "UNAUTHENTICATED");
      if (
        !data.user ||
        data.user.id !== parsed.data.sub ||
        !data.user.email_confirmed_at ||
        data.user.is_anonymous
      )
        throw new BackendError("UNAUTHENTICATED");
      return {
        userId: data.user.id,
        aal: parsed.data.aal,
        factors: (data.user.factors || [])
          .filter((f) => f.factor_type === "totp")
          .map((f) => ({ id: f.id, status: f.status })),
      };
    },
    async signOut(tokens) {
      const sdk = await withSession(tokens);
      const { error } = await sdk.auth.signOut({ scope: "local" });
      providerError(error, "UNAUTHENTICATED");
    },
    async enroll(tokens) {
      const sdk = await withSession(tokens);
      const { data: user, error: userError } = await sdk.auth.getUser();
      providerError(userError, "UNAUTHENTICATED");
      const factors = user.user?.factors || [];
      // Existing verified factors must be challenged, never replaced during aal1 setup.
      if (factors.some((f) => f.status === "verified")) throw new BackendError("FORBIDDEN");
      for (const factor of factors.filter(
        (f) => f.status === "unverified" && f.factor_type === "totp",
      )) {
        const { error } = await sdk.auth.mfa.unenroll({ factorId: factor.id });
        providerError(error, "VERIFICATION_FAILED");
      }
      const { data, error } = await sdk.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "Staff authenticator",
      });
      providerError(error, "VERIFICATION_FAILED");
      if (!data || data.type !== "totp") throw new BackendError("UNAVAILABLE");
      return { id: data.id, qrCode: data.totp.qr_code, secret: data.totp.secret };
    },
    async verifyMfa(tokens, factorId, code) {
      const sdk = await withSession(tokens);
      const { data, error } = await sdk.auth.mfa.challengeAndVerify({ factorId, code });
      providerError(error, "VERIFICATION_FAILED");
      if (!data) throw new BackendError("VERIFICATION_FAILED");
      return tokenData(data);
    },
  };
}
