import { test, expect, type Page } from "@playwright/test";

// ─── Credenciales de demo ────────────────────────────────────────────────────
const DEMO_EMAIL    = "learnsoftuy@edu.uy";
const DEMO_PASSWORD = "learnsoftuy1234";

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Scroll lento y fluido hacia abajo durante `durationMs` milisegundos.
 */
async function slowScrollToBottom(page: Page, durationMs = 10_000) {
  const totalHeight = await page.evaluate(
    () => document.documentElement.scrollHeight - window.innerHeight
  );
  const steps     = 80;
  const stepDelay = Math.floor(durationMs / steps);
  const stepSize  = totalHeight / steps;

  for (let i = 0; i < steps; i++) {
    await page.mouse.wheel(0, stepSize);
    await page.waitForTimeout(stepDelay);
  }
}

/**
 * Espera a que el Mentor IA termine de responder:
 * detecta que el botón de enviar se deshabilita (IA procesando)
 * y luego vuelve a habilitarse (respuesta completa).
 */
async function waitForAIResponse(page: Page, timeout = 90_000) {
  const input = page.getByLabel("Mensaje", { exact: true });
  await expect(input).toBeDisabled({ timeout: 10_000 });
  await expect(input).toBeEnabled({ timeout });
}

// ─── Demo workflow ────────────────────────────────────────────────────────────

test("LearnSoft — Demo Workflow Completo", async ({ page }) => {

  // ── 1. Entrar a la página principal ──────────────────────────────────────
  await page.goto("/");
  await expect(page).toHaveTitle(/LearnSoft/i);
  await page.waitForTimeout(1_500);

  // ── 2. Scroll lento hasta el final (~10 segundos) ─────────────────────────
  await slowScrollToBottom(page, 10_000);
  await page.waitForTimeout(1_000);

  // ── 3. Volver rápido al inicio ────────────────────────────────────────────
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  await page.waitForTimeout(1_200);

  // ── 4. Ir al Mentor IA ────────────────────────────────────────────────────
  await page.getByRole("link", { name: "Probar Chat IA" }).click();

  // ── 5. Iniciar sesión ─────────────────────────────────────────────────────
  await page.waitForURL("**/login**", { timeout: 10_000 });
  await page.getByPlaceholder("test@ejemplo.com").click();
  await page.getByPlaceholder("test@ejemplo.com").pressSequentially(DEMO_EMAIL, { delay: 50 });
  await page.locator("input[type='password']").click();
  await page.locator("input[type='password']").pressSequentially(DEMO_PASSWORD, { delay: 50 });
  await page.waitForTimeout(500);
  await page.getByRole("button", { name: "Ingresar" }).click();

  await page.waitForURL("**/chat**", { timeout: 30_000 });
  await expect(page.getByLabel("Mensaje", { exact: true })).toBeVisible({ timeout: 10_000 });
  await page.waitForTimeout(1_000);

  // ── 6. Abrir nuevo chat ───────────────────────────────────────────────────
  await page.getByRole("button", { name: "Nuevo chat" }).click();
  await page.waitForTimeout(800);

  // ── 7. Enviar pregunta sobre Pascal ───────────────────────────────────────
  await page.getByLabel("Mensaje", { exact: true }).fill(
    "Explícame qué es una variable en Pascal y dame un ejemplo simple."
  );
  await page.getByLabel("Enviar mensaje").click();

  // ── 8. Esperar respuesta del Mentor IA ───────────────────────────────────
  await waitForAIResponse(page);
  await page.waitForTimeout(1_500);

  // ── 9. Abrir panel "Mis documentos" ──────────────────────────────────────
  await page.getByLabel("Mis documentos").click();

  // ── 10. Abrir el primer documento disponible ──────────────────────────────
  // TODO: agregar data-testid="doc-row" en DocumentPanel para un selector
  //       más estable en caso de cambios de texto o formato de fecha.
  await expect(page.getByText("fragmentos").first()).toBeVisible({ timeout: 10_000 });
  await page.getByText("fragmentos").first().click();

  // ── 11. Verificar que el visor PDF abrió y cargó ──────────────────────────
  await expect(page.getByLabel("Cerrar visor")).toBeVisible({ timeout: 10_000 });
  await expect(page.locator(".animate-spin").first()).not.toBeVisible({ timeout: 20_000 });
  await page.waitForTimeout(2_000);

  // ── 12. Preguntar sobre el ejercicio 2 del documento ──────────────────────
  await page.getByLabel("Mensaje", { exact: true }).fill(
    "Explícame el ejercicio 2 de este documento paso a paso."
  );
  await page.getByLabel("Enviar mensaje").click();

  // ── 13. Esperar respuesta con contexto del documento ──────────────────────
  await waitForAIResponse(page, 120_000);
  await page.waitForTimeout(2_000);
});
