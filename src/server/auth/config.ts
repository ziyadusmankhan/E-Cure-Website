import "server-only";
import { BackendError } from "../errors";
export type AuthPolicy = {
  mode: "local" | "live";
  url: string;
  publicKey: string;
  encryptionKey: string;
  origins: string[];
  secure: boolean;
  requireMfa: boolean;
  ipHeader: "none" | "cf-connecting-ip" | "x-real-ip";
};
const loopback = (host: string) => ["localhost", "127.0.0.1", "[::1]"].includes(host);
const parseUrl = (value: string) => {
  try {
    return new URL(value);
  } catch {
    throw new BackendError("CONFIGURATION");
  }
};
export function authPolicy(
  env: Record<string, string | undefined> = process.env,
): AuthPolicy | null {
  const mode = env.ADMIN_AUTH_MODE || "disabled";
  if (mode === "disabled") return null;
  if (mode !== "local" && mode !== "live") throw new BackendError("CONFIGURATION");
  const url = parseUrl(env.SUPABASE_URL || "https://invalid.example/");
  const publicKey = env.SUPABASE_PUBLISHABLE_KEY || "";
  const encryptionKey = env.ADMIN_SESSION_ENCRYPTION_KEY || "";
  const origins = (env.ADMIN_ALLOWED_ORIGINS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (
    !env.SUPABASE_URL ||
    !publicKey ||
    !/^[a-f0-9]{64}$/.test(encryptionKey) ||
    !origins.length ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    url.pathname !== "/" ||
    !["https:", "http:"].includes(url.protocol)
  )
    throw new BackendError("CONFIGURATION");
  if (
    mode === "local" &&
    (!loopback(url.hostname) || env.VERCEL_ENV === "production" || env.CONTEXT === "production")
  )
    throw new BackendError("CONFIGURATION");
  if (mode === "live" && (url.protocol !== "https:" || loopback(url.hostname)))
    throw new BackendError("CONFIGURATION");
  for (const value of origins) {
    const origin = parseUrl(value);
    if (
      origin.origin !== value ||
      origin.username ||
      origin.password ||
      (mode === "local"
        ? !loopback(origin.hostname) || !["http:", "https:"].includes(origin.protocol)
        : origin.protocol !== "https:" || loopback(origin.hostname))
    )
      throw new BackendError("CONFIGURATION");
  }
  const ipHeader = env.TRUSTED_CLIENT_IP_HEADER || "none";
  if (!["none", "cf-connecting-ip", "x-real-ip"].includes(ipHeader))
    throw new BackendError("CONFIGURATION");
  if (env.ADMIN_REQUIRE_MFA && !["true", "false"].includes(env.ADMIN_REQUIRE_MFA))
    throw new BackendError("CONFIGURATION");
  if (mode === "live" && env.ADMIN_REQUIRE_MFA === "false") throw new BackendError("CONFIGURATION");
  // Reject elevated legacy/API keys. This runtime never needs Auth admin access.
  if (publicKey.startsWith("sb_secret_")) throw new BackendError("CONFIGURATION");
  if (publicKey.split(".").length === 3) {
    try {
      if (JSON.parse(Buffer.from(publicKey.split(".")[1], "base64url").toString()).role !== "anon")
        throw new Error();
    } catch {
      throw new BackendError("CONFIGURATION");
    }
  } else if (!publicKey.startsWith("sb_publishable_")) throw new BackendError("CONFIGURATION");
  return {
    mode,
    url: url.origin,
    publicKey,
    encryptionKey,
    origins,
    secure: mode === "live" || origins.every((s) => s.startsWith("https:")),
    requireMfa: env.ADMIN_REQUIRE_MFA !== "false",
    ipHeader: ipHeader as AuthPolicy["ipHeader"],
  };
}
export const cookieName = (policy: AuthPolicy) =>
  policy.secure ? "__Host-healthcare-admin" : "healthcare-admin";
export const sessionHours = 8;
export const idleMinutes = 30;
export { safeAdminNext } from "@/lib/admin-navigation";
