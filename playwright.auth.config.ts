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
  testMatch: "auth.spec.ts",
  workers: 1,
  timeout: 120000,
  reporter: [["list"], ["html", { outputFolder: ".db-results/auth-report", open: "never" }]],
  outputDir: ".db-results/auth-results",
  use: {
    ...devices["Desktop Chrome"],
    baseURL: "http://127.0.0.1:3103",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "npm run start -- --port 3103",
    url: "http://127.0.0.1:3103",
    reuseExistingServer: false,
    timeout: 120000,
    env: {
      DATABASE_URL: database,
      ADMIN_AUTH_MODE: "local",
      SUPABASE_URL: process.env.QA_AUTH_URL,
      SUPABASE_PUBLISHABLE_KEY: process.env.QA_AUTH_PUBLIC_KEY!,
      ADMIN_SESSION_ENCRYPTION_KEY: process.env.QA_AUTH_ENCRYPTION_KEY,
      ADMIN_ALLOWED_ORIGINS: "http://127.0.0.1:3103",
      ADMIN_REQUIRE_MFA: "true",
      SUBMISSIONS_MODE: "disabled",
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
