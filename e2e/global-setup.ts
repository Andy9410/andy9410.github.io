import { existsSync } from "node:fs";
import { chromium } from "@playwright/test";

const STORAGE_STATE_PATH = "e2e/auth.json";
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? "https://learnsoft.uy";

async function hasValidStoredSession() {
  if (!existsSync(STORAGE_STATE_PATH)) return false;

  const browser = await chromium.launch();
  const context = await browser.newContext({ storageState: STORAGE_STATE_PATH });
  const page = await context.newPage();

  try {
    await page.goto(`${BASE_URL}/chat`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1_000);
    return !/\/login/i.test(page.url());
  } finally {
    await browser.close();
  }
}

export default async function globalSetup() {
  if (await hasValidStoredSession()) return;

  const email = process.env.PLAYWRIGHT_AUTH_EMAIL;
  const password = process.env.PLAYWRIGHT_AUTH_PASSWORD;

  if (!email || !password) {
    throw new Error(
      "Missing PLAYWRIGHT_AUTH_EMAIL or PLAYWRIGHT_AUTH_PASSWORD. Set them to refresh e2e/auth.json without recording the login."
    );
  }

  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    await page.goto(`${BASE_URL}/login`);
    await page.getByPlaceholder("test@ejemplo.com").fill(email);
    await page.locator("input[type='password']").fill(password);
    await page.getByRole("button", { name: "Ingresar" }).click();
    await page.waitForURL("**/chat**", { timeout: 30_000 });
    await page.context().storageState({ path: STORAGE_STATE_PATH });
  } finally {
    await browser.close();
  }
}
