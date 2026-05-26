import { test, expect } from "testreel/playwright";
import type { Page } from "@playwright/test";

const DEMO_EMAIL    = "learnsoftuy@edu.uy";
const DEMO_PASSWORD = "learnsoftuy1234";

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

async function waitForAIResponse(page: Page, timeout = 90_000) {
  const input = page.getByLabel("Mensaje", { exact: true });
  await expect(input).toBeDisabled({ timeout: 10_000 });
  await expect(input).toBeEnabled({ timeout });
}

test("LearnSoft — Demo Video", async ({ page, testreelPage }) => {

  // ── 1. Landing page ───────────────────────────────────────────────────────
  await testreelPage.navigate("https://learnsoft.uy");
  await testreelPage.wait(2_000);

  // ── 2. Ir al Tutor IA ─────────────────────────────────────────────────────
  await testreelPage.click("a[href='/chat']");

  // ── 3. Iniciar sesión ─────────────────────────────────────────────────────
  await page.waitForURL("**/login**", { timeout: 10_000 });
  await testreelPage.click("[placeholder='test@ejemplo.com']");
  await testreelPage.type("[placeholder='test@ejemplo.com']", DEMO_EMAIL, { delay: 60 });
  await testreelPage.click("input[type='password']");
  await testreelPage.type("input[type='password']", DEMO_PASSWORD, { delay: 60 });
  await testreelPage.wait(400);
  await testreelPage.click("role=button[name='Ingresar']");

  await page.waitForURL("**/chat**", { timeout: 30_000 });
  await expect(page.getByLabel("Mensaje", { exact: true })).toBeVisible({ timeout: 10_000 });
  await testreelPage.wait(1_000);

  // ── 4. Seleccionar nivel Básico ───────────────────────────────────────────
  await testreelPage.click('text="Básico"', { zoom: 1.4 });
  await testreelPage.wait(600);

  // ── 5. Nuevo chat y pregunta sobre Pascal (nivel básico) ──────────────────
  await testreelPage.click("role=button[name='Nuevo chat']");
  await testreelPage.wait(800);
  await testreelPage.click("[aria-label='Mensaje']");
  await testreelPage.type(
    "[aria-label='Mensaje']",
    "¿Qué es una variable en Pascal?",
    { delay: 55 }
  );
  await testreelPage.click("[aria-label='Enviar mensaje']");
  await waitForAIResponse(page);
  await testreelPage.wait(2_000);

  // ── 6. Cambiar nivel a Experto ────────────────────────────────────────────
  await testreelPage.click('text="Experto"', { zoom: 1.4 });
  await testreelPage.wait(600);

  // ── 7. Nuevo chat y misma pregunta (nivel experto) ────────────────────────
  await testreelPage.click("role=button[name='Nuevo chat']");
  await testreelPage.wait(800);
  await testreelPage.click("[aria-label='Mensaje']");
  await testreelPage.type(
    "[aria-label='Mensaje']",
    "¿Qué es una variable en Pascal?",
    { delay: 55 }
  );
  await testreelPage.click("[aria-label='Enviar mensaje']");
  await waitForAIResponse(page);
  await testreelPage.wait(2_000);

  // ── 8. Abrir panel "Mis documentos" ──────────────────────────────────────
  await testreelPage.click("[aria-label='Mis documentos']");

  // ── 9. Abrir el primer documento disponible ───────────────────────────────
  await expect(page.getByText("fragmentos").first()).toBeVisible({ timeout: 10_000 });
  await testreelPage.wait(2_000);
  await testreelPage.click(page.getByText("fragmentos").first());

  // ── 10. Verificar visor PDF y hacer scroll ────────────────────────────────
  await expect(page.getByLabel("Cerrar visor")).toBeVisible({ timeout: 10_000 });
  await expect(page.locator(".animate-spin").first()).not.toBeVisible({ timeout: 20_000 });
  await testreelPage.wait(2_000);
  await testreelPage.scroll({ y: 800, scrollSpeed: 200 });
  await testreelPage.wait(1_000);
  await testreelPage.scroll({ y: -800, scrollSpeed: 400 });
  await testreelPage.wait(1_000);

  // ── 11. Preguntar sobre el ejercicio 2 del documento ──────────────────────
  await testreelPage.click("[aria-label='Mensaje']");
  await testreelPage.type(
    "[aria-label='Mensaje']",
    "Explícame el ejercicio 2 de este documento paso a paso.",
    { delay: 55 }
  );
  await testreelPage.click("[aria-label='Enviar mensaje']");
  await waitForAIResponse(page, 120_000);
  await testreelPage.wait(2_000);
});
