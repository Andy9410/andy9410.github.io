import { expect } from "@playwright/test";
import { test } from "testreel/playwright";
import type { Page } from "@playwright/test";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? "https://learnsoft.uy";
const ADMIN_EMAIL = "learnsoft@edu.uy";
const ADMIN_PASSWORD = "learnsoftuy1234";

test.use({
  testreelOptions: {
    name: "learnsoft-metrics-demo",
    outputFormat: "mp4",
    outputDir: "./testreel-output",
    cursor: {
      style: "pointer",
      color: "#22d3ee",
      size: 28,
      rippleColor: "#22d3ee",
    },
    chrome: {
      enabled: true,
      titleBarColor: "#0f172a",
      url: "learnsoft.uy",
    },
    background: {
      gradient: { from: "#07111f", to: "#020617" },
      padding: 40,
      borderRadius: 18,
    },
    viewport: { width: 1440, height: 900 },
  },
});

async function pause(page: Page, ms: number) {
  await page.waitForTimeout(ms);
}

async function loginAsAdmin(page: Page, testreelPage: any) {
  await expect(page.getByPlaceholder("test@ejemplo.com")).toBeVisible({ timeout: 15_000 });
  await testreelPage.click("[placeholder='test@ejemplo.com']");
  await testreelPage.type("[placeholder='test@ejemplo.com']", ADMIN_EMAIL, { delay: 28 });
  await testreelPage.click("input[type='password']");
  await testreelPage.type("input[type='password']", ADMIN_PASSWORD, { delay: 28 });
  await pause(page, 250);
  await testreelPage.click("role=button[name='Ingresar']");
  await page.waitForURL("**/admin/metrics**", { timeout: 35_000 });
}

async function hoverChart(page: Page, selector: string) {
  const box = await page.locator(selector).first().boundingBox().catch(() => null);
  if (!box) return;

  await page.mouse.move(box.x + box.width * 0.62, box.y + box.height * 0.35, { steps: 16 });
  await pause(page, 650);
}

test("LearnSoft - Demo Video de Métricas", async ({ page, testreelPage }) => {
  await testreelPage.navigate(`${BASE_URL}/admin/metrics`);
  await page.waitForURL(/\/login|\/admin\/metrics/, { timeout: 15_000 });

  if (page.url().includes("/login")) {
    await loginAsAdmin(page, testreelPage);
  }

  await expect(page.getByRole("heading", { name: /Dashboard de métricas/i })).toBeVisible({
    timeout: 15_000,
  });

  await pause(page, 900);
  await page.mouse.wheel(0, 320);
  await pause(page, 550);

  await testreelPage.click("role=tab[name='Requests']");
  await hoverChart(page, ".recharts-wrapper");

  await testreelPage.click("role=tab[name='Features']");
  await hoverChart(page, ".recharts-wrapper");

  await testreelPage.click("role=tab[name='Usuarios']");
  await hoverChart(page, ".recharts-wrapper");

  await page.mouse.wheel(0, 620);
  await pause(page, 650);

  await page.mouse.wheel(0, 640);
  await pause(page, 900);

  await page.mouse.wheel(0, -900);
  await pause(page, 500);
});
