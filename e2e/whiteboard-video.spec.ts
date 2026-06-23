import { expect, type Page } from "@playwright/test";
import { test } from "testreel/playwright";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? "https://learnsoft.uy";
const AUTH_API_URL = process.env.VIDEO_AUTH_API_URL ?? "https://auth-service-academy.fly.dev";
const ADMIN_EMAIL = process.env.VIDEO_ADMIN_EMAIL ?? "learnsoft@edu.uy";
const ADMIN_PASSWORD = process.env.VIDEO_ADMIN_PASSWORD ?? "learnsoftuy1234";

test.use({
  testreelOptions: {
    name: "learnsoft-metrics-demo",
    outputFormat: "mp4",
    outputDir: "./testreel-output",
    cursor: {
      style: "pointer",
      color: "#22d3ee",
      size: 30,
      rippleColor: "#22d3ee",
    },
    chrome: {
      enabled: true,
      titleBarColor: "#0f172a",
      url: "learnsoft.uy/admin/metrics",
    },
    background: {
      gradient: { from: "#07111f", to: "#020617" },
      padding: 40,
      borderRadius: 18,
    },
    viewport: { width: 1920, height: 1080 },
  },
});

async function pause(page: Page, ms: number) {
  await page.waitForTimeout(ms);
}

async function authenticateAdminSession(page: Page) {
  const response = await page.request.post(`${AUTH_API_URL}/auth/login`, {
    data: {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    },
  });

  if (!response.ok()) {
    throw new Error(`Admin login failed (${response.status()})`);
  }

  const payload = await response.json() as {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };

  const expiryMs = Date.now() + payload.expiresIn * 1000;

  await page.context().addInitScript(
    ({ accessToken, refreshToken, expiry }) => {
      if (window.location.origin !== "https://learnsoft.uy") return;
      window.localStorage.setItem("auth_access_token", accessToken);
      window.localStorage.setItem("auth_refresh_token", refreshToken);
      window.localStorage.setItem("auth_token_expiry", String(expiry));
      document.documentElement.style.opacity = "0";
      document.documentElement.style.transition = "opacity 260ms ease";
    },
    {
      accessToken: payload.accessToken,
      refreshToken: payload.refreshToken,
      expiry: expiryMs,
    },
  );
}

async function moveAcrossChart(page: Page, selector: string, positions: number[]) {
  const box = await page.locator(selector).first().boundingBox().catch(() => null);
  if (!box) return;

  for (const ratio of positions) {
    await page.mouse.move(
      box.x + box.width * ratio,
      box.y + box.height * 0.42,
      { steps: 12 },
    );
    await pause(page, 280);
  }
}

async function gentleScroll(page: Page, deltaY: number, pauseMs = 460) {
  await page.mouse.wheel(0, deltaY);
  await pause(page, pauseMs);
}

async function waitForDashboardReady(page: Page) {
  await expect(page.getByRole("heading", { name: /Dashboard de métricas/i })).toBeVisible({
    timeout: 20_000,
  });
  await expect(page.locator(".animate-pulse")).toHaveCount(0, { timeout: 20_000 });
  await expect(page.locator(".animate-spin")).toHaveCount(0, { timeout: 20_000 });
  await expect(page.locator(".recharts-wrapper").first()).toBeVisible({ timeout: 20_000 });
  await page.evaluate(() => {
    requestAnimationFrame(() => {
      document.documentElement.style.opacity = "1";
    });
  });
  await pause(page, 650);
}

test("LearnSoft - Demo Video de Métricas", async ({ page, testreelPage }) => {
  await authenticateAdminSession(page);
  await testreelPage.navigate(`${BASE_URL}/admin/metrics`);
  await page.waitForLoadState("domcontentloaded");
  await page.waitForLoadState("networkidle").catch(() => {});
  await waitForDashboardReady(page);

  // Bloque 1: overview
  await page.mouse.move(1360, 220, { steps: 12 });
  await pause(page, 420);
  await gentleScroll(page, 210, 380);

  // Bloque 2: serie diaria
  await testreelPage.click("role=tab[name='Requests']");
  await pause(page, 460);
  await moveAcrossChart(page, ".recharts-wrapper", [0.18, 0.42, 0.66, 0.88]);

  // Bloque 3: features
  await testreelPage.click("role=tab[name='Features']");
  await pause(page, 460);
  await moveAcrossChart(page, ".recharts-wrapper", [0.22, 0.48, 0.78]);

  // Bloque 4: usuarios
  await testreelPage.click("role=tab[name='Usuarios']");
  await pause(page, 460);
  await moveAcrossChart(page, ".recharts-wrapper", [0.18, 0.46, 0.74]);

  // Bloque 5: tablas e insight final
  await gentleScroll(page, 500, 520);
  await gentleScroll(page, 420, 520);
  await page.mouse.move(1540, 820, { steps: 8 });
  await pause(page, 620);

  // Cierre: vuelve arriba, zoom out suave y plano general.
  await page.evaluate(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    document.documentElement.style.zoom = "0.92";
  });
  await pause(page, 2_000);
});
