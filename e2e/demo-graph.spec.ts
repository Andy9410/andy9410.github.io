import { test, expect } from "testreel/playwright";
import type { Locator, Page } from "@playwright/test";

const DEMO_EMAIL = "learnsoft@edu.uy";
const DEMO_PASSWORD = "learnsoftuy1234";

const GRAPH_MESSAGE_1 = "Graficá la función f(x) = x² - 4 y explicame sus características principales.";
const GRAPH_MESSAGE_2 = "Ahora graficá sen(x) en el intervalo [-2π, 2π].";

test.use({
  testreelOptions: {
    name: "learnsoft-graphs",
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
  await expect(page.getByLabel("Regenerar respuesta").last()).toBeAttached({ timeout: 15_000 });
  await page.evaluate(() => {
    const scrollers = Array.from(document.querySelectorAll("main .overflow-y-auto"));
    const chatScroller = scrollers.find((el) => el.scrollHeight > el.clientHeight);
    chatScroller?.scrollTo({ top: chatScroller.scrollHeight, behavior: "smooth" });
  });
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
  await briefHold(page, 300);
  await testreelPage.click("[aria-label='Enviar mensaje']");
  await waitForAIResponse(page, timeout);
  await testreelPage.wait(3_000);
}

async function hoverAndDownloadGraph(page: Page, testreelPage: {
  click: (target: string | Locator, options?: Record<string, unknown>) => Promise<void>;
  wait: (ms: number) => Promise<void>;
}) {
  const graph = page.locator("figure").last();
  if (!(await graph.isVisible().catch(() => false))) return;

  await graph.scrollIntoViewIfNeeded();
  await briefHold(page, 500);

  // Hover sobre el gráfico para mostrar el botón de descarga
  await graph.hover();
  await briefHold(page, 800);

  const downloadBtn = graph.getByLabel("Descargar gráfico");
  if (await downloadBtn.isVisible().catch(() => false)) {
    const downloadPromise = page.waitForEvent("download");
    await testreelPage.click(downloadBtn);
    const download = await downloadPromise;
    await download.cancel(); // cancelar para no guardar en disco en el demo
    await briefHold(page, 1_200);
  }
}

test("LearnSoft - Gráficas interactivas", async ({ page, testreelPage }) => {
  await testreelPage.navigate("https://learnsoft.uy");
  await expect(page).toHaveTitle(/LearnSoft/i);
  await briefHold(page, 900);

  await testreelPage.click("role=link[name='TutorIA']");
  await briefHold(page, 500);

  if (page.url().includes("/login")) {
    await expect(page.getByPlaceholder("test@ejemplo.com")).toBeVisible({ timeout: 10_000 });
    await testreelPage.click("[placeholder='test@ejemplo.com']");
    await testreelPage.type("[placeholder='test@ejemplo.com']", DEMO_EMAIL, { delay: 42 });
    await testreelPage.click("input[type='password']");
    await testreelPage.type("input[type='password']", DEMO_PASSWORD, { delay: 42 });
    await briefHold(page, 250);
    await testreelPage.click("role=button[name='Ingresar']");
  }

  await page.waitForURL("**/chat**", { timeout: 35_000 });
  await waitForChatReady(page);
  await briefHold(page, 900);

  // Nueva conversación
  await testreelPage.click("role=button[name='Nuevo chat']");
  await briefHold(page, 500);

  // Primer gráfico: parábola
  await sendChatMessage(page, testreelPage, GRAPH_MESSAGE_1, 120_000);
  await hoverAndDownloadGraph(page, testreelPage);

  await briefHold(page, 1_500);

  // Segundo gráfico: seno
  await sendChatMessage(page, testreelPage, GRAPH_MESSAGE_2, 120_000);
  await hoverAndDownloadGraph(page, testreelPage);

  await briefHold(page, 2_000);
});
