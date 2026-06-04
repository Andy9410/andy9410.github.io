import type { WhiteboardElement } from "@/types/whiteboard";
import type { WhiteboardEntry } from "@/types/whiteboard";

const CANVAS_W = 520;
const X = 24;
const LINE_H = {
  TITLE: 44,
  TEXT: 32,
  STEP: 68,
  FORMULA: 40,
  EXAMPLE: 68,
  WARNING: 64,
  QUESTION: 44,
  DRAWING_INSTRUCTION: 30,
  SYSTEM_NOTE: 28,
};

/**
 * Converts teaching entries (inject_whiteboard_content blocks) into
 * WhiteboardElement[] positioned top-to-bottom for canvas overlay rendering.
 */
export function entriesToElements(entries: WhiteboardEntry[]): WhiteboardElement[] {
  const sorted = [...entries].sort((a, b) => a.orderIndex - b.orderIndex);
  const elements: WhiteboardElement[] = [];
  let y = 28;

  for (const entry of sorted) {
    const id = `entry-${entry.id}`;

    switch (entry.type) {
      case "TITLE":
        elements.push({ id, type: "text", x: X, y, text: entry.content, stroke: "#0f172a" });
        y += LINE_H.TITLE;
        break;

      case "TEXT":
        elements.push({ id, type: "text", x: X, y, text: entry.content, stroke: "#0f172a" });
        y += LINE_H.TEXT;
        break;

      case "STEP":
        elements.push({
          id, type: "rect",
          x: X, y,
          width: CANVAS_W, height: 55,
          text: entry.content,
          stroke: "#0f172a", fill: "#ffffff",
        });
        y += LINE_H.STEP;
        break;

      case "FORMULA":
        elements.push({ id, type: "equation", x: X + 20, y: y + 4, text: entry.content, stroke: "#0f172a" });
        y += LINE_H.FORMULA;
        break;

      case "EXAMPLE":
        elements.push({
          id, type: "rect",
          x: X, y,
          width: CANVAS_W, height: 55,
          text: "Ej: " + entry.content,
          stroke: "#0f172a", fill: "#f0fdf4",
        });
        y += LINE_H.EXAMPLE;
        break;

      case "WARNING":
        elements.push({
          id, type: "rect",
          x: X, y,
          width: CANVAS_W, height: 52,
          text: "⚠ " + entry.content,
          stroke: "#0f172a", fill: "#fffbeb",
        });
        y += LINE_H.WARNING;
        break;

      case "QUESTION":
        elements.push({ id, type: "text", x: X, y, text: "? " + entry.content, stroke: "#0f172a" });
        y += LINE_H.QUESTION;
        break;

      default:
        elements.push({ id, type: "text", x: X, y, text: entry.content, stroke: "#0f172a" });
        y += LINE_H.SYSTEM_NOTE;
        break;
    }
  }

  return elements;
}
