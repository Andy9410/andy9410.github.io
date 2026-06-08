import { readFileSync } from "node:fs";
import { expect, type Page } from "@playwright/test";
import { test } from "testreel/playwright";

test.use({
  storageState: "e2e/auth.json",
  testreelOptions: {
    name: "learnsoft-whiteboard-equation",
    outputFormat: "mp4",
    outputDir: "./testreel-output",
    cursor: {
      style: "pointer",
      color: "#f59e0b",
      size: 30,
      rippleColor: "#f59e0b",
    },
    chrome: {
      enabled: true,
      titleBarColor: "#f8fafc",
      url: "learnsoft.uy/chat",
    },
    background: {
      gradient: { from: "#0f3d2e", to: "#1f2937" },
      padding: 44,
      borderRadius: 16,
    },
    viewport: { width: 1440, height: 900 },
  },
});

async function writeOnBoard(page: Page, text: string) {
  await page.keyboard.type(text, { delay: 48 });
  await page.keyboard.press("Enter");
  await page.waitForTimeout(450);
}

function readAuthLocalStorage() {
  const authState = JSON.parse(readFileSync("e2e/auth.json", "utf8")) as {
    origins?: Array<{ origin: string; localStorage?: Array<{ name: string; value: string }> }>;
  };

  return authState.origins?.find((entry) => entry.origin === "https://learnsoft.uy")?.localStorage ?? [];
}

test("LearnSoft - Pizarra resolviendo una ecuacion", async ({ page, testreelPage }) => {
  const authItems = readAuthLocalStorage();

  await page.addInitScript((items: Array<{ name: string; value: string }>) => {
    for (const item of items) {
      window.localStorage.setItem(item.name, item.value);
    }
  }, authItems);

  await testreelPage.navigate("https://learnsoft.uy/chat");
  await expect(page).not.toHaveURL(/\/login/i);
  await expect(page.getByLabel("Mensaje", { exact: true })).toBeVisible({ timeout: 30_000 });

  await page.waitForTimeout(700);
  await testreelPage.click("role=button[name='Nuevo chat']");
  await page.waitForTimeout(500);

  await testreelPage.click("[aria-label='Abrir pizarra inteligente']");
  await expect(page.getByRole("application", { name: "Pizarra inteligente" })).toBeVisible({
    timeout: 30_000,
  });
  await page.waitForTimeout(1_000);

  const board = page.getByRole("application", { name: "Pizarra inteligente" });
  await testreelPage.click("[aria-label='Ecuación']");
  await board.click({ position: { x: 92, y: 96 } });
  await writeOnBoard(page, "2x + 6 = 14");

  await testreelPage.click("[aria-label='Texto']");
  await board.click({ position: { x: 92, y: 164 } });
  await writeOnBoard(page, "Restamos 6 en ambos lados");

  await testreelPage.click("[aria-label='Ecuación']");
  await board.click({ position: { x: 124, y: 226 } });
  await writeOnBoard(page, "2x = 8");

  await testreelPage.click("[aria-label='Texto']");
  await board.click({ position: { x: 92, y: 294 } });
  await writeOnBoard(page, "Dividimos entre 2 para despejar x");

  await testreelPage.click("[aria-label='Ecuación']");
  await board.click({ position: { x: 124, y: 356 } });
  await writeOnBoard(page, "x = 4");

  await testreelPage.click("[aria-label='Rectángulo']");
  await board.click({ position: { x: 96, y: 392 } });
  await page.waitForTimeout(500);

  await testreelPage.click("[aria-label='Flecha']");
  await board.click({ position: { x: 284, y: 110 } });
  await page.waitForTimeout(500);

  await testreelPage.click("[aria-label='Mover']");
  await page.waitForTimeout(2_000);
});
