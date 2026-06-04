import type { WhiteboardEntry } from "@/types/whiteboard";
import { cn } from "@/lib/utils";

interface Props {
  entries: WhiteboardEntry[];
}

const TYPE_LABEL: Record<string, string> = {
  STEP: "Paso",
  FORMULA: "Fórmula",
  HIGHLIGHT: "Destacado",
  SYSTEM_NOTE: "Nota",
  TEXT: "",
  DRAWING: "",
};

const TYPE_STYLES: Record<string, string> = {
  STEP: "border-l-2 border-accent bg-accent/5 pl-3",
  FORMULA: "font-mono bg-muted/50 rounded px-2 py-1",
  HIGHLIGHT: "bg-amber-50 border border-amber-200 dark:bg-amber-950/20 dark:border-amber-800/40 px-2 rounded",
  SYSTEM_NOTE: "text-muted-foreground italic",
  TEXT: "",
  DRAWING: "text-muted-foreground",
};

export function WhiteboardEntries({ entries }: Props) {
  if (entries.length === 0) return null;

  return (
    <div className="shrink-0 border-t border-border bg-background px-3 py-2.5 max-h-52 overflow-y-auto">
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        Contenido de la pizarra
      </p>
      <ol className="flex flex-col gap-1.5">
        {entries.map((entry) => {
          const label = TYPE_LABEL[entry.type] ?? "";
          const styles = TYPE_STYLES[entry.type] ?? "";
          return (
            <li key={entry.id} className={cn("text-[11px] leading-relaxed text-foreground", styles)}>
              {label && (
                <span className="mr-1.5 font-semibold text-accent">
                  {label}{entry.type === "STEP" ? ` ${entry.orderIndex + 1}:` : ":"}
                </span>
              )}
              {entry.content}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
