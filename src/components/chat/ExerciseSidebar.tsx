import { BookOpen, Loader2, X } from "lucide-react";

import { cn } from "@/lib/utils";
import type { ActiveExercise } from "@/types/chat";
import type { DetectedExercise } from "@/types/pdfExercises";

interface Props {
  exercises: DetectedExercise[];
  loading?: boolean;
  collapsed: boolean;
  compact: boolean;
  activeExercise: ActiveExercise | null;
  onExerciseSelect: (exercise: ActiveExercise) => void;
  onOpenWhiteboard?: (exercise: DetectedExercise) => void;
  onToggle: () => void;
}

function exerciseLabel(exercise: DetectedExercise) {
  return /^ejercicio\b/i.test(exercise.title.trim())
    ? exercise.title.trim()
    : `Ejercicio ${exercise.id}`;
}

export function ExerciseSidebar({
  exercises,
  loading = false,
  collapsed,
  compact,
  activeExercise,
  onExerciseSelect,
  onOpenWhiteboard,
  onToggle,
}: Props) {
  if (collapsed) return null;

  return (
    <aside
      className={cn(
        "flex min-h-0 flex-col overflow-hidden border-border/80 bg-background/95 shadow-lg backdrop-blur",
        compact
          ? "absolute inset-y-3 right-3 z-30 w-[min(18rem,calc(100%-1.5rem))] rounded-xl border"
          : "w-72 shrink-0 border-l bg-background/88 shadow-none"
      )}
    >
      <div className="flex shrink-0 items-center justify-between border-b border-border/70 px-4 py-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">Índice del documento</p>
          <p className="truncate text-[11px] text-muted-foreground">
            {loading
              ? "Buscando ejercicios detectados"
              : exercises.length === 0
                ? "Sin coincidencias detectadas"
                : `${exercises.length} ejercicio${exercises.length === 1 ? "" : "s"}`}
          </p>
        </div>

        <button
          type="button"
          onClick={onToggle}
          aria-label="Cerrar índice de ejercicios"
          title="Cerrar índice de ejercicios"
          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 py-2">
        {loading ? (
          <div className="flex h-full min-h-40 flex-col items-center justify-center gap-3 px-4 text-center">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <p className="text-xs text-muted-foreground">
              Detectando ejercicios dentro del PDF.
            </p>
          </div>
        ) : exercises.length === 0 ? (
          <div className="flex h-full min-h-40 flex-col items-center justify-center gap-3 px-4 text-center">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <BookOpen className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">No se detectaron ejercicios</p>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Este PDF no trae encabezados reconocibles como ejercicios o todavía no llegó
                metadata de posiciones.
              </p>
            </div>
          </div>
        ) : (
          <ul className="space-y-1">
            {exercises.map((exercise) => {
              const isActive = activeExercise?.number === exercise.id;

              return (
                <li key={`${exercise.id}-${exercise.pageNumber}`}>
                  <button
                    type="button"
                    onClick={() =>
                      onExerciseSelect({
                        number: exercise.id,
                        page: exercise.pageNumber,
                        bbox: exercise.boundingBox,
                        title: exercise.title,
                      })
                    }
                    aria-label={`Ir a ${exerciseLabel(exercise)}, página ${exercise.pageNumber}`}
                    className={cn(
                      "flex w-full flex-col gap-1 rounded-lg border px-3 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                      isActive
                        ? "border-primary/40 bg-primary/10 text-foreground shadow-sm"
                        : "border-transparent text-foreground hover:border-border/70 hover:bg-accent/60"
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="line-clamp-2 text-sm font-medium">
                        {exerciseLabel(exercise)}
                      </span>
                      <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                        p. {exercise.pageNumber}
                      </span>
                    </div>

                    {exercise.text && exercise.text.trim() !== exercise.title.trim() && (
                      <span className="line-clamp-2 text-[11px] leading-relaxed text-muted-foreground">
                        {exercise.text}
                      </span>
                    )}
                  </button>

                  {onOpenWhiteboard && (
                    <button
                      type="button"
                      onClick={() => onOpenWhiteboard(exercise)}
                      className="ml-3 mt-1 text-[11px] font-medium text-primary transition-colors hover:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      Trabajar en resolución guiada
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </aside>
  );
}
