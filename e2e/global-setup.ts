import { existsSync, readFileSync } from "node:fs";
import { chromium } from "@playwright/test";

const STORAGE_STATE_PATH = "e2e/auth.json";
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? "https://learnsoft.uy";
const CHAT_API_URL = process.env.PLAYWRIGHT_CHAT_API_URL ?? "https://chat-service-academy.fly.dev";

function readStoredAccessToken() {
  if (!existsSync(STORAGE_STATE_PATH)) return null;

  const authState = JSON.parse(readFileSync(STORAGE_STATE_PATH, "utf8")) as {
    origins?: Array<{ origin: string; localStorage?: Array<{ name: string; value: string }> }>;
  };

  return authState.origins
    ?.flatMap((entry) => entry.localStorage ?? [])
    .find((item) => item.name === "auth_access_token")?.value ?? null;
}

async function isChatTokenAccepted() {
  const token = readStoredAccessToken();
  if (!token) return false;

  const response = await fetch(`${CHAT_API_URL}/api/conversations`, {
    headers: { Authorization: `Bearer ${token}` },
  }).catch(() => null);

  return response?.ok ?? false;
}

async function hasValidStoredSession() {
  if (!existsSync(STORAGE_STATE_PATH)) return false;

  const browser = await chromium.launch();
  const context = await browser.newContext({ storageState: STORAGE_STATE_PATH });
  const page = await context.newPage();

  try {
    await page.goto(`${BASE_URL}/chat`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1_000);
    return !/\/login/i.test(page.url()) && await isChatTokenAccepted();
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
