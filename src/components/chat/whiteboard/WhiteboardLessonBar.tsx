import { ChevronLeft, ChevronRight, GraduationCap, Loader2, X } from "lucide-react";
import type { WhiteboardLesson } from "@/types/lesson";

interface Props {
  lesson: WhiteboardLesson | null;
  stepIndex: number;
  isGenerating: boolean;
  error: string | null;
  onNext: () => void;
  onPrev: () => void;
  onClose: () => void;
}

export function WhiteboardLessonBar({ lesson, stepIndex, isGenerating, error, onNext, onPrev, onClose }: Props) {
  if (!isGenerating && !lesson && !error) return null;

  const step = lesson?.steps[stepIndex];
  const total = lesson?.steps.length ?? 0;

  return (
    <div className="shrink-0 border-t border-sky-200/60 bg-sky-50/80 px-3 py-2.5 dark:border-sky-800/40 dark:bg-sky-950/30">
      <div className="mb-2 flex items-center gap-2">
        {isGenerating ? (
          <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-sky-600 dark:text-sky-400" />
        ) : (
          <GraduationCap className="h-3.5 w-3.5 shrink-0 text-sky-600 dark:text-sky-400" />
        )}
        <span className="min-w-0 flex-1 truncate text-xs font-semibold text-sky-900 dark:text-sky-200">
          {isGenerating ? "Generando explicación..." : (lesson?.title ?? "Explicación")}
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar explicación"
          className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {error && (
        <p className="rounded-md border border-destructive/30 bg-destructive/5 px-2.5 py-1.5 text-[11px] text-destructive">
          {error}
        </p>
      )}

      {step && !isGenerating && (
        <>
          <div className="rounded-md border border-sky-200/60 bg-background/70 px-2.5 py-1.5 dark:border-sky-800/40">
            <p className="mb-0.5 text-[11px] font-semibold text-sky-800 dark:text-sky-300">
              Paso {stepIndex + 1}: {step.title}
            </p>
            <p className="text-[11px] leading-relaxed text-muted-foreground">{step.explanation}</p>
          </div>

          <div className="mt-2 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={onPrev}
              disabled={stepIndex === 0}
              className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-3 w-3" />
              Anterior
            </button>
            <span className="text-[11px] font-medium text-muted-foreground">
              {stepIndex + 1} / {total}
            </span>
            <button
              type="button"
              onClick={onNext}
              disabled={stepIndex === total - 1}
              className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-40"
            >
              Siguiente
              <ChevronRight className="h-3 w-3" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
