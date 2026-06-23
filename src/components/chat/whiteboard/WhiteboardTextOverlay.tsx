import { useMemo } from "react";
import MarkdownIt from "markdown-it";
import texmath from "markdown-it-texmath";
import katex from "katex";
import "katex/dist/katex.min.css";
import type { WhiteboardEntry } from "@/types/whiteboard";
import { hasText } from "@/utils/whiteboardRenderGuards";

const md = new MarkdownIt({ html: false, breaks: true, linkify: false })
  .use(texmath, {
    engine: katex,
    delimiters: "dollars",
    katexOptions: { throwOnError: false, output: "html" },
  });

function entryToMarkdown(entry: WhiteboardEntry): string {
  const c = entry.content.trim();
  switch (entry.type) {
    case "TITLE":   return `## ${c}\n\n`;
    case "STEP":    return `**${c}**\n\n`;
    case "FORMULA": return `$$${c}$$\n\n`;
    case "EXAMPLE": return `> **Ej:** ${c}\n\n`;
    case "WARNING": return `> ⚠ ${c}\n\n`;
    case "QUESTION": return `*${c}*\n\n`;
    default:        return `${c}\n\n`;
  }
}

interface Props {
  entries: WhiteboardEntry[];
}

export function WhiteboardTextOverlay({ entries }: Props) {
  const html = useMemo(() => {
    const visibleEntries = entries.filter((entry) => hasText(entry.content));
    if (visibleEntries.length === 0) return "";
    const sorted = visibleEntries.sort((a, b) => a.orderIndex - b.orderIndex);
    const combined = sorted.map(entryToMarkdown).join("");
    return md.render(combined);
  }, [entries]);

  if (!html) return null;

  return (
    <div
      className="absolute inset-0 overflow-y-auto overflow-x-hidden"
      style={{ zIndex: 5, pointerEvents: "none" }}
      // @ts-expect-error — inert is valid HTML5 but not in React types yet
      inert=""
    >
      <div
        className="px-6 py-5 whiteboard-overlay-content"
        style={{ maxWidth: "100%", wordBreak: "break-word", overflowWrap: "break-word" }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
