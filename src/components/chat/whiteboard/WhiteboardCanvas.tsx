import { useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent, PointerEvent } from "react";
import type { WhiteboardData, WhiteboardElement, WhiteboardQuestionResponsePair, WhiteboardTool } from "@/types/whiteboard";
import { cn } from "@/lib/utils";
import { hasText } from "@/utils/whiteboardRenderGuards";
import { QuestionResponsePair } from "./QuestionResponsePair";
import { COLLAPSED_QUESTION_RESPONSE_HEIGHT, getQuestionResponsePairHeight, QUESTION_RESPONSE_CARD_GAP } from "./questionResponseLayout";

interface Props {
  data: WhiteboardData;
  tool: WhiteboardTool;
  selectedId: string | null;
  showGrid?: boolean;
  overlayElements?: WhiteboardElement[];
  overlayHtml?: string;
  onToolChange: (tool: WhiteboardTool) => void;
  onSelect: (id: string | null) => void;
  onChange: (data: WhiteboardData) => void;
  onEraseOverlay?: () => void;
  onEraseEntry?: (entryId: number) => void; // erase a specific teaching entry
  teachingEntryLayout?: Array<{ id: number; y: number; height: number }>;
  questionPairs?: WhiteboardQuestionResponsePair[];
  activeQuestionId?: string | null;
  collapsedQuestionIds?: string[];
  focusMode?: boolean;
  onAnswerSubmit?: () => void;
  onAnswerContinue?: () => void;
  onToggleQuestionCollapsed?: (questionId: string) => void;
}

type DragState =
    | { mode: "move"; id: string; startX: number; startY: number; originX: number; originY: number }
    | { mode: "draw"; id: string };

type TextEditState = {
  id: string;
  draft: string;
  original: string;
  x: number;
  y: number;
  isNew: boolean;
};

type CanvasRect = {
  questionId: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

type ElementBounds = Omit<CanvasRect, "questionId">;

const BOARD_BG     = "#2a5e1e";
const stroke       = "#ffffff";
const accent       = "#f9c74f";
const lessonStroke = "#ffffff";
const lessonFill   = "rgba(255,255,255,0.08)";
const CHALK_FONT   = "'Caveat', cursive";

function wrapCanvasText(text: string, maxChars: number, maxLines = Number.POSITIVE_INFINITY): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];

  for (const word of words) {
    if (lines.length === 0) {
      lines.push(word);
      continue;
    }

    const current = lines[lines.length - 1] ?? "";
    const next = current ? `${current} ${word}` : word;

    if (!current || next.length <= maxChars) {
      lines[lines.length - 1] = next;
      continue;
    }

    if (lines.length >= maxLines) {
      lines[maxLines - 1] = `${lines[maxLines - 1].replace(/\s+$/, "")}...`;
      return lines;
    }

    lines.push(word);
  }

  return lines.slice(0, Number.isFinite(maxLines) ? maxLines : lines.length);
}

export function WhiteboardCanvas({
  data,
  tool,
  selectedId,
  showGrid = true,
  overlayElements,
  overlayHtml,
  onToolChange,
  onSelect,
  onChange,
  onEraseOverlay,
  onEraseEntry,
  teachingEntryLayout,
  questionPairs = [],
  activeQuestionId = null,
  collapsedQuestionIds = [],
  focusMode = false,
  onAnswerSubmit,
  onAnswerContinue,
  onToggleQuestionCollapsed,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const textInputRef = useRef<HTMLTextAreaElement | null>(null);

  const [drag, setDrag] = useState<DragState | null>(null);
  const [editingText, setEditingText] = useState<TextEditState | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 640, height: 420 });
  const editingTextId = editingText?.id;

  const selected = useMemo(
      () => data.elements.find((element) => element.id === selectedId),
      [data.elements, selectedId]
  );

  // Global keyboard delete: works even if SVG element doesn't have DOM focus
  useEffect(() => {
    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key !== "Delete" && e.key !== "Backspace") return;
      if (editingText) return;                         // don't interfere with text editing
      const active = document.activeElement;
      if (active && active.tagName !== "BODY" && active !== svgRef.current) return; // input/textarea focused
      if (!selected) return;
      e.preventDefault();
      deleteElement(selected.id);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selected, editingText, data.elements]);   // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    requestAnimationFrame(() => {
      if (editingTextId) {
        const input = textInputRef.current;
        input?.focus({ preventScroll: true });
        input?.setSelectionRange(input.value.length, input.value.length);
        return;
      }

      if (tool === "text" || tool === "equation") {
        svgRef.current?.focus({ preventScroll: true });
      }
    });
  }, [editingTextId, tool]);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const updateSize = () => {
      const rect = node.getBoundingClientRect();
      setCanvasSize({
        width: Math.max(1, rect.width),
        height: Math.max(1, rect.height),
      });
    };

    updateSize();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", updateSize);
      return () => window.removeEventListener("resize", updateSize);
    }

    const observer = new ResizeObserver(updateSize);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const boardWidth = Math.max(320, canvasSize.width);
  const boardHeight = Math.max(280, canvasSize.height);
  const pairCardWidth = Math.min(760, Math.max(300, boardWidth - 32));
  const pairCardX = 16;
  const pairMaxChars = Math.max(26, Math.floor((pairCardWidth - 52) / 12));
  const collapsedQuestionIdSet = useMemo(
    () => new Set(collapsedQuestionIds),
    [collapsedQuestionIds]
  );
  const validQuestionPairs = useMemo(
    () =>
      questionPairs.filter((pair) => {
        if (!hasText(pair.question)) return false;
        if (pair.questionId === activeQuestionId) return true;
        return pair.status === "answered" && hasText(pair.answer);
      }),
    [activeQuestionId, questionPairs]
  );
  const latestQuestionId = validQuestionPairs.length > 0 ? validQuestionPairs[validQuestionPairs.length - 1]?.questionId ?? null : null;
  const focusQuestionId = activeQuestionId ?? latestQuestionId;
  const visibleQuestionPairs =
    focusMode && focusQuestionId
      ? validQuestionPairs.filter((pair) => pair.questionId === focusQuestionId)
      : validQuestionPairs;
  const lastTeachingBlockBottom = Math.max(
    0,
    ...(teachingEntryLayout ?? []).map((entry) => entry.y + entry.height)
  );
  const pairData = visibleQuestionPairs.map((pair) => {
    const collapsed = !focusMode && collapsedQuestionIdSet.has(pair.questionId);
    const questionLines = wrapCanvasText(pair.question, pairMaxChars);
    const questionHeight = collapsed ? 0 : Math.max(132, 82 + questionLines.length * 36);
    const showAnswer = pair.questionId === activeQuestionId || (pair.status === "answered" && hasText(pair.answer));
    const answerHeight = collapsed || !showAnswer ? 0 : pair.questionId === activeQuestionId ? 188 : 138;
    const height = collapsed
      ? COLLAPSED_QUESTION_RESPONSE_HEIGHT + 14
      : !showAnswer
        ? questionHeight + 18
      : getQuestionResponsePairHeight(questionHeight, answerHeight);

    return { pair, questionLines, questionHeight, answerHeight, collapsed, showAnswer, height };
  });
  const desiredPairY = focusMode ? 32 : lastTeachingBlockBottom > 0 ? lastTeachingBlockBottom + 36 : 118;
  const pairStartY = focusMode ? Math.max(32, desiredPairY) : Math.max(96, desiredPairY);
  let pairCursorY = pairStartY;
  const pairLayouts = pairData.map((item) => {
    const y = pairCursorY;
    pairCursorY += item.height;
    return {
      ...item,
      x: pairCardX,
      y,
      width: pairCardWidth,
      answerY: y + item.questionHeight + QUESTION_RESPONSE_CARD_GAP,
    };
  });
  const activePair = visibleQuestionPairs.find((pair) => pair.questionId === activeQuestionId) ?? null;
  const activePairLayout = pairLayouts.find((layout) => layout.pair.questionId === activeQuestionId);
  const canvasContentHeight = Math.max(boardHeight, pairCursorY + 24);
  const activePairTop = activePairLayout?.y;
  const questionCardRects: CanvasRect[] = pairLayouts
    .filter((layout) => !layout.collapsed && layout.questionHeight > 0)
    .map((layout) => ({
      questionId: layout.pair.questionId,
      x: layout.x,
      y: layout.y,
      width: layout.width,
      height: layout.questionHeight,
    }));
  const answerCardRects: CanvasRect[] = pairLayouts
    .filter((layout) => !layout.collapsed && layout.showAnswer && layout.answerHeight > 0)
    .map((layout) => ({
      questionId: layout.pair.questionId,
      x: layout.x,
      y: layout.answerY,
      width: layout.width,
      height: layout.answerHeight,
    }));
  const getElementBounds = (element: WhiteboardElement): ElementBounds => {
    if (element.type === "text" || element.type === "equation") {
      const lines = (element.text ?? "").split("\n");
      const longestLine = Math.max(1, ...lines.map((line) => line.length));
      const fontSize = element.type === "equation" ? 26 : 22;

      return {
        x: element.x,
        y: element.y - fontSize,
        width: Math.max(72, longestLine * 12),
        height: Math.max(30, lines.length * fontSize * 1.45),
      };
    }

    if (element.type === "path" && element.points && element.points.length > 0) {
      const xs = element.points.map((point) => point.x);
      const ys = element.points.map((point) => point.y);
      const minX = Math.min(...xs);
      const minY = Math.min(...ys);

      return {
        x: minX,
        y: minY,
        width: Math.max(1, Math.max(...xs) - minX),
        height: Math.max(1, Math.max(...ys) - minY),
      };
    }

    if (element.type === "arrow") {
      const x2 = element.x + (element.width ?? 120);
      const y2 = element.y + (element.height ?? 0);
      const minX = Math.min(element.x, x2);
      const minY = Math.min(element.y, y2);

      return {
        x: minX,
        y: minY,
        width: Math.max(1, Math.abs(x2 - element.x)),
        height: Math.max(1, Math.abs(y2 - element.y)),
      };
    }

    return {
      x: element.x,
      y: element.y,
      width: element.width ?? 120,
      height: element.height ?? 72,
    };
  };
  const rectsOverlap = (first: ElementBounds, second: ElementBounds) =>
    first.x < second.x + second.width &&
    first.x + first.width > second.x &&
    first.y < second.y + second.height &&
    first.y + first.height > second.y;
  const isElementInsideQuestionCard = (element: WhiteboardElement) =>
    questionCardRects.some((rect) => rectsOverlap(getElementBounds(element), rect));
  const isElementInsideAnswerCard = (element: WhiteboardElement) => {
    if (!hasText(element.questionId)) return false;

    const answerRect = answerCardRects.find((rect) => rect.questionId === element.questionId);
    const elementBounds = getElementBounds(element);
    return answerRect ? rectsOverlap(elementBounds, answerRect) && !isElementInsideQuestionCard(element) : false;
  };
  const drawableElements = data.elements.filter(
    (element) => !hasText(element.questionId) && !isElementInsideQuestionCard(element)
  );
  const pedagogicalAnswerElements = data.elements.filter(isElementInsideAnswerCard);

  useEffect(() => {
    if (activePairTop === undefined) return;

    requestAnimationFrame(() => {
      containerRef.current?.scrollTo({
        top: Math.max(0, activePairTop - 18),
        behavior: "smooth",
      });
    });
  }, [activePairTop, activeQuestionId]);

  const pointFromEvent = (event: PointerEvent<SVGSVGElement>) => {
    const rect = svgRef.current!.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  };

  const replaceElement = (id: string, patch: Partial<WhiteboardElement>) => {
    onChange({
      ...data,
      elements: data.elements.map((element) =>
          element.id === id ? { ...element, ...patch } : element
      ),
    });
  };

  const addElement = (element: WhiteboardElement) => {
    onChange({ ...data, elements: [...data.elements, element] });
    onSelect(element.id);
  };

  const deleteElement = (id: string) => {
    onChange({ ...data, elements: data.elements.filter((item) => item.id !== id) });
    onSelect(null);
    setDrag(null);
  };

  const startTextEditing = (element: WhiteboardElement, isNew = false) => {
    if (element.type !== "text" && element.type !== "equation") return;

    setDrag(null);
    onSelect(element.id);

    setEditingText({
      id: element.id,
      draft: element.text ?? "",
      original: element.text ?? "",
      x: element.x,
      y: element.y,
      isNew,
    });
  };

  const createTextElementAt = (
    point: { x: number; y: number },
    type: "text" | "equation",
    initialText = "",
    questionId?: string
  ) => {
    const element: WhiteboardElement = {
      id: crypto.randomUUID(),
      type,
      x: point.x,
      y: point.y,
      text: initialText,
      stroke,
      questionId,
    };

    addElement(element);
    startTextEditing(element, true);
    onToolChange("select");
  };

  const answerPoint = () => {
    return {
      x: (activePairLayout?.x ?? 24) + 28,
      y: (activePairLayout?.answerY ?? Math.max(118, lastTeachingBlockBottom + 40)) + 86,
    };
  };

  const startAnswerText = (event: PointerEvent<SVGElement>, type: "text" | "equation") => {
    event.preventDefault();
    event.stopPropagation();

    if (editingText) commitTextEditing();
    createTextElementAt(answerPoint(), type, "", activeQuestionId ?? undefined);
  };

  const handleAnswerSubmit = (event: PointerEvent<SVGElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (activePair?.answer.trim()) onAnswerSubmit?.();
  };

  const handleAnswerContinue = (event: PointerEvent<SVGElement>) => {
    event.preventDefault();
    event.stopPropagation();
    onAnswerContinue?.();
  };

  const updateEditingDraft = (draft: string) => {
    if (!editingText) return;

    setEditingText({ ...editingText, draft, isNew: false });
    replaceElement(editingText.id, { text: draft });
  };

  const commitTextEditing = () => {
    if (!editingText) return;

    const nextText = editingText.draft.trim();

    if (!nextText) {
      deleteElement(editingText.id);
      setEditingText(null);
      return;
    }

    replaceElement(editingText.id, { text: nextText });
    setEditingText(null);
  };

  const cancelTextEditing = () => {
    if (!editingText) return;

    if (!editingText.original.trim()) {
      deleteElement(editingText.id);
    } else {
      replaceElement(editingText.id, { text: editingText.original });
    }

    setEditingText(null);
  };

  const onElementKeyDown = (event: KeyboardEvent<SVGElement>, element: WhiteboardElement) => {
    if (event.key !== "Delete" && event.key !== "Backspace") return;
    event.preventDefault();
    event.stopPropagation();
    deleteElement(element.id);
  };

  const onCanvasKeyDown = (event: KeyboardEvent<SVGSVGElement>) => {
    if (!editingText) {
      if (
        (tool === "text" || tool === "equation") &&
        event.key.length === 1 &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.altKey
      ) {
        event.preventDefault();
        createTextElementAt(
          activePairLayout ? answerPoint() : { x: 80, y: 96 },
          tool,
          event.key,
          activePairLayout ? activeQuestionId ?? undefined : undefined
        );
      }
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      commitTextEditing();
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      cancelTextEditing();
      return;
    }

    if (event.key === "Backspace" || event.key === "Delete") {
      event.preventDefault();
      updateEditingDraft(editingText.draft.slice(0, -1));
      return;
    }

    if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      event.preventDefault();
      updateEditingDraft(`${editingText.draft}${event.key}`);
    }
  };

  const onCanvasPointerDown = (event: PointerEvent<SVGSVGElement>) => {
    if (editingText) {
      commitTextEditing();
      return;
    }

    const point = pointFromEvent(event);
    const id = crypto.randomUUID();

    if (tool === "text" || tool === "equation") {
      createTextElementAt(point, tool);
      return;
    }

    if (tool === "rect" || tool === "circle" || tool === "diamond") {
      addElement({
        id,
        type: tool,
        x: point.x,
        y: point.y,
        width: 140,
        height: 72,
        text: tool === "diamond" ? "Condición" : "",
        stroke,
        fill: "#ffffff",
      });
      onToolChange("select");
      return;
    }

    if (tool === "arrow") {
      addElement({
        id,
        type: "arrow",
        x: point.x,
        y: point.y,
        width: 160,
        height: 0,
        stroke,
      });
      onToolChange("select");
      return;
    }

    if (tool === "pen") {
      addElement({
        id,
        type: "path",
        x: 0,
        y: 0,
        points: [point],
        stroke,
      });
      setDrag({ mode: "draw", id });
      return;
    }

    // In erase mode: clicking canvas bg clears AI overlay content
    if (tool === "erase" && overlayHtml) {
      onEraseOverlay?.();
      return;
    }

    onSelect(null);
  };

  const onElementPointerDown = (event: PointerEvent<SVGElement>, element: WhiteboardElement) => {
    event.stopPropagation();

    if (editingText) {
      if (editingText.id !== element.id) {
        commitTextEditing();
      }
      return;
    }

    if (tool === "erase") {
      deleteElement(element.id);
      return;
    }

    onSelect(element.id);

    const point = pointFromEvent(event as unknown as PointerEvent<SVGSVGElement>);
    setDrag({
      mode: "move",
      id: element.id,
      startX: point.x,
      startY: point.y,
      originX: element.x,
      originY: element.y,
    });
  };

  const onPointerMove = (event: PointerEvent<SVGSVGElement>) => {
    if (!drag) return;

    const point = pointFromEvent(event);

    if (drag.mode === "draw") {
      const element = data.elements.find((item) => item.id === drag.id);
      if (!element) return;

      replaceElement(drag.id, {
        points: [...(element.points ?? []), point],
      });

      return;
    }

    replaceElement(drag.id, {
      x: drag.originX + point.x - drag.startX,
      y: drag.originY + point.y - drag.startY,
    });
  };

  const onPointerUp = () => setDrag(null);

  const renderElement = (element: WhiteboardElement) => {
    if (element.questionId && collapsedQuestionIdSet.has(element.questionId)) return null;
    if (focusMode && focusQuestionId && element.questionId && element.questionId !== focusQuestionId) return null;
    if ((element.type === "text" || element.type === "equation") && editingText?.id !== element.id && !hasText(element.text)) return null;

    const isSelected = element.id === selected?.id;

    const common = {
      onPointerDown: (event: PointerEvent<SVGElement>) => onElementPointerDown(event, element),
      onDoubleClick: () => startTextEditing(element),
      onKeyDown: (event: KeyboardEvent<SVGElement>) => onElementKeyDown(event, element),
      className: cn("cursor-move outline-none", isSelected && "drop-shadow-sm"),
      tabIndex: 0,
      role: "button",
      "aria-label": `Elemento ${element.type}`,
      pointerEvents: "all" as const,   // force clickable even with fill="transparent"
    };

    if (element.type === "text" || element.type === "equation") {
      const isEditing = editingText?.id === element.id;
      const displayText = isEditing
        ? editingText.draft || "Escribí..."
        : element.text ?? "";
      const lines = displayText.split("\n");

      return (
          <g key={element.id} {...common}>
            <text
                x={element.x}
                y={element.y}
                fill={isEditing && !editingText.draft ? "rgba(255,255,255,0.55)" : stroke}
                fontSize={element.type === "equation" ? "26" : "22"}
                fontWeight="600"
                fontFamily={CHALK_FONT}
            >
              {lines.map((line, index) => (
                <tspan key={index} x={element.x} dy={index === 0 ? 0 : "1.35em"}>
                  {line}
                  {isEditing && index === lines.length - 1 ? " |" : ""}
                </tspan>
              ))}
            </text>

            {(isSelected || isEditing) && (
                <rect
                    x={element.x - 4}
                    y={element.y - 20}
                    width={Math.max(72, displayText.length * 9)}
                    height={Math.max(28, lines.length * 30)}
                    fill="none"
                    stroke={accent}
                    strokeDasharray="4 3"
                />
            )}
          </g>
      );
    }

    if (element.type === "path") {
      const d = (element.points ?? [])
          .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
          .join(" ");

      return (
          <path
              key={element.id}
              d={d}
              fill="none"
              stroke={stroke}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              {...common}
          />
      );
    }

    if (element.type === "arrow") {
      const x2 = element.x + (element.width ?? 120);
      const y2 = element.y + (element.height ?? 0);

      return (
          <g key={element.id} {...common}>
            <defs>
              <marker
                  id="whiteboard-arrow"
                  markerWidth="10"
                  markerHeight="10"
                  refX="8"
                  refY="3"
                  orient="auto"
                  markerUnits="strokeWidth"
              >
                <path d="M0,0 L0,6 L9,3 z" fill={stroke} />
              </marker>
            </defs>

            <line
                x1={element.x}
                y1={element.y}
                x2={x2}
                y2={y2}
                stroke={stroke}
                strokeWidth="2.5"
                markerEnd="url(#whiteboard-arrow)"
            />

            {isSelected && (
                <line
                    x1={element.x}
                    y1={element.y - 6}
                    x2={x2}
                    y2={y2 - 6}
                    stroke={accent}
                    strokeDasharray="4 3"
                />
            )}
          </g>
      );
    }

    const width = element.width ?? 120;
    const height = element.height ?? 72;

    const label = element.text ? (
        <text
            x={element.x + width / 2}
            y={element.y + height / 2 + 5}
            textAnchor="middle"
            fill={stroke}
            fontSize="20"
            fontWeight="600"
            fontFamily={CHALK_FONT}
        >
          {element.text}
        </text>
    ) : null;

    if (element.type === "circle") {
      return (
          <g key={element.id} {...common}>
            <ellipse
                cx={element.x + width / 2}
                cy={element.y + height / 2}
                rx={width / 2}
                ry={height / 2}
                fill="transparent"
                stroke={isSelected ? accent : stroke}
                strokeWidth="2"
            />
            {label}
          </g>
      );
    }

    if (element.type === "diamond") {
      const points = `${element.x + width / 2},${element.y} ${element.x + width},${element.y + height / 2} ${element.x + width / 2},${element.y + height} ${element.x},${element.y + height / 2}`;

      return (
          <g key={element.id} {...common}>
            <polygon
                points={points}
                fill="transparent"
                stroke={isSelected ? accent : stroke}
                strokeWidth="2"
            />
            {label}
          </g>
      );
    }

    return (
        <g key={element.id} {...common}>
          <rect
              x={element.x}
              y={element.y}
              width={width}
              height={height}
              rx="6"
              fill="transparent"
              stroke={isSelected ? accent : stroke}
              strokeWidth="2"
          />
          {label}
        </g>
    );
  };

  const renderOverlayElement = (element: WhiteboardElement) => {
    const pe = { pointerEvents: "none" as const };

    if (element.type === "text" || element.type === "equation") {
      const fs = element.type === "equation" ? "26" : "22";
      const lines = element.text?.split("\n") ?? [element.text ?? ""];
      return (
        <text key={element.id} x={element.x} y={element.y}
          fill={lessonStroke} fontSize={fs} fontWeight="600" fontFamily={CHALK_FONT} style={pe}>
          {lines.map((line, i) => (
            <tspan key={i} x={element.x} dy={i === 0 ? 0 : "1.5em"}>{line}</tspan>
          ))}
        </text>
      );
    }

    if (element.type === "path") {
      const d = (element.points ?? []).map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
      return <path key={element.id} d={d} fill="none" stroke={lessonStroke} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={pe} />;
    }

    if (element.type === "arrow") {
      const x2 = element.x + (element.width ?? 120);
      const y2 = element.y + (element.height ?? 0);
      return (
        <g key={element.id} style={pe}>
          <defs>
            <marker id="lesson-arrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="strokeWidth">
              <path d="M0,0 L0,6 L9,3 z" fill={lessonStroke} />
            </marker>
          </defs>
          <line x1={element.x} y1={element.y} x2={x2} y2={y2} stroke={lessonStroke} strokeWidth="2.5" markerEnd="url(#lesson-arrow)" style={pe} />
        </g>
      );
    }

    const w = element.width ?? 120;
    const h = element.height ?? 72;
    const label = element.text ? (() => {
      const lines = element.text.split("\n");
      const totalH = lines.length * 26;
      const startY = element.y + h / 2 - totalH / 2 + 20;
      return (
        <text x={element.x + w / 2} textAnchor="middle" fill={lessonStroke}
          fontSize="20" fontWeight="600" fontFamily={CHALK_FONT} style={pe}>
          {lines.map((line, i) => (
            <tspan key={i} x={element.x + w / 2} y={startY + i * 26}>{line}</tspan>
          ))}
        </text>
      );
    })() : null;

    if (element.type === "circle") {
      return (
        <g key={element.id} style={pe}>
          <ellipse cx={element.x + w / 2} cy={element.y + h / 2} rx={w / 2} ry={h / 2} fill={lessonFill} stroke={lessonStroke} strokeWidth="2" style={pe} />
          {label}
        </g>
      );
    }

    if (element.type === "diamond") {
      const pts = `${element.x + w / 2},${element.y} ${element.x + w},${element.y + h / 2} ${element.x + w / 2},${element.y + h} ${element.x},${element.y + h / 2}`;
      return (
        <g key={element.id} style={pe}>
          <polygon points={pts} fill={lessonFill} stroke={lessonStroke} strokeWidth="2" style={pe} />
          {label}
        </g>
      );
    }

    return (
      <g key={element.id} style={pe}>
        <rect x={element.x} y={element.y} width={w} height={h} rx="6" fill={lessonFill} stroke={lessonStroke} strokeWidth="2" style={pe} />
        {label}
      </g>
    );
  };

  return (
      <div
        ref={containerRef}
        className="relative min-h-0 flex-1 overflow-auto"
        style={{
          backgroundColor: BOARD_BG,
          backgroundImage: showGrid
            ? "linear-gradient(rgba(255,255,255,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.07) 1px, transparent 1px)"
            : "none",
          backgroundSize: showGrid ? "24px 24px" : "auto",
        }}
      >
        <div className="relative min-h-full" style={{ height: canvasContentHeight }}>
          {/* AI content rendered BEFORE the SVG — SVG is transparent so content
              shows through, and all pointer events go to the SVG naturally */}
          {overlayHtml && !focusMode && (
            <div
              className="absolute inset-0 overflow-hidden whiteboard-overlay-content"
              style={{ padding: "20px 24px", zIndex: 0 }}
              dangerouslySetInnerHTML={{ __html: overlayHtml }}
            />
          )}

          <svg
              ref={svgRef}
              className={cn("absolute left-0 top-0 w-full touch-none", (tool === "text" || tool === "equation") && "cursor-text")}
              style={{ zIndex: 1, height: canvasContentHeight }}
              onPointerDown={onCanvasPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerLeave={onPointerUp}
              onKeyDown={onCanvasKeyDown}
              onBlur={(event) => {
                const nextTarget = event.relatedTarget;
                if (nextTarget === textInputRef.current) return;
                if (nextTarget instanceof Node && event.currentTarget.contains(nextTarget)) return;
                commitTextEditing();
              }}
              tabIndex={0}
              role="application"
              aria-label="Pizarra inteligente"
          >
          {/* SVG lesson step overlay (behind user elements) */}
          {!focusMode && overlayElements && overlayElements.length > 0 && (
            <g pointerEvents="none" opacity="0.85" aria-hidden="true">
              {overlayElements.map(renderOverlayElement)}
            </g>
          )}

          {drawableElements.map(renderElement)}

          {pairLayouts.map((layout, index) => {
            const active = layout.pair.questionId === activeQuestionId;
            return (
              <QuestionResponsePair
                key={layout.pair.questionId}
                pair={layout.pair}
                index={index}
                x={layout.x}
                y={layout.y}
                width={layout.width}
                questionHeight={layout.questionHeight}
                answerHeight={layout.answerHeight}
                question={layout.pair.question}
                active={active}
                collapsed={layout.collapsed}
                showAnswer={layout.showAnswer}
                fontFamily={CHALK_FONT}
                onStartAnswer={active && !editingText ? (event) => startAnswerText(event, "text") : undefined}
                onSubmit={active ? handleAnswerSubmit : undefined}
                onContinue={active ? handleAnswerContinue : undefined}
                onToggleCollapsed={onToggleQuestionCollapsed}
              />
            );
          })}

          {pedagogicalAnswerElements.map(renderElement)}

          {/* Invisible hit rects for individual entry erasure */}
          {tool === "erase" && teachingEntryLayout && teachingEntryLayout.map((entry) => (
            <rect
              key={`hit-${entry.id}`}
              x={0} y={entry.y}
              width="100%" height={entry.height}
              fill="rgba(255,255,255,0.08)"
              stroke="rgba(255,255,255,0.3)"
              strokeWidth={1}
              strokeDasharray="4 3"
              pointerEvents="all"
              style={{ cursor: "pointer" }}
              onPointerDown={(e) => {
                e.stopPropagation();
                onEraseEntry?.(entry.id);
              }}
            />
          ))}
          </svg>

          {editingText && (
            <textarea
              ref={textInputRef}
              value={editingText.draft}
              onChange={(event) => updateEditingDraft(event.target.value)}
              onKeyDown={(event) => {
                event.stopPropagation();

                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  commitTextEditing();
                  return;
                }

                if (event.key === "Escape") {
                  event.preventDefault();
                  cancelTextEditing();
                }
              }}
              onBlur={commitTextEditing}
              aria-label="Texto en la pizarra"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              className="absolute resize-none overflow-hidden border-0 bg-transparent p-0 text-transparent caret-transparent outline-none"
              style={{
                left: editingText.x,
                top: Math.max(0, editingText.y - 24),
                width: 1,
                height: 1,
                opacity: 0.01,
                zIndex: 2,
                pointerEvents: "none",
              }}
            />
          )}
        </div>

      </div>
  );
}
