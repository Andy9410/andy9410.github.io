import { useEffect, useRef } from "react";
import type { WhiteboardEntry } from "@/types/whiteboard";
import { cn } from "@/lib/utils";
import { hasText } from "@/utils/whiteboardRenderGuards";

interface Props {
  entries: WhiteboardEntry[];
  conversationId?: number | null;
}

const TYPE_CONFIG: Record<string, { label: string; style: string; prefixFn?: (e: WhiteboardEntry) => string }> = {
  TITLE: {
    label: "",
    style: "text-sm font-bold text-foreground border-b border-border pb-1 mb-0.5",
  },
  STEP: {
    label: "Paso",
    style: "border-l-2 border-accent bg-accent/5 pl-3",
    prefixFn: (e) => `Paso ${e.orderIndex + 1}: `,
  },
  FORMULA: {
    label: "Fórmula",
    style: "font-mono bg-muted/60 rounded px-2 py-0.5 text-[11px]",
  },
  EXAMPLE: {
    label: "Ejemplo",
    style: "border-l-2 border-emerald-400 bg-emerald-50/60 dark:bg-emerald-950/20 pl-3",
  },
  NOTE: {
    label: "Nota",
    style: "border-l-2 border-sky-400 bg-sky-50/60 dark:bg-sky-950/20 pl-3",
  },
  WARNING: {
    label: "⚠️",
    style: "bg-amber-50 border border-amber-200 dark:bg-amber-950/20 dark:border-amber-800/40 px-2 rounded",
  },
  QUESTION: {
    label: "?",
    style: "border border-border rounded px-2 italic text-muted-foreground",
  },
  HIGHLIGHT: {
    label: "",
    style: "bg-yellow-50 dark:bg-yellow-950/20 rounded px-1",
  },
  DRAWING_INSTRUCTION: {
    label: "Instrucción",
    style: "text-muted-foreground text-[10px] uppercase tracking-wide",
  },
  SYSTEM_NOTE: {
    label: "Nota",
    style: "text-muted-foreground italic text-[10px]",
  },
  TEXT: { label: "", style: "" },
  DRAWING: { label: "", style: "text-muted-foreground" },
};

/** Read-only chronological view of the guided-resolution workspace blocks. */
export function WhiteboardEntries({ entries, conversationId = null }: Props) {
  const visibleEntries = entries.filter((entry) => hasText(entry.content));

  const scrollRef = useRef<HTMLDivElement>(null);
  const restoredForRef = useRef<number | null>(null);

  // Restore the saved reading position once per conversation, after blocks are present.
  // localStorage (not session): the position must survive across browser sessions.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !conversationId || visibleEntries.length === 0) return;
    if (restoredForRef.current === conversationId) return;
    const saved = localStorage.getItem(`wb-scroll-${conversationId}`);
    if (saved != null) el.scrollTop = Number(saved);
    restoredForRef.current = conversationId;
  }, [conversationId, visibleEntries.length]);

  const handleScroll = () => {
    if (!conversationId || !scrollRef.current) return;
    localStorage.setItem(`wb-scroll-${conversationId}`, String(scrollRef.current.scrollTop));
  };

  if (visibleEntries.length === 0) return null;

  return (
    <div className="shrink-0 border-t border-border bg-background">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="max-h-72 overflow-y-auto px-3 py-2.5"
      >
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          Resolución guiada
        </p>
        <ol className="flex flex-col gap-1.5">
          {visibleEntries.map((entry) => {
            const cfg = TYPE_CONFIG[entry.type] ?? TYPE_CONFIG.TEXT;
            const prefix = cfg.prefixFn
              ? cfg.prefixFn(entry)
              : cfg.label
                ? `${cfg.label}: `
                : "";
            const isUser = entry.author === "user";
            return (
              <li key={entry.id} className={cn("text-[11px] leading-relaxed text-foreground", cfg.style)}>
                <span
                  className={cn(
                    "mr-1.5 inline-block rounded px-1 align-middle text-[9px] font-semibold uppercase tracking-wide",
                    isUser ? "bg-accent/15 text-accent" : "bg-muted text-muted-foreground"
                  )}
                >
                  {isUser ? "Tú" : "IA"}
                </span>
                {prefix && <span className="font-semibold text-accent">{prefix}</span>}
                {entry.content}
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
