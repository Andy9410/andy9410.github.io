import type { WhiteboardEntry } from "@/types/whiteboard";
import { cn } from "@/lib/utils";
import { hasText } from "@/utils/whiteboardRenderGuards";

interface Props {
  entries: WhiteboardEntry[];
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

export function WhiteboardEntries({ entries }: Props) {
  const visibleEntries = entries.filter((entry) => hasText(entry.content));

  if (visibleEntries.length === 0) return null;

  return (
    <div className="shrink-0 border-t border-border bg-background px-3 py-2.5 max-h-56 overflow-y-auto">
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        Contenido de la pizarra
      </p>
      <ol className="flex flex-col gap-1.5">
        {visibleEntries.map((entry) => {
          const cfg = TYPE_CONFIG[entry.type] ?? TYPE_CONFIG.TEXT;
          const prefix = cfg.prefixFn
            ? cfg.prefixFn(entry)
            : cfg.label
              ? `${cfg.label}: `
              : "";
          return (
            <li key={entry.id} className={cn("text-[11px] leading-relaxed text-foreground", cfg.style)}>
              {prefix && (
                <span className="font-semibold text-accent">{prefix}</span>
              )}
              {entry.content}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
