import { PanelRightClose } from "lucide-react";

import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { ActiveExercise } from "@/types/chat";
import type { DetectedExercise } from "@/types/pdfExercises";

interface Props {
  exercises: DetectedExercise[];
  loading?: boolean;
  collapsed: boolean;
  activeExercise: ActiveExercise | null;
  onExerciseSelect: (exercise: ActiveExercise) => void;
  onOpenWhiteboard?: (exercise: DetectedExercise) => void;
  onToggle: () => void;
}

export function ExerciseSidebar({
  exercises,
  loading = false,
  collapsed,
  activeExercise,
  onExerciseSelect,
  onOpenWhiteboard,
  onToggle,
}: Props) {
  if (collapsed) {
    return (
      <button
        type="button"
        onClick={onToggle}
        aria-label="Mostrar índice de ejercicios"
        className="absolute right-3 top-3 z-30 rounded-md border border-border/80 bg-background/95 px-2 py-1 text-[11px] font-medium text-muted-foreground shadow-sm backdrop-blur transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        Índice
      </button>
    );
  }

  return (
    <div className="absolute right-3 top-3 z-30 flex h-[50%] min-h-48 w-56 max-w-[46vw] flex-col overflow-hidden rounded-lg border border-border/80 bg-background/95 shadow-lg backdrop-blur">
      <div className="flex shrink-0 items-center justify-between border-b px-3 py-2">
        <p className="truncate text-xs font-semibold text-foreground">Índice</p>
        <button
          type="button"
          onClick={onToggle}
          aria-label="Ocultar índice de ejercicios"
          title="Ocultar índice de ejercicios"
          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <PanelRightClose className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
      <ScrollArea className="min-h-0 flex-1">
        {loading ? (
          <div className="flex justify-center py-4">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : exercises.length === 0 ? (
          <p className="px-3 py-4 text-xs text-muted-foreground">Sin ejercicios detectados</p>
        ) : (
          <ul className="py-1">
            {exercises.map((ex) => (
              <li key={ex.id}>
                <div className={cn(
                  "px-3 py-2 text-xs transition-colors hover:bg-accent",
                  activeExercise?.number === ex.id &&
                    "bg-amber-100 text-amber-950 dark:bg-amber-900/35 dark:text-amber-100"
                )}>
                  <button
                    type="button"
                    onClick={() =>
                      onExerciseSelect({
                        number: ex.id,
                        page: ex.pageNumber,
                        bbox: ex.boundingBox,
                        title: ex.title,
                      })
                    }
                    aria-label={`Ir a ${ex.title}, página ${ex.pageNumber}`}
                    className="block w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                  >
                    <span className="block truncate font-medium">{ex.title}</span>
                    <span className="text-[10px] text-muted-foreground">pág. {ex.pageNumber}</span>
                  </button>
                  {onOpenWhiteboard && (
                    <button
                      type="button"
                      onClick={() => onOpenWhiteboard(ex)}
                      className="mt-1 text-[10px] font-semibold text-accent underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      Trabajar en Pizarra
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </ScrollArea>
    </div>
  );
}
