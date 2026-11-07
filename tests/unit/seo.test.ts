import { afterEach, beforeEach, expect, it, vi } from "vitest";

const { requestHeaders } = vi.hoisted(() => ({ requestHeaders: vi.fn() }));

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({ headers: requestHeaders }));

beforeEach(() => {
  vi.resetModules();
  vi.stubEnv("NEXT_PUBLIC_SITE_PROFILE", "default");
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", undefined);
  vi.stubEnv("SITE_INDEXING_ENABLED", undefined);
  vi.stubEnv("VERCEL_ENV", undefined);
  requestHeaders.mockReset();
  requestHeaders.mockResolvedValue(new Headers({ host: "www.ecurehomes.com" }));
});

afterEach(() => vi.unstubAllEnvs());

it("keeps indexing off by default and enables it only after opt-in", async () => {
  const { isIndexableRequest } = await import("@/server/seo");
  expect(await isIndexableRequest()).toBe(false);
  vi.stubEnv("SITE_INDEXING_ENABLED", "true");
  expect(await isIndexableRequest()).toBe(true);
});

it("keeps alias hosts and preview deployments out of indexing", async () => {
  const { isIndexableRequest } = await import("@/server/seo");
  vi.stubEnv("SITE_INDEXING_ENABLED", "true");
  for (const host of ["ecurehomes.com", "e-cure-website.vercel.app", "localhost:3000"]) {
    requestHeaders.mockResolvedValue(new Headers({ host, "x-forwarded-host": "www.ecurehomes.com" }));
    expect(await isIndexableRequest()).toBe(false);
  }
  requestHeaders.mockResolvedValue(new Headers({ host: "www.ecurehomes.com" }));
  vi.stubEnv("VERCEL_ENV", "preview");
  expect(await isIndexableRequest()).toBe(false);
});

it.each([
  ["general-clinic", "https://www.ecurehomes.com"],
  ["default", "https://e-cure-website.vercel.app"],
])("requires the E-Cure profile and its configured canonical origin (%s, %s)", async (profile, url) => {
  vi.stubEnv("NEXT_PUBLIC_SITE_PROFILE", profile);
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", url);
  vi.stubEnv("SITE_INDEXING_ENABLED", "true");
  const { isIndexableRequest } = await import("@/server/seo");
  expect(await isIndexableRequest()).toBe(false);
});
