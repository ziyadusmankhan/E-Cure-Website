import { defineConfig, devices } from "@playwright/test";
const database = process.env.QA_SUBMISSION_DB;
if (
  !database ||
  !/^\/healthcare_browser_test_[a-f0-9]+$/.test(new URL(database).pathname) ||
  !["127.0.0.1", "localhost"].includes(new URL(database).hostname) ||
  !process.env.QA_SUBMISSION_HMAC
)
  throw new Error("Use the isolated npm run test:submissions harness.");
export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: "submissions.spec.ts",
  workers: 1,
  timeout: 120_000,
  reporter: [["list"], ["html", { outputFolder: ".db-results/browser-report", open: "never" }]],
  outputDir: ".db-results/browser-results",
  use: {
    ...devices["Desktop Chrome"],
    baseURL: "http://127.0.0.1:3102",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "npm run start -- --port 3102",
    url: "http://127.0.0.1:3102",
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      DATABASE_URL: database,
      SUBMISSIONS_MODE: "local-test",
      ADMIN_AUTH_MODE: "disabled", CMS_MODE: "disabled",
      TURNSTILE_SITE_KEY: "1x00000000000000000000AA",
      TURNSTILE_SECRET_KEY: "1x0000000000000000000000000000000AA",
      SUBMISSIONS_HMAC_SECRET: process.env.QA_SUBMISSION_HMAC,
      SUBMISSION_ALLOWED_ORIGINS: "http://127.0.0.1:3102,http://localhost:3102",
      TRUSTED_CLIENT_IP_HEADER: "x-real-ip",
      NEXT_PUBLIC_SITE_PROFILE: "default",
      ENABLE_DESIGN_SYSTEM: "false",
      SITE_THEME: "",
    },
  },
});
