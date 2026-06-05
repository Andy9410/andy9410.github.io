import type { WhiteboardElement } from "@/types/whiteboard";
import type { WhiteboardEntry } from "@/types/whiteboard";

const CANVAS_W = 500;
const X = 24;
const CHARS_PER_LINE = 72;   // full canvas width for Caveat 22px in ~500px canvas
const LINE_PX = 34;           // px between wrapped lines
const BLOCK_GAP = 20;         // extra gap between blocks

/** Word-wraps text to multiple lines. */
function wrapText(text: string, maxChars = CHARS_PER_LINE): string[] {
  if (!text) return [""];
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines.length > 0 ? lines : [""];
}

/**
 * Converts teaching entries into WhiteboardElement[] for canvas overlay.
 * Text is stored as newline-joined lines so renderOverlayElement can split
 * them into SVG <tspan> elements.
 */
export function entriesToElements(entries: WhiteboardEntry[]): WhiteboardElement[] {
  const sorted = [...entries].sort((a, b) => a.orderIndex - b.orderIndex);
  const elements: WhiteboardElement[] = [];
  let y = 30;

  for (const entry of sorted) {
    const id = `entry-${entry.id}`;

    switch (entry.type) {
      case "TITLE": {
        const lines = wrapText(entry.content, CHARS_PER_LINE + 4);
        elements.push({ id, type: "text", x: X, y, text: lines.join("\n"), stroke: "#ffffff" });
        y += lines.length * LINE_PX + BLOCK_GAP + 4;
        break;
      }
      case "TEXT": {
        const lines = wrapText(entry.content);
        elements.push({ id, type: "text", x: X, y, text: lines.join("\n"), stroke: "#ffffff" });
        y += lines.length * LINE_PX + BLOCK_GAP;
        break;
      }
      case "STEP": {
        const lines = wrapText(entry.content);
        const h = Math.max(50, lines.length * LINE_PX + 20);
        elements.push({
          id, type: "rect",
          x: X, y,
          width: CANVAS_W, height: h,
          text: lines.join("\n"),
          stroke: "#ffffff", fill: "transparent",
        });
        y += h + BLOCK_GAP;
        break;
      }
      case "FORMULA": {
        const lines = wrapText(entry.content, CHARS_PER_LINE + 6);
        elements.push({ id, type: "equation", x: X + 20, y: y + 4, text: lines.join("\n"), stroke: "#ffffff" });
        y += lines.length * LINE_PX + BLOCK_GAP;
        break;
      }
      case "EXAMPLE": {
        const lines = wrapText("Ej: " + entry.content);
        const h = Math.max(50, lines.length * LINE_PX + 20);
        elements.push({
          id, type: "rect",
          x: X, y,
          width: CANVAS_W, height: h,
          text: lines.join("\n"),
          stroke: "#ffffff", fill: "rgba(255,255,255,0.08)",
        });
        y += h + BLOCK_GAP;
        break;
      }
      case "WARNING": {
        const lines = wrapText("⚠ " + entry.content);
        const h = Math.max(48, lines.length * LINE_PX + 20);
        elements.push({
          id, type: "rect",
          x: X, y,
          width: CANVAS_W, height: h,
          text: lines.join("\n"),
          stroke: "#ffffff", fill: "rgba(249,199,79,0.15)",
        });
        y += h + BLOCK_GAP;
        break;
      }
      case "QUESTION": {
        const lines = wrapText("? " + entry.content);
        elements.push({ id, type: "text", x: X, y, text: lines.join("\n"), stroke: "#ffffff" });
        y += lines.length * LINE_PX + BLOCK_GAP;
        break;
      }
      default: {
        const lines = wrapText(entry.content);
        elements.push({ id, type: "text", x: X, y, text: lines.join("\n"), stroke: "#ffffff" });
        y += lines.length * LINE_PX + BLOCK_GAP;
        break;
      }
    }
  }

  return elements;
}
