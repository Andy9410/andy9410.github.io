import { expect, type Locator, type Page } from "@playwright/test";
import { test } from "testreel/playwright";

test.use({
  testreelOptions: {
    name: "learnsoft-whiteboard-equation",
    outputFormat: "mp4",
    outputDir: "./testreel-output",
    cursor: {
      style: "pointer",
      color: "#14b8a6",
      size: 30,
      rippleColor: "#14b8a6",
    },
    chrome: {
      enabled: true,
      titleBarColor: "#f8fafc",
      url: "learnsoft.uy/chat",
    },
    background: {
      gradient: { from: "#0f766e", to: "#0f172a" },
      padding: 42,
      borderRadius: 18,
    },
    viewport: { width: 1440, height: 900 },
  },
});

type TestreelPage = {
  click: (target: string | Locator, options?: Record<string, unknown>) => Promise<void>;
  type: (target: string, text: string, options?: Record<string, unknown>) => Promise<void>;
  wait: (ms: number) => Promise<void>;
  navigate: (url: string) => Promise<void>;
};

const TYPE_DELAY = 38;

async function hold(page: Page, ms: number) {
  await page.waitForTimeout(ms);
}

async function setSceneCaption(page: Page, title: string, subtitle = "") {
  await page.locator("#scene-title").evaluate((node, value) => { node.textContent = value; }, title);
  await page.locator("#scene-subtitle").evaluate((node, value) => { node.textContent = value; }, subtitle);
}

async function sendStudentMessage(page: Page, testreelPage: TestreelPage, text: string, after = 900) {
  await testreelPage.click("#chat-input");
  await page.locator("#chat-input").fill("");
  await testreelPage.type("#chat-input", text, { delay: TYPE_DELAY });
  await hold(page, 250);
  await testreelPage.click("#send-button");
  await page.evaluate((message) => {
    const list = document.querySelector("#chat-messages");
    const input = document.querySelector<HTMLTextAreaElement>("#chat-input");
    if (input) input.value = "";
    const bubble = document.createElement("div");
    bubble.className = "message user-message enter";
    bubble.innerHTML = `<span>${message.replace(/</g, "&lt;")}</span>`;
    list?.appendChild(bubble);
    list?.scrollTo({ top: list.scrollHeight, behavior: "smooth" });
  }, text);
  await hold(page, after);
}

async function aiMessage(page: Page, text: string, after = 900) {
  await page.evaluate((message) => {
    const list = document.querySelector("#chat-messages");
    const bubble = document.createElement("div");
    bubble.className = "message ai-message enter";
    bubble.innerHTML = `<span>${message}</span>`;
    list?.appendChild(bubble);
    list?.scrollTo({ top: list.scrollHeight, behavior: "smooth" });
  }, text);
  await hold(page, after);
}

async function showDetection(page: Page, text = "Detectando necesidad de explicación guiada...") {
  await page.evaluate((message) => {
    const detection = document.querySelector("#detection");
    if (!detection) return;
    detection.textContent = message;
    detection.classList.add("visible");
  }, text);
  await hold(page, 1_600);
  await page.locator("#detection").evaluate((node) => node.classList.remove("visible"));
  await hold(page, 350);
}

async function openWhiteboard(page: Page, title: string, subtitle: string) {
  await page.evaluate(({ title: boardTitle, subtitle: boardSubtitle }) => {
    document.body.classList.add("board-open");
    document.querySelector("#board-title")!.textContent = boardTitle;
    document.querySelector("#board-subtitle")!.textContent = boardSubtitle;
    document.querySelector("#board-content")!.innerHTML = "";
    document.querySelector("#board-status")!.textContent = "Planificando el paso a paso...";
  }, { title, subtitle });
  await hold(page, 1_400);
}

async function typeBoardBlock(page: Page, kind: string, text: string, pause = 520) {
  await page.evaluate(({ kind: blockKind }) => {
    const board = document.querySelector("#board-content");
    const block = document.createElement("div");
    block.className = `board-line ${blockKind}`;
    block.innerHTML = `<span class="line-text"></span><span class="chalk-cursor">|</span>`;
    board?.appendChild(block);
    block.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, { kind });

  const tokens = text.match(/\S+\s*/g) ?? [text];
  let current = "";
  for (const token of tokens) {
    current += token;
    await page.evaluate((value) => {
      const line = document.querySelector("#board-content .board-line:last-child .line-text");
      if (line) line.textContent = value;
      const boardPanel = document.querySelector("#whiteboard-panel");
      const content = document.querySelector("#board-content");
      if (boardPanel && content) boardPanel.scrollTo({ top: content.scrollHeight, behavior: "smooth" });
    }, current);
    await hold(page, 115);
  }

  await page.evaluate(() => {
    document.querySelector("#board-content .board-line:last-child .chalk-cursor")?.remove();
  });
  await hold(page, pause);
}

async function highlightBoardLine(page: Page, index: number, label = "Paso relacionado") {
  await page.evaluate(({ index: targetIndex, label: text }) => {
    document.querySelectorAll(".board-line").forEach((line) => line.classList.remove("highlight"));
    const target = document.querySelectorAll(".board-line")[targetIndex];
    target?.classList.add("highlight");
    document.querySelector("#board-status")!.textContent = text;
    target?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, { index, label });
  await hold(page, 1_400);
}

async function closeBoard(page: Page) {
  await page.evaluate(() => {
    document.body.classList.remove("board-open");
  });
  await hold(page, 1_100);
}

async function reopenBoard(page: Page) {
  await page.evaluate(() => {
    document.body.classList.add("board-open");
    document.querySelector("#board-status")!.textContent = "Contenido restaurado";
  });
  await hold(page, 1_200);
}

async function showPdfMode(page: Page) {
  await page.evaluate(() => {
    document.body.classList.add("pdf-mode");
    document.querySelector("#board-content")!.innerHTML = "";
    document.querySelector("#board-title")!.textContent = "Resolución guiada";
    document.querySelector("#board-subtitle")!.textContent = "Material real del estudiante";
    document.querySelector("#board-status")!.textContent = "Analizando PDF";
  });
  await hold(page, 1_300);
}

async function finalCard(page: Page) {
  await page.evaluate(() => {
    document.body.classList.add("final-scene");
  });
  await hold(page, 4_200);
}

async function mountDemo(page: Page) {
  await page.setContent(`
    <!doctype html>
    <html lang="es">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>LearnSoft TutorIA Demo</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Caveat:wght@600;700&display=swap');
          * { box-sizing: border-box; }
          body { margin: 0; font-family: Inter, ui-sans-serif, system-ui; background: #f8fafc; color: #0f172a; overflow: hidden; }
          .app { width: 100vw; height: 100vh; display: grid; grid-template-columns: 232px 1fr 0fr; transition: grid-template-columns 700ms cubic-bezier(.2,.8,.2,1); }
          body.board-open .app { grid-template-columns: 232px 1fr 0.95fr; }
          body.pdf-mode .app { grid-template-columns: 232px 0.82fr 1.1fr; }
          .sidebar { background: #ffffff; border-right: 1px solid #e2e8f0; padding: 18px 14px; display: flex; flex-direction: column; gap: 18px; }
          .brand { display: flex; align-items: center; gap: 10px; font-weight: 800; color: #0f3d2e; }
          .brand-badge { width: 34px; height: 34px; border-radius: 12px; background: #0f766e; color: white; display: grid; place-items: center; font-weight: 800; }
          .new-chat { border: none; background: #2dd4bf; color: #083344; border-radius: 14px; padding: 13px 14px; font-weight: 800; text-align: left; }
          .history-title { color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: .08em; }
          .history-item { padding: 12px; border-radius: 14px; background: #f8fafc; color: #334155; font-size: 13px; line-height: 1.35; }
          .history-item.active { background: #ccfbf1; color: #0f766e; font-weight: 700; }
          .chat { min-width: 0; display: flex; flex-direction: column; background: linear-gradient(180deg, #ffffff, #f8fafc); }
          .chat-header { height: 72px; border-bottom: 1px solid #e2e8f0; display: flex; align-items: center; justify-content: space-between; padding: 0 24px; }
          .chat-title { display: flex; align-items: center; gap: 12px; font-weight: 800; }
          .bot-icon { width: 34px; height: 34px; border-radius: 14px; display: grid; place-items: center; background: #ccfbf1; color: #0f766e; }
          .header-actions { display: flex; gap: 8px; }
          .pill { border: 1px solid #cbd5e1; color: #475569; background: white; border-radius: 999px; padding: 8px 13px; font-size: 12px; font-weight: 700; }
          .scene-caption { position: fixed; left: 276px; top: 94px; z-index: 40; max-width: 620px; background: rgba(15, 23, 42, .92); color: white; border-radius: 20px; padding: 18px 22px; box-shadow: 0 22px 70px rgba(15,23,42,.25); opacity: 1; }
          .scene-caption h1 { margin: 0; font-size: 24px; line-height: 1.2; }
          .scene-caption p { margin: 7px 0 0; color: #ccfbf1; font-size: 14px; }
          .messages { flex: 1; overflow: hidden; padding: 154px 28px 20px; display: flex; flex-direction: column; gap: 16px; }
          .message { max-width: 78%; border-radius: 24px; padding: 18px 20px; font-size: 15px; line-height: 1.55; box-shadow: 0 12px 36px rgba(15,23,42,.08); }
          .message.enter { animation: rise 480ms ease both; }
          .user-message { align-self: flex-end; background: #1d4ed8; color: white; border-bottom-right-radius: 8px; }
          .ai-message { align-self: flex-start; background: white; border: 1px solid #e2e8f0; color: #0f172a; border-bottom-left-radius: 8px; }
          .composer { height: 78px; padding: 12px 24px 18px; display: flex; gap: 10px; border-top: 1px solid #e2e8f0; background: rgba(255,255,255,.88); }
          #chat-input { flex: 1; resize: none; border: 1px solid #dbe5ef; border-radius: 18px; padding: 16px 18px; outline: none; font: inherit; }
          #send-button { width: 54px; border: none; border-radius: 18px; background: #2dd4bf; color: #083344; font-weight: 900; font-size: 18px; }
          .detection { position: absolute; left: 280px; bottom: 106px; background: #0f766e; color: white; border-radius: 16px; padding: 13px 16px; font-size: 13px; font-weight: 800; opacity: 0; transform: translateY(10px); transition: all 350ms ease; box-shadow: 0 18px 50px rgba(15,118,110,.28); }
          .detection.visible { opacity: 1; transform: translateY(0); }
          .whiteboard { min-width: 0; border-left: 1px solid #dbe5ef; background: #f8fafc; display: flex; flex-direction: column; opacity: 0; transform: translateX(40px); transition: all 700ms cubic-bezier(.2,.8,.2,1); }
          body.board-open .whiteboard, body.pdf-mode .whiteboard { opacity: 1; transform: translateX(0); }
          .board-head { height: 70px; padding: 16px 20px; border-bottom: 1px solid #e2e8f0; background: white; display: flex; align-items: center; justify-content: space-between; }
          .board-head strong { font-size: 16px; }
          .board-head span { display: block; color: #64748b; font-size: 12px; margin-top: 4px; }
          .board-status { color: #0f766e; font-size: 12px; font-weight: 800; }
          .board-panel { flex: 1; overflow: auto; background: #245f1f; padding: 28px 30px 90px; box-shadow: inset 0 0 0 1px rgba(255,255,255,.08); }
          .board-content { min-height: 100%; color: white; font-family: Caveat, cursive; font-size: 30px; line-height: 1.45; }
          .board-line { margin: 0 0 20px; white-space: pre-wrap; word-break: break-word; text-shadow: 0 1px 0 rgba(0,0,0,.18); transition: background 300ms ease, transform 300ms ease; }
          .board-line.title { font-size: 36px; font-weight: 700; }
          .board-line.formula { font-family: Georgia, serif; text-align: center; font-size: 28px; color: #fffde7; }
          .board-line.warning { color: #fde68a; border-left: 5px solid #facc15; padding-left: 16px; }
          .board-line.highlight { background: rgba(250, 204, 21, .16); border-radius: 18px; padding: 8px 14px; transform: scale(1.015); }
          .chalk-cursor { animation: blink 700ms steps(2,end) infinite; color: #fef08a; }
          .pdf-panel { display: none; position: absolute; left: 244px; top: 72px; bottom: 0; width: 31vw; background: #111827; color: white; border-right: 1px solid #0f172a; padding: 22px; z-index: 20; }
          body.pdf-mode .pdf-panel { display: block; animation: slidePdf 600ms ease both; }
          .pdf-sheet { background: white; color: #111827; border-radius: 18px; height: 100%; padding: 24px; box-shadow: 0 28px 80px rgba(0,0,0,.32); }
          .pdf-title { font-weight: 900; margin-bottom: 18px; }
          .exercise { border: 3px solid #14b8a6; background: #ccfbf1; border-radius: 14px; padding: 16px; margin: 18px 0; box-shadow: 0 0 0 6px rgba(20,184,166,.15); }
          .pdf-line { height: 10px; background: #e5e7eb; border-radius: 999px; margin: 14px 0; }
          .final { position: fixed; inset: 0; z-index: 60; display: none; place-items: center; background: radial-gradient(circle at 50% 35%, #115e59, #020617 70%); color: white; text-align: center; }
          body.final-scene .final { display: grid; animation: fadeIn 900ms ease both; }
          .final-logo { font-size: 58px; font-weight: 900; letter-spacing: -.04em; }
          .final-copy { font-size: 32px; font-weight: 800; margin-top: 24px; }
          .final-sub { color: #99f6e4; margin-top: 12px; font-size: 20px; }
          @keyframes rise { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
          @keyframes blink { 50% { opacity: 0; } }
          @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
          @keyframes slidePdf { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } }
        </style>
      </head>
      <body>
        <main class="app">
          <aside class="sidebar">
            <div class="brand"><div class="brand-badge">LS</div><span>LearnSoft</span></div>
            <button class="new-chat">＋ Nuevo chat</button>
            <div class="history-title">Recientes</div>
            <div class="history-item active">Resolviendo una ecuación lineal</div>
            <div class="history-item">Ejercicio universitario con PDF</div>
            <div class="history-item">Derivadas e integrales</div>
            <div class="history-item">Técnicas de estudio efectivas</div>
          </aside>
          <section class="chat">
            <header class="chat-header">
              <div class="chat-title"><div class="bot-icon">🤖</div><div><div>TutorIA</div><small>Mentoría personalizada</small></div></div>
              <div class="header-actions"><button class="pill">Explicación</button><button class="pill">Resolución guiada</button><button class="pill">Documentos</button></div>
            </header>
            <div id="scene" class="scene-caption"><h1 id="scene-title">¿Y si una IA pudiera explicarte como un profesor particular?</h1><p id="scene-subtitle">TutorIA combina chat, pizarra inteligente y material real del estudiante.</p></div>
            <div id="chat-messages" class="messages"></div>
            <div class="composer"><textarea id="chat-input" aria-label="Mensaje" placeholder="Escribí tu pregunta aquí..."></textarea><button id="send-button" aria-label="Enviar mensaje">➤</button></div>
            <div id="detection" class="detection">Detectando necesidad de explicación guiada...</div>
          </section>
          <section class="whiteboard">
            <header class="board-head"><div><strong id="board-title">Resolución guiada</strong><span id="board-subtitle">Objetivo: resolver paso a paso</span></div><div id="board-status" class="board-status">Guardado</div></header>
            <div id="whiteboard-panel" class="board-panel"><div id="board-content" class="board-content"></div></div>
          </section>
        </main>
        <aside class="pdf-panel"><div class="pdf-sheet"><div class="pdf-title">Álgebra I — Guía práctica</div><div class="pdf-line" style="width:84%"></div><div class="pdf-line" style="width:72%"></div><div class="exercise"><strong>Ejercicio 4</strong><p>Resolver el sistema y justificar cada paso.</p><p>2a + b = 9<br/>a - b = 3</p></div><div class="pdf-line" style="width:92%"></div><div class="pdf-line" style="width:68%"></div><div class="pdf-line" style="width:78%"></div></div></aside>
        <section class="final"><div><div class="final-logo">LearnSoft.uy</div><div class="final-copy">Más que un chat.</div><div class="final-copy">Un tutor que piensa, explica y enseña.</div><div class="final-sub">IA para aprender de verdad.</div></div></section>
      </body>
    </html>
  `, { waitUntil: "domcontentloaded" });
}

test("TutorIA - Demo Pizarra Inteligente", async ({ page, testreelPage }) => {
  await testreelPage.navigate("about:blank");
  await mountDemo(page);
  await expect(page.locator("#chat-input")).toBeVisible();

  await hold(page, 2_800);

  await setSceneCaption(page, "El estudiante pregunta en lenguaje natural", "TutorIA entiende cuándo conviene explicar visualmente.");
  await sendStudentMessage(page, testreelPage, "No entiendo cómo resolver esta ecuación\n\n3x + 5 = 14", 900);
  await showDetection(page);
  await aiMessage(page, "Voy a abrir una resolución guiada para verlo paso a paso.", 800);

  await setSceneCaption(page, "Apertura automática de la Pizarra Inteligente", "TutorIA detecta que una explicación visual puede ayudar.");
  await openWhiteboard(page, "Resolución guiada", "Objetivo: Resolver una ecuación lineal paso a paso");

  await typeBoardBlock(page, "title", "Problema actual: 3x + 5 = 14", 650);
  await typeBoardBlock(page, "formula", "3x + 5 = 14", 650);
  await typeBoardBlock(page, "step", "Paso 1: Restamos 5 en ambos lados.", 650);
  await typeBoardBlock(page, "formula", "3x + 5 - 5 = 14 - 5", 600);
  await typeBoardBlock(page, "formula", "3x = 9", 650);
  await typeBoardBlock(page, "step", "Paso 2: Dividimos entre 3 para despejar x.", 600);
  await typeBoardBlock(page, "formula", "3x / 3 = 9 / 3", 600);
  await typeBoardBlock(page, "formula", "x = 3", 950);

  await setSceneCaption(page, "Chat y pizarra trabajan conectados", "La pregunta del estudiante apunta al paso exacto.");
  await sendStudentMessage(page, testreelPage, "¿Por qué restaste 5?", 700);
  await aiMessage(page, "Porque queremos dejar sola la incógnita x. Primero quitamos el término constante.", 700);
  await highlightBoardLine(page, 2, "Resaltando el paso consultado");
  await typeBoardBlock(page, "warning", "⚠️ Explicación: queremos dejar sola la incógnita x.", 1_000);

  await setSceneCaption(page, "Nuevo ejercicio, misma pizarra", "TutorIA reutiliza dinámicamente el espacio de trabajo.");
  await sendStudentMessage(page, testreelPage, "Ahora resolvé 4x + 9 = 7", 700);
  await showDetection(page, "Actualizando la pizarra con el nuevo problema...");
  await openWhiteboard(page, "Resolución guiada", "Problema actual: 4x + 9 = 7");
  await typeBoardBlock(page, "title", "Problema actual: 4x + 9 = 7", 550);
  await typeBoardBlock(page, "formula", "4x + 9 = 7", 550);
  await typeBoardBlock(page, "step", "Restamos 9 en ambos lados.", 500);
  await typeBoardBlock(page, "formula", "4x = -2", 500);
  await typeBoardBlock(page, "step", "Dividimos entre 4.", 500);
  await typeBoardBlock(page, "formula", "x = -1/2", 950);

  await setSceneCaption(page, "El trabajo queda guardado automáticamente", "Cerrar y volver a abrir restaura la resolución al instante.");
  await closeBoard(page);
  await aiMessage(page, "La resolución queda guardada automáticamente en tu conversación.", 650);
  await reopenBoard(page);

  await setSceneCaption(page, "También trabaja con material universitario", "TutorIA puede usar PDFs y ejercicios reales del estudiante.");
  await showPdfMode(page);
  await sendStudentMessage(page, testreelPage, "Ayudame con este ejercicio.", 650);
  await showDetection(page, "Leyendo el ejercicio resaltado en el PDF...");
  await typeBoardBlock(page, "title", "📖 Análisis", 350);
  await typeBoardBlock(page, "step", "Identificamos datos, incógnitas y condiciones del enunciado.", 450);
  await typeBoardBlock(page, "title", "✏️ Estrategia", 350);
  await typeBoardBlock(page, "step", "Ordenamos las ecuaciones antes de operar.", 450);
  await typeBoardBlock(page, "title", "🧪 Prueba de escritorio", 350);
  await typeBoardBlock(page, "step", "Verificamos cada reemplazo con el material original.", 450);
  await typeBoardBlock(page, "title", "✅ Solución", 900);

  await setSceneCaption(page, "TutorIA", "Más que responder: enseña el camino.");
  await finalCard(page);
});
