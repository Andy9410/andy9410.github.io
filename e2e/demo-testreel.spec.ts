import { test, expect } from "testreel/playwright";
import type { Locator, Page } from "@playwright/test";

const DEMO_EMAIL = "learnsoftuy@edu.uy";
const DEMO_PASSWORD = "learnsoftuy1234";

const PASCAL_MESSAGE =
  "Explícame qué es una variable en Pascal y dame un ejemplo simple.";
const DOCUMENT_MESSAGE =
  "Explícame el ejercicio 2 de este documento paso a paso.";

test.use({
  testreelOptions: {
    name: "learnsoft-demo",
    outputFormat: "mp4",
    outputDir: "./testreel-output",
    cursor: {
      style: "pointer",
      color: "#2dd4bf",
      size: 28,
      rippleColor: "#2dd4bf",
    },
    chrome: {
      enabled: true,
      titleBarColor: "#f8fafc",
      url: "learnsoft.uy",
    },
    background: {
      gradient: { from: "#0d9488", to: "#0f172a" },
      padding: 48,
      borderRadius: 14,
    },
    viewport: { width: 1440, height: 900 },
  },
});

async function briefHold(page: Page, ms = 700) {
  await page.waitForTimeout(ms);
}

async function naturalLandingScroll(page: Page) {
  const steps = 80;
  const duration = 10_000;
  const delay = duration / steps;

  await page.mouse.move(1180, 520, { steps: 20 });

  for (let i = 0; i < steps; i += 1) {
    const easing = Math.sin((i / steps) * Math.PI);
    const delta = 80 + Math.round(easing * 95);
    await page.mouse.wheel(0, delta);
    await page.waitForTimeout(delay);
  }
}

async function quickBackToTop(page: Page) {
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  await page.waitForTimeout(850);
}

async function waitForChatReady(page: Page) {
  const input = page.getByLabel("Mensaje", { exact: true });
  await expect(input).toBeVisible({ timeout: 20_000 });
  await expect(input).toBeEnabled({ timeout: 20_000 });
  return input;
}

async function waitForAIResponse(page: Page, timeout = 120_000) {
  const input = page.getByLabel("Mensaje", { exact: true });

  await expect(input).toBeDisabled({ timeout: 12_000 });
  await expect(input).toBeEnabled({ timeout });

  await expect(page.getByLabel("Regenerar respuesta").last()).toBeAttached({
    timeout: 15_000,
  });

  await page.evaluate(() => {
    const scrollers = Array.from(document.querySelectorAll("main .overflow-y-auto"));
    const chatScroller = scrollers.find((el) => el.scrollHeight > el.clientHeight);
    chatScroller?.scrollTo({ top: chatScroller.scrollHeight, behavior: "smooth" });
  });
}

async function firstOpenableDocument(page: Page) {
  const openPdfButton = page.getByLabel("Ver en visor").first();

  if (await openPdfButton.isVisible().catch(() => false)) {
    return openPdfButton;
  }

  await page.waitForTimeout(2_000);

  return null;
}

async function sendChatMessage(
  page: Page,
  testreelPage: {
    click: (target: string | Locator, options?: Record<string, unknown>) => Promise<void>;
    type: (target: string, text: string, options?: Record<string, unknown>) => Promise<void>;
    wait: (ms: number) => Promise<void>;
  },
  message: string,
  timeout = 120_000
) {
  await waitForChatReady(page);
  await testreelPage.click("[aria-label='Mensaje']");
  await testreelPage.type("[aria-label='Mensaje']", message, { delay: 38 });
  await briefHold(page, 250);
  await testreelPage.click("[aria-label='Enviar mensaje']");
  await waitForAIResponse(page, timeout);
  await testreelPage.wait(3_500);
}

test("LearnSoft - Demo Video", async ({ page, testreelPage }) => {
  await testreelPage.navigate("https://learnsoft.uy");
  await expect(page).toHaveTitle(/LearnSoft/i);
  await briefHold(page, 900);

  await naturalLandingScroll(page);
  await quickBackToTop(page);

  await testreelPage.click("role=link[name='TutorIA']");
  await briefHold(page, 500);

  if (page.url().includes("/login")) {
    await expect(page.getByPlaceholder("test@ejemplo.com")).toBeVisible({
      timeout: 10_000,
    });
    await testreelPage.click("[placeholder='test@ejemplo.com']");
    await testreelPage.type("[placeholder='test@ejemplo.com']", DEMO_EMAIL, {
      delay: 42,
    });
    await testreelPage.click("input[type='password']");
    await testreelPage.type("input[type='password']", DEMO_PASSWORD, {
      delay: 42,
    });
    await briefHold(page, 250);
    await testreelPage.click("role=button[name='Ingresar']");
  }

  await page.waitForURL("**/chat**", { timeout: 35_000 });
  await waitForChatReady(page);
  await briefHold(page, 900);

  await testreelPage.click("role=button[name='Nuevo chat']");
  await briefHold(page, 450);
  await sendChatMessage(page, testreelPage, PASCAL_MESSAGE, 120_000);

  await testreelPage.click("[aria-label='Mis documentos']");
  const firstDocumentButton = await firstOpenableDocument(page);

  if (firstDocumentButton) {
    await testreelPage.click(firstDocumentButton);

    await expect(page.getByLabel("Cerrar visor")).toBeVisible({ timeout: 15_000 });
    await expect(page.locator(".react-pdf__Document canvas").first()).toBeVisible({
      timeout: 30_000,
    });
    await briefHold(page, 1_400);

    await page.mouse.wheel(0, 500);
    await page.waitForTimeout(650);
    await page.mouse.wheel(0, -360);
    await page.waitForTimeout(650);
  } else {
    await testreelPage.click("role=button[name='Close']");
    await briefHold(page, 700);
  }

  await sendChatMessage(page, testreelPage, DOCUMENT_MESSAGE, 150_000);
});
