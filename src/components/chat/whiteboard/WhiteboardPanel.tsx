import { AlertCircle, Loader2, MessageSquareText, PanelRightClose, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import MarkdownIt from "markdown-it";
import texmath from "markdown-it-texmath";
import katex from "katex";
import "katex/dist/katex.min.css";
import type { ReasoningNode, Whiteboard, WhiteboardElement, WhiteboardEntry, WhiteboardQuestionResponsePair, WhiteboardSuggestion, WhiteboardTool } from "@/types/whiteboard";
import type { WhiteboardLesson } from "@/types/lesson";
import { useAutosaveWhiteboard } from "@/hooks/useAutosaveWhiteboard";
import { computeEntryLayout } from "@/utils/entriesToElements";
import type { WhiteboardAnimState } from "@/hooks/useWhiteboardAnimation";
import type { TeachingPhase } from "@/hooks/useWhiteboardTeaching";
import { hasText } from "@/utils/whiteboardRenderGuards";
import { WhiteboardCanvas } from "./WhiteboardCanvas";
import { WhiteboardAnimatedOverlay } from "./WhiteboardAnimatedOverlay";
import { WhiteboardLessonBar } from "./WhiteboardLessonBar";
import { WhiteboardSuggestionCard } from "./WhiteboardSuggestionCard";
import { WhiteboardTeachingBar } from "./WhiteboardTeachingBar";

const overlayMd = new MarkdownIt({ html: false, breaks: true, linkify: false })
  .use(texmath, { engine: katex, delimiters: "dollars", katexOptions: { throwOnError: false, output: "html" } });

function entryToMarkdown(entry: WhiteboardEntry): string {
  const c = (entry.content ?? "").trim();
  switch (entry.type) {
    case "TITLE":   return `## ${c}\n\n`;
    case "STEP":    return `**${c}**\n\n`;
    case "FORMULA": return `$$${c}$$\n\n`;
    case "EXAMPLE": return `> **Ej:** ${c}\n\n`;
    case "WARNING": return `> ⚠ ${c}\n\n`;
    case "QUESTION": return `*${c}*\n\n`;
    default:        return `${c}\n\n`;
  }
}

interface Props {
  whiteboard: Whiteboard | null;
  token: string | null;
  suggestion: WhiteboardSuggestion | null;
  askStatus?: "idle" | "sending" | "generating";
  loading?: boolean;
  error?: string | null;
  onChangeData: (updater: (data: Whiteboard["data"]) => Whiteboard["data"]) => void;
  onAskWhiteboard: () => void;
  onApplySuggestion: () => void;
  onIgnoreSuggestion: () => void;
  onClose: () => void;
  lesson?: WhiteboardLesson | null;
  lessonStepIndex?: number;
  lessonGenerating?: boolean;
  lessonError?: string | null;
  lessonOverlayElements?: WhiteboardElement[];
  onLessonNext?: () => void;
  onLessonPrev?: () => void;
  onLessonClose?: () => void;
  teachingEntries?: WhiteboardEntry[];
  conversationId?: number | null;
  onClearTeachingEntries?: () => void;
  animState?: WhiteboardAnimState;
  onEraseTeachingEntry?: (entryId: number) => void;
  reasoningNodes?: ReasoningNode[];
  // Teaching session props
  teachingPhase?: TeachingPhase;
  questionPairs?: WhiteboardQuestionResponsePair[];
  activeQuestionId?: string | null;
  onTeachingSubmit?: () => void;
  onTeachingContinue?: () => void;
}

const STROKE_COLOR = "#0f172a";

const TEACHING_STATUS_LABEL: Partial<Record<TeachingPhase, string>> = {
  THINKING: "Pensando",
  WRITING_FRAGMENT: "Explicando",
  WAITING_USER_INPUT: "Esperando respuesta",
  USER_WRITING: "Respuesta en curso",
  ANALYZING_USER_INPUT: "Analizando respuesta",
  CONTINUING: "Continuando",
  COMPLETED: "Completo",
};

export function WhiteboardPanel({
  whiteboard,
  token,
  suggestion,
  askStatus = "idle",
  loading = false,
  error = null,
  onChangeData,
  onAskWhiteboard,
  onApplySuggestion,
  onIgnoreSuggestion,
  onClose,
  lesson = null,
  lessonStepIndex = 0,
  lessonGenerating = false,
  lessonError = null,
  lessonOverlayElements = [],
  onLessonNext,
  onLessonPrev,
  onLessonClose,
  teachingEntries = [],
  conversationId = null,
  onClearTeachingEntries,
  onEraseTeachingEntry,
  animState,
  reasoningNodes = [],
  teachingPhase = "IDLE",
  questionPairs = [],
  activeQuestionId = null,
  onTeachingSubmit,
  onTeachingContinue,
}: Props) {
  const [tool, setTool] = useState<WhiteboardTool>("select");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showGrid, setShowGrid] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [expandedQuestionIds, setExpandedQuestionIds] = useState<Set<string>>(() => new Set());
  const autosave = useAutosaveWhiteboard(whiteboard, token);
  const askLabel =
    askStatus === "sending"
      ? "Enviando a IA..."
      : askStatus === "generating"
        ? "Respuesta generándose..."
        : "Preguntar sobre la resolución guiada";
  const visibleTeachingEntries = useMemo(
    () => teachingEntries.filter((entry) => hasText(entry.content)),
    [teachingEntries]
  );

  // Static HTML fallback (used when animation is COMPLETED or no anim state)
  const overlayHtml = useMemo(() => {
    if (!animState || animState.phase === "IDLE") {
      if (visibleTeachingEntries.length === 0) return undefined;
      const sorted = [...visibleTeachingEntries].sort((a, b) => a.orderIndex - b.orderIndex);
      try {
        return overlayMd.render(sorted.map(entryToMarkdown).join(""));
      } catch (err) {
        console.error("[WhiteboardPanel] overlay render failed", err);
        // Fallback a texto plano si markdown/KaTeX falla con algún contenido.
        return sorted.map((e) => `<p>${(e.content ?? "").replace(/[<>&]/g, "")}</p>`).join("");
      }
    }
    return undefined; // animated overlay handles display during animation
  }, [visibleTeachingEntries, animState]);

  const allOverlayElements = lessonOverlayElements;

  const entryLayout = useMemo(
    () => (visibleTeachingEntries.length > 0 ? computeEntryLayout(visibleTeachingEntries) : []),
    [visibleTeachingEntries]
  );

  const selectedElement = useMemo(
    () => whiteboard?.data.elements.find((element) => element.id === selectedId),
    [selectedId, whiteboard?.data.elements]
  );
  const isTeachingWaiting = teachingPhase === "WAITING_USER_INPUT" || teachingPhase === "USER_WRITING";
  const teachingActive = teachingPhase !== "IDLE" && teachingPhase !== "COMPLETED";
  const showTools = !focusMode && (toolsOpen || !teachingActive);
  const visibleAnimationBlocks = useMemo(
    () => (animState?.blocks ?? []).filter((block) => hasText(block.entry.content) || hasText(block.visibleText)),
    [animState?.blocks]
  );
  const activeBlockCount = visibleAnimationBlocks.length;
  const activeStepNumber =
    activeBlockCount > 0
      ? Math.min(Math.max(animState?.activeBlockIndex ?? 0, 0) + 1, activeBlockCount)
      : null;
  const stepLabel = activeStepNumber
    ? `Paso ${activeStepNumber}/${activeBlockCount}`
    : visibleTeachingEntries.length > 0
      ? `Paso ${visibleTeachingEntries.length}`
      : "Paso inicial";
  const statusLabel =
    askStatus !== "idle"
      ? askLabel
      : TEACHING_STATUS_LABEL[teachingPhase] ??
        (autosave.status === "saving" ? "Guardando" : autosave.status === "error" ? "Error al guardar" : "Guardado");
  const boardTitle = whiteboard?.exerciseLabel || whiteboard?.title || "Resolución guiada";
  const collapsedQuestionIds = useMemo(
    () =>
      questionPairs
        .filter((pair) => pair.status === "answered" && pair.questionId !== activeQuestionId && !expandedQuestionIds.has(pair.questionId))
        .filter((pair) => hasText(pair.question) && hasText(pair.answer))
        .map((pair) => pair.questionId),
    [activeQuestionId, expandedQuestionIds, questionPairs]
  );

  useEffect(() => {
    if (isTeachingWaiting) setTool("text");
  }, [isTeachingWaiting]);

  useEffect(() => {
    if (questionPairs.length === 0) {
      setFocusMode(false);
      setExpandedQuestionIds(new Set());
    }
  }, [questionPairs.length]);

  const toggleQuestionCollapsed = (questionId: string) => {
    setExpandedQuestionIds((current) => {
      const next = new Set(current);
      if (next.has(questionId)) {
        next.delete(questionId);
      } else {
        next.add(questionId);
      }
      return next;
    });
  };

  const handleAskWhiteboard = async () => {
    // Intentar guardar los últimos cambios, pero NO bloquear la consulta si falla
    autosave.flush().catch(() => {
      // Si falla el guardado, el estado visible ya muestra "Error al guardar"
    });
    onAskWhiteboard();
  };

  if (!whiteboard) {
    return (
      <div className="flex h-full min-h-[260px] flex-col items-center justify-center gap-2 bg-muted/20 px-4 text-center">
        {loading ? (
          <Loader2 className="h-8 w-8 animate-spin text-accent" aria-hidden="true" />
        ) : error ? (
          <AlertCircle className="h-8 w-8 text-destructive" aria-hidden="true" />
        ) : (
          <PanelRightClose className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
        )}
        <p className="text-sm font-medium text-foreground">
          {loading ? "Preparando resolución guiada" : error ? "No se pudo abrir la resolución guiada" : "No hay resolución guiada activa"}
        </p>
        <p className="max-w-xs text-xs text-muted-foreground">
          {error ?? "Aparecerá automáticamente cuando el tutor la necesite."}
        </p>
        <button
          type="button"
          onClick={onClose}
          className="mt-2 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          Cerrar
        </button>
      </div>
    );
  }

  return (
    <section className="flex h-full min-h-[260px] min-w-0 flex-col bg-background" aria-label="Resolución guiada">
      <header className="flex min-w-0 items-center gap-2 bg-background/95 px-4 py-3 shadow-[0_1px_0_rgba(15,23,42,0.08)]">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">{boardTitle}</p>
          <p className="truncate text-[11px] text-muted-foreground">{stepLabel} · {statusLabel}</p>
        </div>
        {questionPairs.length > 0 && (
          <button
            type="button"
            onClick={() => setFocusMode((value) => !value)}
            className={`inline-flex h-8 shrink-0 items-center rounded-full px-3 text-xs font-semibold transition ${
              focusMode
                ? "bg-accent text-accent-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
            }`}
          >
            {focusMode ? "Salir foco" : "Foco"}
          </button>
        )}
        <button
          type="button"
          onClick={handleAskWhiteboard}
          disabled={askStatus !== "idle"}
          aria-label="Preguntar a la IA sobre la resolución guiada actual"
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {askStatus === "idle" ? (
            <MessageSquareText className="h-3.5 w-3.5" aria-hidden="true" />
          ) : (
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
          )}
        </button>
        <button
          type="button"
          onClick={onClose}
          aria-label="Ocultar resolución guiada"
          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </header>


      <div className="relative min-h-0 flex-1 flex flex-col">
        <WhiteboardCanvas
          data={whiteboard.data}
          tool={tool}
          selectedId={selectedId}
          showGrid={showGrid}
          overlayElements={allOverlayElements}
          overlayHtml={overlayHtml}
          onEraseOverlay={onClearTeachingEntries}
          onEraseEntry={onEraseTeachingEntry}
          teachingEntryLayout={entryLayout}
          questionPairs={questionPairs}
          activeQuestionId={isTeachingWaiting ? activeQuestionId : null}
          collapsedQuestionIds={collapsedQuestionIds}
          focusMode={focusMode}
          onAnswerSubmit={onTeachingSubmit}
          onAnswerContinue={onTeachingContinue}
          onToggleQuestionCollapsed={toggleQuestionCollapsed}
          onToolChange={setTool}
          onSelect={setSelectedId}
          onChange={(data) => onChangeData(() => data)}
        />
        {/* Animated overlay — shown during animation phases */}
        {!focusMode && animState && animState.phase !== "IDLE" && (
          <WhiteboardAnimatedOverlay
            phase={animState.phase}
            thinkingMessage={animState.thinkingMessage}
            blocks={visibleAnimationBlocks}
            activeBlockIndex={animState.activeBlockIndex}
          />
        )}
        {/* Teaching session: prompt embedded in the whiteboard surface, not a parallel chat. */}
        {!focusMode && onTeachingSubmit && onTeachingContinue && (
          <WhiteboardTeachingBar
            phase={teachingPhase}
          />
        )}
      </div>

      {!focusMode && suggestion && suggestion.whiteboardId === whiteboard.id && (
        <WhiteboardSuggestionCard
          suggestion={suggestion}
          onApply={onApplySuggestion}
          onIgnore={onIgnoreSuggestion}
        />
      )}
    </section>
  );
}
