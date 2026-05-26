import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 300_000,
  retries: 0,
  reporter: [["list"]],

  use: {
    baseURL: "https://learnsoft.uy",
    headless: true,
    viewport: { width: 1440, height: 900 },
    locale: "es-AR",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
