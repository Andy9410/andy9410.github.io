import { Loader2, Send, SkipForward } from "lucide-react";
import type { TeachingPhase } from "@/hooks/useWhiteboardTeaching";

interface Props {
  phase: TeachingPhase;
  pauseQuestion: string | null;
  userDraft: string;
  onDraftChange: (v: string) => void;
  onSubmit: () => void;
  onContinueWithout: () => void;
}

const PHASE_LABEL: Partial<Record<TeachingPhase, string>> = {
  THINKING:             "Pensando...",
  WRITING_FRAGMENT:     "Escribiendo en la pizarra...",
  ANALYZING_USER_INPUT: "Analizando tu respuesta...",
  CONTINUING:           "Continuando...",
  COMPLETED:            "Explicación completa ✓",
};

export function WhiteboardTeachingBar({
  phase,
  pauseQuestion,
  userDraft,
  onDraftChange,
  onSubmit,
  onContinueWithout,
}: Props) {
  const isWorking =
    phase === "THINKING" ||
    phase === "WRITING_FRAGMENT" ||
    phase === "ANALYZING_USER_INPUT" ||
    phase === "CONTINUING";

  const isWaiting = phase === "WAITING_USER_INPUT" || phase === "USER_WRITING";
  const isCompleted = phase === "COMPLETED";

  if (phase === "IDLE") return null;

  return (
    <div className="border-t border-border bg-background/95 backdrop-blur-sm">
      {/* Estado de actividad de la IA */}
      {isWorking && (
        <div className="flex items-center gap-2 px-4 py-2.5 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-accent" />
          <span className="font-medium text-accent">{PHASE_LABEL[phase]}</span>
        </div>
      )}

      {/* Completado */}
      {isCompleted && (
        <div className="flex items-center gap-2 px-4 py-2.5 text-xs text-muted-foreground">
          <span className="text-accent font-medium">{PHASE_LABEL.COMPLETED}</span>
        </div>
      )}

      {/* Pausa interactiva — la IA espera al alumno */}
      {isWaiting && (
        <div className="flex flex-col gap-2 px-4 py-3">
          {pauseQuestion && (
            <p className="text-sm font-medium text-foreground leading-snug">
              <span className="mr-1.5 text-accent">▶</span>
              {pauseQuestion}
            </p>
          )}

          <div className="flex items-center gap-2">
            <input
              type="text"
              autoFocus
              value={userDraft}
              onChange={(e) => onDraftChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  onSubmit();
                }
              }}
              placeholder="Escribí tu respuesta..."
              className="min-w-0 flex-1 rounded-md border border-border bg-muted/30 px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />

            <button
              type="button"
              onClick={onSubmit}
              disabled={!userDraft.trim()}
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Enviar respuesta"
            >
              <Send className="h-3.5 w-3.5" />
            </button>

            <button
              type="button"
              onClick={onContinueWithout}
              className="inline-flex h-8 shrink-0 items-center gap-1 rounded-md border border-border bg-background px-2.5 text-xs text-muted-foreground transition hover:bg-muted"
              title="Continuar sin responder"
            >
              <SkipForward className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Continuar</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
