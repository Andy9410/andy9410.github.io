import { Check, Sparkles, X } from "lucide-react";
import type { WhiteboardSuggestion } from "@/types/whiteboard";

interface Props {
  suggestion: WhiteboardSuggestion;
  onApply: () => void;
  onIgnore: () => void;
}

export function WhiteboardSuggestionCard({ suggestion, onApply, onIgnore }: Props) {
  return (
    <div className="border-t bg-accent/5 px-3 py-3">
      <div className="rounded-lg border border-accent/25 bg-background p-3 shadow-sm">
        <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-accent">
          <Sparkles className="h-4 w-4" aria-hidden="true" />
          Sugerencia de la IA
        </div>
        <p className="text-sm font-semibold text-foreground">{suggestion.title}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {suggestion.elements.length} elemento{suggestion.elements.length === 1 ? "" : "s"} listo para agregar.
        </p>
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={onApply}
            className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-semibold text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <Check className="h-3.5 w-3.5" aria-hidden="true" />
            Aplicar
          </button>
          <button
            type="button"
            onClick={onIgnore}
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-background px-3 text-xs font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
            Ignorar
          </button>
        </div>
      </div>
    </div>
  );
}
