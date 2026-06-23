import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 300_000,
  retries: 0,
  reporter: [["list"]],

  use: {
    headless: true,
    viewport: { width: 1920, height: 1080 },
    locale: "es-AR",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
