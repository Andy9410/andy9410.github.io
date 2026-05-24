import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { ActiveExercise } from "@/types/chat";
import type { ExerciseOut } from "@/services/documentApi";

interface Props {
  exercises: ExerciseOut[];
  activeExercise: ActiveExercise | null;
  onExerciseSelect: (exercise: ActiveExercise) => void;
  docName: string | null;
}

export function ExerciseSidebar({ exercises, activeExercise, onExerciseSelect, docName }: Props) {
  return (
    <div className="flex w-52 shrink-0 flex-col border-l bg-muted/30">
      <div className="border-b px-3 py-2">
        <p className="truncate text-xs font-semibold text-muted-foreground">
          {docName ?? "Ejercicios"}
        </p>
      </div>
      <ScrollArea className="flex-1">
        {exercises.length === 0 ? (
          <p className="px-3 py-4 text-xs text-muted-foreground">Sin ejercicios detectados</p>
        ) : (
          <ul className="py-1">
            {exercises.map((ex) => (
              <li key={ex.number}>
                <button
                  type="button"
                  onClick={() =>
                    onExerciseSelect({ number: ex.number, page: ex.page, bbox: ex.bbox })
                  }
                  className={cn(
                    "w-full px-3 py-2 text-left text-xs transition-colors hover:bg-accent",
                    activeExercise?.number === ex.number &&
                      "bg-amber-100 dark:bg-amber-900/30"
                  )}
                >
                  <span className="font-medium">Ejercicio {ex.number}</span>
                  {ex.title && (
                    <span className="block truncate text-muted-foreground">{ex.title}</span>
                  )}
                  <span className="text-[10px] text-muted-foreground">Pág. {ex.page}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </ScrollArea>
    </div>
  );
}
