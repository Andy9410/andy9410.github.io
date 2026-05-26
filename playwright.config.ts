import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 120_000,
  retries: 0,
  reporter: [["list"], ["html", { open: "never" }]],

  use: {
    baseURL: "https://learnsoft.uy",
    headless: false,
    slowMo: 40,
    viewport: { width: 1440, height: 900 },
    video: "on",
    screenshot: "only-on-failure",
    locale: "es-AR",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
