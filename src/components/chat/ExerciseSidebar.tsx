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
  onToggle: () => void;
}

export function ExerciseSidebar({
  exercises,
  loading = false,
  collapsed,
  activeExercise,
  onExerciseSelect,
  onToggle,
}: Props) {
  if (collapsed) {
    return (
      <button
        type="button"
        onClick={onToggle}
        className="absolute right-3 top-3 z-30 rounded-md border border-border/80 bg-background/95 px-2 py-1 text-[11px] font-medium text-muted-foreground shadow-sm backdrop-blur hover:text-foreground"
      >
        Ejercicios
      </button>
    );
  }

  return (
    <div className="absolute bottom-3 right-3 top-3 z-30 flex w-56 max-w-[46vw] flex-col overflow-hidden rounded-lg border border-border/80 bg-background/95 shadow-lg backdrop-blur">
      <div className="flex items-center justify-between border-b px-3 py-2">
        <p className="truncate text-xs font-semibold text-foreground">Ejercicios</p>
        <button
          type="button"
          onClick={onToggle}
          className="rounded px-1.5 py-0.5 text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          Ocultar
        </button>
      </div>
      <ScrollArea className="flex-1">
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
                  className={cn(
                    "w-full px-3 py-2 text-left text-xs transition-colors hover:bg-accent",
                    activeExercise?.number === ex.id &&
                      "bg-amber-100 text-amber-950 dark:bg-amber-900/35 dark:text-amber-100"
                  )}
                >
                  <span className="block truncate font-medium">{ex.title}</span>
                  <span className="text-[10px] text-muted-foreground">pág. {ex.pageNumber}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </ScrollArea>
    </div>
  );
}
