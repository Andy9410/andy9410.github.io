import { AlertCircle, ChevronDown, Loader2, MessageSquareText, PanelRightClose, Save, X } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import MarkdownIt from "markdown-it";
import texmath from "markdown-it-texmath";
import katex from "katex";
import "katex/dist/katex.min.css";
import type { InterpretMode, ReasoningNode, Whiteboard, WhiteboardElement, WhiteboardEntry, WhiteboardSuggestion, WhiteboardTool } from "@/types/whiteboard";
import type { WhiteboardLesson } from "@/types/lesson";
import { useAutosaveWhiteboard } from "@/hooks/useAutosaveWhiteboard";
import { computeEntryLayout } from "@/utils/entriesToElements";
import { WhiteboardCanvas } from "./WhiteboardCanvas";
import { WhiteboardLessonBar } from "./WhiteboardLessonBar";
import { WhiteboardSuggestionCard } from "./WhiteboardSuggestionCard";
import { WhiteboardToolbar } from "./WhiteboardToolbar";

const overlayMd = new MarkdownIt({ html: false, breaks: true, linkify: false })
  .use(texmath, { engine: katex, delimiters: "dollars", katexOptions: { throwOnError: false, output: "html" } });

function entryToMarkdown(entry: WhiteboardEntry): string {
  const c = entry.content.trim();
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
  interpretMode?: InterpretMode;
  onInterpretModeChange?: (mode: InterpretMode) => void;
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
  onClearTeachingEntries?: () => void;
  onEraseTeachingEntry?: (entryId: number) => void;
  reasoningNodes?: ReasoningNode[];
}

const MODE_LABELS: Record<InterpretMode, string> = {
  auto: "Automático",
  math: "Matemática",
  algorithm: "Algoritmo",
  flowchart: "Diagrama",
  text: "Texto",
};

const MODE_OPTIONS: InterpretMode[] = ["auto", "math", "algorithm", "flowchart", "text"];

const STROKE_COLOR = "#0f172a";

export function WhiteboardPanel({
  whiteboard,
  token,
  suggestion,
  askStatus = "idle",
  loading = false,
  error = null,
  interpretMode = "auto",
  onInterpretModeChange,
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
  onClearTeachingEntries,
  onEraseTeachingEntry,
  reasoningNodes = [],
}: Props) {
  const [tool, setTool] = useState<WhiteboardTool>("select");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showGrid, setShowGrid] = useState(false);
  const [modeMenuOpen, setModeMenuOpen] = useState(false);
  const modeMenuRef = useRef<HTMLDivElement>(null);
  const autosave = useAutosaveWhiteboard(whiteboard, token);
  const askLabel =
    askStatus === "sending"
      ? "Enviando a IA..."
      : askStatus === "generating"
        ? "Respuesta generándose..."
        : "Preguntar sobre la pizarra";

  // Build HTML string for foreignObject rendering (markdown + KaTeX)
  const overlayHtml = useMemo(() => {
    if (teachingEntries.length === 0) return undefined;
    const sorted = [...teachingEntries].sort((a, b) => a.orderIndex - b.orderIndex);
    return overlayMd.render(sorted.map(entryToMarkdown).join(""));
  }, [teachingEntries]);

  const allOverlayElements = lessonOverlayElements;

  const entryLayout = useMemo(
    () => (teachingEntries.length > 0 ? computeEntryLayout(teachingEntries) : []),
    [teachingEntries]
  );

  const selectedElement = useMemo(
    () => whiteboard?.data.elements.find((element) => element.id === selectedId),
    [selectedId, whiteboard?.data.elements]
  );

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
          {loading ? "Preparando pizarra" : error ? "No se pudo abrir la pizarra" : "No hay pizarra activa"}
        </p>
        <p className="max-w-xs text-xs text-muted-foreground">
          {error ?? "Abrí una desde la conversación o desde un ejercicio del PDF."}
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
    <section className="flex h-full min-h-[260px] min-w-0 flex-col bg-background" aria-label="Pizarra inteligente">
      <header className="flex min-w-0 items-center gap-3 border-b bg-background px-3 py-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">{whiteboard.title}</p>
          <p className="truncate text-[11px] text-muted-foreground">
            {whiteboard.exerciseLabel ? `${whiteboard.exerciseLabel} · ` : ""}Hoja compartida con el tutor IA
          </p>
        </div>
        {/* Interpret mode selector */}
        <div className="relative" ref={modeMenuRef}>
          <button
            type="button"
            onClick={() => setModeMenuOpen(!modeMenuOpen)}
            onBlur={(e) => {
              if (!modeMenuRef.current?.contains(e.relatedTarget)) {
                setModeMenuOpen(false);
              }
            }}
            className="inline-flex h-8 shrink-0 items-center gap-1 rounded-md border border-border bg-background px-2 text-xs font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-label="Modo de interpretación"
          >
            <span className="hidden sm:inline">Interpretar como:</span>
            <span className="font-semibold text-foreground">{MODE_LABELS[interpretMode]}</span>
            <ChevronDown className="h-3 w-3" aria-hidden="true" />
          </button>
          {modeMenuOpen && (
            <div className="absolute right-0 top-full z-50 mt-1 min-w-[160px] overflow-hidden rounded-lg border border-border bg-popover py-1 shadow-lg">
              {MODE_OPTIONS.map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => {
                    onInterpretModeChange?.(mode);
                    setModeMenuOpen(false);
                  }}
                  className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs transition ${
                    interpretMode === mode
                      ? "bg-accent font-semibold text-accent-foreground"
                      : "text-popover-foreground hover:bg-muted"
                  }`}
                >
                  {MODE_LABELS[mode]}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Save className="h-3.5 w-3.5" aria-hidden="true" />
          {autosave.status === "saving" ? "Guardando..." : autosave.status === "error" ? "Error al guardar" : "Guardado"}
        </div>
        <button
          type="button"
          onClick={handleAskWhiteboard}
          disabled={askStatus !== "idle"}
          aria-label="Preguntar a la IA sobre la pizarra actual"
          className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md border border-border bg-background px-2.5 text-xs font-medium text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {askStatus === "idle" ? (
            <MessageSquareText className="h-3.5 w-3.5" aria-hidden="true" />
          ) : (
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
          )}
          <span className="max-w-[150px] truncate">{askLabel}</span>
        </button>
        <button
          type="button"
          onClick={onClose}
          aria-label="Ocultar pizarra"
          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </header>


      <WhiteboardToolbar
        tool={tool}
        selectedElement={selectedElement}
        showGrid={showGrid}
        onToggleGrid={() => setShowGrid((g) => !g)}
        onToolChange={(nextTool) => {
          if (nextTool === "erase" && selectedId) {
            onChangeData((data) => ({
              ...data,
              elements: data.elements.filter((element) => element.id !== selectedId),
            }));
            setSelectedId(null);
            setTool("select");
            return;
          }
          setTool(nextTool);
        }}
        onSelectedTextChange={(text) => {
          if (!selectedId) return;
          onChangeData((data) => ({
            ...data,
            elements: data.elements.map((element) =>
              element.id === selectedId ? { ...element, text } : element
            ),
          }));
        }}
        onInsertSymbol={(symbol) => {
          const id = crypto.randomUUID();
          const count = whiteboard?.data.elements.filter((e) => e.type === "equation").length ?? 0;
          const offset = count * 36;
          onChangeData((data) => ({
            ...data,
            elements: [
              ...data.elements,
              { id, type: "equation" as const, x: 40 + offset, y: 80 + offset, text: symbol, stroke: STROKE_COLOR },
            ],
          }));
          setSelectedId(id);
          setTool("select");
        }}
      />

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
        onToolChange={setTool}
        onSelect={setSelectedId}
        onChange={(data) => onChangeData(() => data)}
      />

      {suggestion && suggestion.whiteboardId === whiteboard.id && (
        <WhiteboardSuggestionCard
          suggestion={suggestion}
          onApply={onApplySuggestion}
          onIgnore={onIgnoreSuggestion}
        />
      )}
    </section>
  );
}
