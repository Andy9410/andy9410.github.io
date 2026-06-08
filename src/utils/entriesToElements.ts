import type { WhiteboardElement } from "@/types/whiteboard";
import type { WhiteboardEntry } from "@/types/whiteboard";
import { mathToUnicode } from "./mathToUnicode";
import { hasText } from "./whiteboardRenderGuards";

/** Strips common markdown syntax for clean whiteboard display. */
function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "$1")   // **bold**
    .replace(/\*(.+?)\*/g, "$1")        // *italic*
    .replace(/`(.+?)`/g, "$1")          // `code`
    .replace(/^#+\s+/gm, "")            // ## headers
    .replace(/^\s*[-*]\s+/gm, "• ")    // - list → bullet
    .replace(/^\s*\d+\.\s+/gm, (m) => m.trimStart()) // 1. keep number
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")  // [link](url) → text
    .replace(/_{1,2}(.+?)_{1,2}/g, "$1")  // __bold__ _italic_
    .trim();
}

const CANVAS_W = 500;
const X = 24;

export interface EntryLayout { id: number; y: number; height: number; }

/** Returns estimated y-positions for each entry (for SVG hit rects). */
export function computeEntryLayout(entries: WhiteboardEntry[]): EntryLayout[] {
  const sorted = entries
    .filter((entry) => hasText(entry.content))
    .sort((a, b) => a.orderIndex - b.orderIndex);
  const layout: EntryLayout[] = [];
  let y = 30;
  for (const entry of sorted) {
    const content = entry.content;
    const lineCount = Math.max(1, Math.ceil(content.length / CHARS_PER_LINE));
    let h: number;
    switch (entry.type) {
      case "TITLE":   h = lineCount * LINE_PX + BLOCK_GAP + 4; break;
      case "STEP":    h = Math.max(50, lineCount * LINE_PX + 20) + BLOCK_GAP; break;
      case "FORMULA": h = lineCount * LINE_PX + BLOCK_GAP; break;
      case "EXAMPLE":
      case "WARNING": h = Math.max(48, lineCount * LINE_PX + 20) + BLOCK_GAP; break;
      default:        h = lineCount * LINE_PX + BLOCK_GAP; break;
    }
    layout.push({ id: entry.id, y, height: h });
    y += h;
  }
  return layout;
}
const CHARS_PER_LINE = 100;
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
  const sorted = entries
    .filter((entry) => hasText(entry.content))
    .sort((a, b) => a.orderIndex - b.orderIndex);
  const elements: WhiteboardElement[] = [];
  let y = 30;

  for (const entry of sorted) {
    const id = `entry-${entry.id}`;
    const content = mathToUnicode(stripMarkdown(entry.content));
    if (!hasText(content)) continue;

    switch (entry.type) {
      case "TITLE": {
        const lines = wrapText(content, CHARS_PER_LINE + 4);
        elements.push({ id, type: "text", x: X, y, text: lines.join("\n"), stroke: "#ffffff" });
        y += lines.length * LINE_PX + BLOCK_GAP + 4;
        break;
      }
      case "TEXT": {
        const lines = wrapText(content);
        elements.push({ id, type: "text", x: X, y, text: lines.join("\n"), stroke: "#ffffff" });
        y += lines.length * LINE_PX + BLOCK_GAP;
        break;
      }
      case "STEP": {
        const lines = wrapText(content);
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
        const lines = wrapText(content, CHARS_PER_LINE + 6);
        elements.push({ id, type: "equation", x: X + 20, y: y + 4, text: lines.join("\n"), stroke: "#ffffff" });
        y += lines.length * LINE_PX + BLOCK_GAP;
        break;
      }
      case "EXAMPLE": {
        const lines = wrapText("Ej: " + content);
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
        const lines = wrapText("⚠ " + content);
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
        const lines = wrapText("? " + content);
        elements.push({ id, type: "text", x: X, y, text: lines.join("\n"), stroke: "#ffffff" });
        y += lines.length * LINE_PX + BLOCK_GAP;
        break;
      }
      default: {
        const lines = wrapText(content);
        elements.push({ id, type: "text", x: X, y, text: lines.join("\n"), stroke: "#ffffff" });
        y += lines.length * LINE_PX + BLOCK_GAP;
        break;
      }
    }
  }

  return elements;
}
