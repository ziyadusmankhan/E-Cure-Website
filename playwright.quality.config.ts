import { defineConfig, devices } from "@playwright/test";
import base from "./playwright.config";

// Run the complete public suite against the same production build in all three
// engines. Authenticated and submission suites retain their isolated harnesses.
export default defineConfig({
  ...base,
  timeout: 120_000,
  outputDir: ".local/ecure-stage5/browser-results",
  reporter: [
    ["list"],
    ["json", { outputFile: ".local/ecure-stage5/browser-results.json" }],
    ["html", { outputFolder: ".local/ecure-stage5/browser-report", open: "never" }],
  ],
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],
  webServer: {
    command: "npm run start -- --port 3100",
    url: "http://127.0.0.1:3100",
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      SUBMISSIONS_MODE: "disabled",
      ADMIN_AUTH_MODE: "disabled",
      CMS_MODE: "disabled",
    },
  },
});
