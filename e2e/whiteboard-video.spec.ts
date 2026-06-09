import { readFileSync } from "node:fs";
import { expect, type Locator, type Page } from "@playwright/test";
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

const CHAT_API_URL = process.env.PLAYWRIGHT_CHAT_API_URL ?? "https://chat-service-academy.fly.dev";

async function writeOnBoard(page: Page, text: string) {
  await page.keyboard.type(text, { delay: 48 });
  await page.keyboard.press("Enter");
  await page.waitForTimeout(650);
}

async function chooseTool(
  testreelPage: { click: (target: string | Locator, options?: Record<string, unknown>) => Promise<void> },
  label: string
) {
  await testreelPage.click(`[aria-label='${label}']`);
}

async function toggleGrid(
  page: Page,
  testreelPage: { click: (target: string | Locator, options?: Record<string, unknown>) => Promise<void> }
) {
  const gridToggle = page.getByLabel(/cuadrícula/i).first();
  await expect(gridToggle).toBeVisible({ timeout: 10_000 });
  await testreelPage.click(gridToggle);
}

async function drawStroke(page: Page, board: ReturnType<Page["getByRole"]>, points: Array<{ x: number; y: number }>) {
  const box = await board.boundingBox();
  if (!box || points.length === 0) return;

  const [firstPoint, ...rest] = points;
  await page.mouse.move(box.x + firstPoint.x, box.y + firstPoint.y);
  await page.mouse.down();

  for (const point of rest) {
    await page.mouse.move(box.x + point.x, box.y + point.y, { steps: 8 });
  }

  await page.mouse.up();
  await page.waitForTimeout(650);
}

function readAuthLocalStorage() {
  const authState = JSON.parse(readFileSync("e2e/auth.json", "utf8")) as {
    origins?: Array<{ origin: string; localStorage?: Array<{ name: string; value: string }> }>;
  };

  return authState.origins?.find((entry) => entry.origin === "https://learnsoft.uy")?.localStorage ?? [];
}

function getAuthToken(authItems: Array<{ name: string; value: string }>) {
  return authItems.find((item) => item.name === "auth_access_token")?.value ?? null;
}

async function prepareDemoWhiteboard(page: Page, token: string) {
  const title = `Video pizarra ${Date.now()}`;
  const conversationResponse = await page.request.post(`${CHAT_API_URL}/api/conversations`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    data: { title },
  });

  if (!conversationResponse.ok()) {
    throw new Error(`Could not create video conversation: ${conversationResponse.status()} ${await conversationResponse.text()}`);
  }

  const conversation = await conversationResponse.json() as { id: number };
  const whiteboardResponse = await page.request.post(`${CHAT_API_URL}/api/conversations/${conversation.id}/whiteboards`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    data: {
      title: "Pizarra para video",
      data: { version: 1, elements: [] },
    },
  });

  if (!whiteboardResponse.ok()) {
    throw new Error(`Could not create video whiteboard: ${whiteboardResponse.status()} ${await whiteboardResponse.text()}`);
  }

  return title;
}

test("LearnSoft - Pizarra resolviendo una ecuacion", async ({ page, testreelPage }) => {
  const authItems = readAuthLocalStorage();
  const authToken = getAuthToken(authItems);

  expect(authToken).toBeTruthy();

  const conversationTitle = await prepareDemoWhiteboard(page, authToken!);

  await page.addInitScript((items: Array<{ name: string; value: string }>) => {
    for (const item of items) {
      window.localStorage.setItem(item.name, item.value);
    }
  }, authItems);

  await testreelPage.navigate("https://learnsoft.uy/chat");
  await expect(page).not.toHaveURL(/\/login/i);
  await expect(page.getByLabel("Mensaje", { exact: true })).toBeVisible({ timeout: 30_000 });

  await page.waitForTimeout(700);
  const preparedConversation = page.getByText(conversationTitle, { exact: true }).first();
  await expect(preparedConversation).toBeVisible({ timeout: 30_000 });
  await testreelPage.click(preparedConversation);
  await page.waitForTimeout(1_000);

  await testreelPage.click("[aria-label='Abrir pizarra inteligente']");
  await expect(page.getByRole("application", { name: "Pizarra inteligente" })).toBeVisible({
    timeout: 30_000,
  });
  await page.waitForTimeout(1_200);

  const board = page.getByRole("application", { name: "Pizarra inteligente" });
  await chooseTool(testreelPage, "Texto");
  await board.click({ position: { x: 76, y: 78 } });
  await writeOnBoard(page, "Pizarra: resolver una ecuacion lineal");
  await page.waitForTimeout(900);

  await chooseTool(testreelPage, "Ecuación");
  await board.click({ position: { x: 92, y: 140 } });
  await writeOnBoard(page, "2x + 6 = 14");
  await page.waitForTimeout(900);

  await chooseTool(testreelPage, "Lápiz");
  await drawStroke(page, board, [
    { x: 92, y: 152 },
    { x: 180, y: 152 },
    { x: 252, y: 152 },
  ]);

  await chooseTool(testreelPage, "Texto");
  await board.click({ position: { x: 92, y: 218 } });
  await writeOnBoard(page, "Paso 1: restamos 6 en ambos lados");
  await page.waitForTimeout(700);

  await chooseTool(testreelPage, "Ecuación");
  await board.click({ position: { x: 124, y: 280 } });
  await writeOnBoard(page, "2x + 6 - 6 = 14 - 6");
  await board.click({ position: { x: 124, y: 342 } });
  await writeOnBoard(page, "2x = 8");
  await page.waitForTimeout(900);

  await chooseTool(testreelPage, "Flecha");
  await board.click({ position: { x: 410, y: 292 } });
  await page.waitForTimeout(800);

  await chooseTool(testreelPage, "Texto");
  await board.click({ position: { x: 92, y: 420 } });
  await writeOnBoard(page, "Paso 2: dividimos entre 2 para despejar x");
  await page.waitForTimeout(700);

  await chooseTool(testreelPage, "Ecuación");
  await board.click({ position: { x: 124, y: 482 } });
  await writeOnBoard(page, "2x / 2 = 8 / 2");
  await board.click({ position: { x: 124, y: 544 } });
  await writeOnBoard(page, "x = 4");
  await page.waitForTimeout(900);

  await chooseTool(testreelPage, "Rectángulo");
  await board.click({ position: { x: 92, y: 512 } });
  await page.waitForTimeout(800);

  await chooseTool(testreelPage, "Texto");
  await board.click({ position: { x: 430, y: 140 } });
  await writeOnBoard(page, "Comprobacion");

  await chooseTool(testreelPage, "Ecuación");
  await board.click({ position: { x: 430, y: 202 } });
  await writeOnBoard(page, "2(4) + 6 = 14");
  await board.click({ position: { x: 430, y: 264 } });
  await writeOnBoard(page, "8 + 6 = 14");
  await board.click({ position: { x: 430, y: 326 } });
  await writeOnBoard(page, "14 = 14");

  await chooseTool(testreelPage, "Lápiz");
  await drawStroke(page, board, [
    { x: 426, y: 344 },
    { x: 486, y: 370 },
    { x: 578, y: 252 },
  ]);

  await toggleGrid(page, testreelPage);
  await page.waitForTimeout(900);
  await toggleGrid(page, testreelPage);
  await page.waitForTimeout(900);

  await chooseTool(testreelPage, "Mover");
  await page.waitForTimeout(3_200);
});
