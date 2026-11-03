import { defineConfig, devices } from "@playwright/test";
const id = process.env.NEXT_PUBLIC_SITE_PROFILE;
if (!id || !["general-clinic", "home-care", "physiotherapy-center"].includes(id))
  throw new Error("Use npm run test:profiles to verify fictional deployments.");
export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: "profiles.spec.ts",
  workers: 1,
  timeout: 120_000,
  reporter: [["list"], ["html", { outputFolder: `.profile-results/${id}/report`, open: "never" }]],
  outputDir: `.profile-results/${id}/results`,
  use: {
    ...devices["Desktop Chrome"],
    baseURL: "http://127.0.0.1:3200",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "npm run start -- --port 3200",
    url: "http://127.0.0.1:3200",
    reuseExistingServer: false,
    timeout: 120_000,
    env: { SUBMISSIONS_MODE: "disabled", ADMIN_AUTH_MODE: "disabled" },
  },
});
