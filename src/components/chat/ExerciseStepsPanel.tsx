import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BookOpenCheck, ChevronLeft, ChevronRight, Lightbulb, X } from "lucide-react";
import type { ExerciseBreakdown } from "@/types/chat";
import { cn } from "@/lib/utils";

interface Props {
  breakdown: ExerciseBreakdown | null;
  isOpen: boolean;
  isLoading?: boolean;
  error?: string | null;
  onOpen: () => void;
  onClose: () => void;
}

const ExerciseStepsPanel = ({ breakdown, isOpen, isLoading = false, error = null, onOpen, onClose }: Props) => {
  const [index, setIndex] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);

  const steps = breakdown?.steps ?? [];
  const current = steps[index];
  const total = steps.length;

  useEffect(() => {
    setIndex(0);
  }, [breakdown?.exerciseTitle]);

  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [index, breakdown?.exerciseTitle]);

  const progress = total > 0 ? ((index + 1) / total) * 100 : 0;

  return (
    <AnimatePresence>
      {!isOpen && breakdown && (
        <motion.button
          type="button"
          onClick={onOpen}
          className="absolute bottom-24 right-3 z-30 flex max-w-[calc(100%-1.5rem)] items-center gap-2 rounded-lg border border-border bg-background/95 px-3 py-2 text-left text-xs font-medium text-foreground shadow-lg backdrop-blur transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:right-4"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          aria-label="Mostrar guía paso a paso del ejercicio"
        >
          <BookOpenCheck className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
          <span className="min-w-0">
            <span className="block truncate">
              {breakdown?.exerciseTitle ?? "Preparando guía"}
            </span>
            <span className="block text-[11px] font-normal text-muted-foreground">
              Ver guía paso a paso
            </span>
          </span>
        </motion.button>
      )}

      {isOpen && (
        <>
          <motion.div
            className="absolute inset-0 z-40 bg-background/55 backdrop-blur-[1px] lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.aside
            className="absolute bottom-24 right-3 top-3 z-50 flex w-[min(28rem,calc(100%-1.5rem))] flex-col overflow-hidden rounded-lg border border-border bg-background shadow-xl dark:bg-card sm:right-4"
            initial={{ x: "100%", opacity: 0.96 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0.96 }}
            transition={{ type: "spring", stiffness: 280, damping: 30 }}
            aria-label="Desglose del ejercicio"
          >
            <header className="border-b bg-muted/40 px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-accent">
                    <BookOpenCheck className="h-4 w-4" aria-hidden="true" />
                    Guía del ejercicio
                  </div>
                  <h2 className="break-words text-base font-semibold leading-tight text-foreground">
                    {breakdown?.exerciseTitle ?? "Desglose del ejercicio"}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  aria-label="Cerrar desglose"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>

              <div className="mt-4">
                <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{total > 0 ? `Paso ${index + 1} de ${total}` : "Preparando pasos"}</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <motion.div
                    className="h-full rounded-full bg-accent"
                    initial={false}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                  />
                </div>
              </div>
            </header>

            <div ref={contentRef} className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
              {isLoading ? (
                <div className="space-y-4">
                  <div className="h-5 w-32 animate-pulse rounded bg-muted" />
                  <div className="h-28 animate-pulse rounded-lg bg-muted/70" />
                  <div className="h-20 animate-pulse rounded-lg bg-muted/70" />
                </div>
              ) : error ? (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
                  {error}
                </div>
              ) : current ? (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`${breakdown?.exerciseTitle}-${current.stepNumber}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="space-y-5"
                  >
                    <div>
                      <div className="mb-2 text-xs font-semibold text-accent">
                        Paso {current.stepNumber}
                      </div>
                      <h3 className="break-words text-lg font-semibold leading-snug text-foreground">
                        {current.title}
                      </h3>
                    </div>

                    <p className="whitespace-pre-wrap break-words text-sm leading-7 text-foreground/80">
                      {current.content}
                    </p>

                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/30 dark:bg-amber-500/10">
                      <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-amber-700 dark:text-amber-300">
                        <Lightbulb className="h-4 w-4" />
                        Pista
                      </div>
                      <p className="break-words text-sm leading-6 text-amber-800 dark:text-amber-100">
                        {current.hint}
                      </p>
                    </div>
                  </motion.div>
                </AnimatePresence>
              ) : (
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                  No hay pasos disponibles para mostrar.
                </div>
              )}
            </div>

            <footer className="flex items-center justify-between gap-3 border-t bg-background px-4 py-3">
              <button
                type="button"
                onClick={() => setIndex((value) => Math.max(0, value - 1))}
                disabled={index === 0 || total === 0}
                aria-label="Ver paso anterior"
                className={cn(
                  "flex h-10 items-center gap-2 rounded-md border border-border px-3 text-sm font-medium transition-colors",
                  "hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  "disabled:cursor-not-allowed disabled:opacity-45"
                )}
              >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                Anterior
              </button>

              <button
                type="button"
                onClick={() => setIndex((value) => Math.min(total - 1, value + 1))}
                disabled={index >= total - 1 || total === 0}
                aria-label="Ver paso siguiente"
                className={cn(
                  "flex h-10 items-center gap-2 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors",
                  "hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  "disabled:cursor-not-allowed disabled:opacity-45"
                )}
              >
                Siguiente
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </footer>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

export default ExerciseStepsPanel;
