import { Loader2 } from "lucide-react";
import type { TeachingPhase } from "@/hooks/useWhiteboardTeaching";

interface Props {
  phase: TeachingPhase;
}

const PHASE_LABEL: Partial<Record<TeachingPhase, string>> = {
  THINKING:             "Pensando...",
  WRITING_FRAGMENT:     "Escribiendo en la resolución guiada...",
  ANALYZING_USER_INPUT: "Analizando tu respuesta...",
  CONTINUING:           "Continuando...",
  COMPLETED:            "Explicación completa ✓",
};

export function WhiteboardTeachingBar({
  phase,
}: Props) {
  const isWorking =
    phase === "THINKING" ||
    phase === "WRITING_FRAGMENT" ||
    phase === "ANALYZING_USER_INPUT" ||
    phase === "CONTINUING";

  const isWaiting = phase === "WAITING_USER_INPUT" || phase === "USER_WRITING";
  const isCompleted = phase === "COMPLETED";

  if (phase === "IDLE" || isWaiting) return null;

  return (
    <div className="pointer-events-none absolute inset-x-4 top-4 z-30 flex justify-center">
      <div className="pointer-events-auto rounded-full bg-background/85 px-3 py-1.5 shadow-sm backdrop-blur-md">
        {/* Estado de actividad de la IA */}
        {isWorking && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-accent" />
            <span className="font-medium text-accent">{PHASE_LABEL[phase]}</span>
          </div>
        )}

        {/* Completado */}
        {isCompleted && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="text-accent font-medium">{PHASE_LABEL.COMPLETED}</span>
          </div>
        )}
      </div>
    </div>
  );
}
