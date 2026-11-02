import "server-only";
import { site } from "@/config/site";
import type { SubmissionMode, SubmissionConfig } from "@/types/submission";
import { disabledSubmissions } from "@/types/submission";
import { getBackend } from "../backend";
import { BackendError } from "../errors";

export const testSiteKey = "1x00000000000000000000AA";
export const testSecretKey = "1x0000000000000000000000000000000AA";
export const loopbackHost = (host: string) => ["localhost", "127.0.0.1", "[::1]"].includes(host);
export type SubmissionPolicy = {
  mode: SubmissionMode;
  siteKey: string;
  secretKey: string;
  hmacSecret: string;
  origins: string[];
  ipHeader: "none" | "cf-connecting-ip" | "x-real-ip";
};
export function submissionPolicy(
  env: Record<string, string | undefined> = process.env,
): SubmissionPolicy {
  const mode = env.SUBMISSIONS_MODE || "disabled";
  if (mode === "disabled")
    return { mode, siteKey: "", secretKey: "", hmacSecret: "", origins: [], ipHeader: "none" };
  if (mode !== "local-test" && mode !== "live") throw new BackendError("CONFIGURATION");
  const {
    TURNSTILE_SITE_KEY: siteKey,
    TURNSTILE_SECRET_KEY: secretKey,
    SUBMISSIONS_HMAC_SECRET: hmacSecret,
  } = env;
  if (!siteKey || !secretKey || !hmacSecret || !/^[a-f0-9]{64}$/.test(hmacSecret))
    throw new BackendError("CONFIGURATION");
  const origins = (env.SUBMISSION_ALLOWED_ORIGINS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (!origins.length) throw new BackendError("CONFIGURATION");
  for (const value of origins) {
    let url: URL;
    try {
      url = new URL(value);
    } catch {
      throw new BackendError("CONFIGURATION");
    }
    if (
      url.origin !== value ||
      url.username ||
      url.password ||
      !["http:", "https:"].includes(url.protocol)
    )
      throw new BackendError("CONFIGURATION");
    if (mode === "local-test" && !loopbackHost(url.hostname))
      throw new BackendError("CONFIGURATION");
    if (mode === "live" && (url.protocol !== "https:" || loopbackHost(url.hostname)))
      throw new BackendError("CONFIGURATION");
  }
  if (
    mode === "local-test" &&
    (siteKey !== testSiteKey ||
      secretKey !== testSecretKey ||
      env.VERCEL_ENV === "production" ||
      env.CONTEXT === "production")
  )
    throw new BackendError("CONFIGURATION");
  if (
    mode === "live" &&
    (/^[123]x0+/.test(siteKey) || /^[123]x0+/.test(secretKey) || site.fixture || site.demo)
  )
    throw new BackendError("CONFIGURATION");
  const ipHeader = env.TRUSTED_CLIENT_IP_HEADER || "none";
  if (!["none", "cf-connecting-ip", "x-real-ip"].includes(ipHeader))
    throw new BackendError("CONFIGURATION");
  return {
    mode,
    siteKey,
    secretKey,
    hmacSecret,
    origins,
    ipHeader: ipHeader as SubmissionPolicy["ipHeader"],
  };
}
export async function submissionPageConfig(): Promise<SubmissionConfig> {
  let policy: SubmissionPolicy;
  try {
    policy = submissionPolicy();
  } catch {
    return {
      ...disabledSubmissions,
      enabled: true,
      unavailable: true,
      localTest: process.env.SUBMISSIONS_MODE === "local-test",
    };
  }
  if (policy.mode === "disabled") return disabledSubmissions;
  const base = {
    ...disabledSubmissions,
    enabled: true,
    localTest: policy.mode === "local-test",
    siteKey: policy.siteKey,
  };
  try {
    const backend = await getBackend();
    const [settings, active] = await Promise.all([
      backend.catalog.getSettings(),
      backend.catalog.listPublishedServices(),
    ]);
    if (!settings) throw new BackendError("CONFIGURATION");
    new Intl.DateTimeFormat("en", { timeZone: settings.timezone });
    return { ...base, timezone: settings.timezone, serviceSlugs: active.map((s) => s.slug) };
  } catch {
    return { ...base, unavailable: true };
  }
}
