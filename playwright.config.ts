import { defineConfig } from "@playwright/test";

// UAT runs against the local dev stack by default. Set UAT_BASE_URL to the public
// Dokploy web URL to run the same suite against production.
const baseURL = process.env.UAT_BASE_URL ?? "http://localhost:3001";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 60_000,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL,
    // Uses the locally installed Google Chrome, so no browser download is needed.
    channel: "chrome",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: process.env.UAT_BASE_URL
    ? undefined
    : {
        command: "pnpm dev",
        url: "http://localhost:3001",
        reuseExistingServer: true,
        timeout: 120_000,
      },
});
