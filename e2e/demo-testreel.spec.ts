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
      url: "andy9410.github.io",
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

  // ── 1. Entrar a la página principal ──────────────────────────────────────
  await testreelPage.navigate("https://andy9410.github.io");
  await testreelPage.wait(1_500);

  // ── 2. Scroll lento hasta el final ───────────────────────────────────────
  const totalHeight = await page.evaluate(
    () => document.documentElement.scrollHeight - window.innerHeight
  );
  await testreelPage.scroll({ y: totalHeight, scrollSpeed: 250 });
  await testreelPage.wait(1_000);

  // ── 3. Volver rápido al inicio ────────────────────────────────────────────
  await testreelPage.scroll({ y: -totalHeight, scrollSpeed: 2_500 });
  await testreelPage.wait(1_200);

  // ── 4. Ir al Mentor IA ────────────────────────────────────────────────────
  await testreelPage.click("role=link[name='Probar Chat IA']");

  // ── 5. Iniciar sesión ─────────────────────────────────────────────────────
  await page.waitForURL("**/login**", { timeout: 10_000 });
  await testreelPage.click("[placeholder='test@ejemplo.com']");
  await testreelPage.type("[placeholder='test@ejemplo.com']", DEMO_EMAIL, { delay: 60 });
  await testreelPage.click("input[type='password']");
  await testreelPage.type("input[type='password']", DEMO_PASSWORD, { delay: 60 });
  await testreelPage.wait(500);
  await testreelPage.click("role=button[name='Ingresar']");

  await page.waitForURL("**/chat**", { timeout: 30_000 });
  await expect(page.getByLabel("Mensaje", { exact: true })).toBeVisible({ timeout: 10_000 });
  await testreelPage.wait(1_000);

  // ── 6. Abrir nuevo chat ───────────────────────────────────────────────────
  await testreelPage.click("role=button[name='Nuevo chat']");
  await testreelPage.wait(800);

  // ── 7. Enviar pregunta sobre Pascal ───────────────────────────────────────
  await testreelPage.click("[aria-label='Mensaje']");
  await testreelPage.type(
    "[aria-label='Mensaje']",
    "Explícame qué es una variable en Pascal y dame un ejemplo simple.",
    { delay: 55 }
  );
  await testreelPage.click("[aria-label='Enviar mensaje']");

  // ── 8. Esperar respuesta del Mentor IA ────────────────────────────────────
  await waitForAIResponse(page);
  await testreelPage.wait(1_500);

  // ── 9. Abrir panel "Mis documentos" ──────────────────────────────────────
  await testreelPage.click("[aria-label='Mis documentos']");

  // ── 10. Abrir el primer documento disponible ──────────────────────────────
  await expect(page.getByText("fragmentos").first()).toBeVisible({ timeout: 10_000 });
  await testreelPage.wait(2_000);
  await testreelPage.click(page.getByText("fragmentos").first());

  // ── 11. Verificar que el visor PDF abrió y cargó ──────────────────────────
  await expect(page.getByLabel("Cerrar visor")).toBeVisible({ timeout: 10_000 });
  await expect(page.locator(".animate-spin").first()).not.toBeVisible({ timeout: 20_000 });
  await testreelPage.wait(2_000);

  // ── 11b. Scroll dentro del PDF ────────────────────────────────────────────
  await testreelPage.hover("[aria-label='Cerrar visor']");
  await testreelPage.scroll({ y: 800, scrollSpeed: 200 });
  await testreelPage.wait(1_000);
  await testreelPage.scroll({ y: -800, scrollSpeed: 400 });
  await testreelPage.wait(1_000);

  // ── 12. Preguntar sobre el ejercicio 2 del documento ──────────────────────
  await testreelPage.click("[aria-label='Mensaje']");
  await testreelPage.type(
    "[aria-label='Mensaje']",
    "Explícame el ejercicio 2 de este documento paso a paso.",
    { delay: 55 }
  );
  await testreelPage.click("[aria-label='Enviar mensaje']");

  // ── 13. Esperar respuesta con contexto del documento ──────────────────────
  await waitForAIResponse(page, 120_000);
  await testreelPage.wait(2_000);
});
