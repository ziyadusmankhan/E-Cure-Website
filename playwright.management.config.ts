import { defineConfig, devices } from "@playwright/test";
const database = process.env.QA_SUBMISSION_DB;
if (
  !database ||
  !/^\/healthcare_browser_test_[a-f0-9]+$/.test(new URL(database).pathname) ||
  !process.env.QA_AUTH_URL ||
  !process.env.QA_AUTH_ENCRYPTION_KEY
)
  throw new Error("Use the isolated npm run test:auth harness with running local Supabase.");
const privateFixtureEnv = Object.fromEntries(
  Object.keys(process.env)
    .filter((k) => /^QA_AUTH_.*(PASSWORD|SECRET|EMAIL|ID)$/.test(k))
    .map((k) => [k, ""]),
);
export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: "management.spec.ts",
  workers: 1,
  timeout: 120000,
  expect: { timeout: 15000 },
  reporter: [["list"], ["html", { outputFolder: ".db-results/management-report", open: "never" }]],
  outputDir: ".db-results/management-results",
  use: {
    ...devices["Desktop Chrome"],
    baseURL: "http://127.0.0.1:3104",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "npm run start -- --port 3104",
    url: "http://127.0.0.1:3104",
    reuseExistingServer: false,
    timeout: 120000,
    env: {
      DATABASE_URL: database,
      ADMIN_AUTH_MODE: "local",
      CMS_MODE: "database",
      SUPABASE_URL: process.env.QA_AUTH_URL,
      SUPABASE_PUBLISHABLE_KEY: process.env.QA_AUTH_PUBLIC_KEY!,
      ADMIN_SESSION_ENCRYPTION_KEY: process.env.QA_AUTH_ENCRYPTION_KEY,
      ADMIN_ALLOWED_ORIGINS: "http://127.0.0.1:3104",
      ADMIN_REQUIRE_MFA: "true",
      SUBMISSIONS_MODE: "local-test",
      TURNSTILE_SITE_KEY: "1x00000000000000000000AA",
      TURNSTILE_SECRET_KEY: "1x0000000000000000000000000000000AA",
      SUBMISSIONS_HMAC_SECRET: process.env.QA_SUBMISSION_HMAC!,
      SUBMISSION_ALLOWED_ORIGINS: "http://127.0.0.1:3104",
      TRUSTED_CLIENT_IP_HEADER: "none",
      NEXT_PUBLIC_SITE_PROFILE: "default",
      ENABLE_DESIGN_SYSTEM: "false",
      SITE_THEME: "",
      DIRECT_URL: "",
      SUPABASE_PROVISIONING_KEY: "",
      SUPABASE_SECRET_KEY: "",
      SUPABASE_SERVICE_ROLE_KEY: "",
      ...privateFixtureEnv,
    },
  },
});
