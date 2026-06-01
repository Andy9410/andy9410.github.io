import { useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent, PointerEvent } from "react";
import type { WhiteboardData, WhiteboardElement, WhiteboardTool } from "@/types/whiteboard";
import { cn } from "@/lib/utils";

interface Props {
  data: WhiteboardData;
  tool: WhiteboardTool;
  selectedId: string | null;
  onToolChange: (tool: WhiteboardTool) => void;
  onSelect: (id: string | null) => void;
  onChange: (data: WhiteboardData) => void;
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

const stroke = "#0f172a";
const accent = "#14b8a6";

export function WhiteboardCanvas({ data, tool, selectedId, onToolChange, onSelect, onChange }: Props) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const ignoreNextBlurRef = useRef(false);

  const [drag, setDrag] = useState<DragState | null>(null);
  const [editingText, setEditingText] = useState<TextEditState | null>(null);

  const selected = useMemo(
      () => data.elements.find((element) => element.id === selectedId),
      [data.elements, selectedId]
  );

  const editingElement = useMemo(
      () => data.elements.find((element) => element.id === editingText?.id),
      [data.elements, editingText?.id]
  );

  const editingPosition = editingElement ?? editingText;

  useEffect(() => {
    if (!editingText) return;

    requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    });
  }, [editingText?.id]);

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

    if (isNew) {
      ignoreNextBlurRef.current = true;
    }

    setEditingText({
      id: element.id,
      draft: element.text ?? "",
      original: element.text ?? "",
      x: element.x,
      y: element.y,
      isNew,
    });
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

  const handleTextBlur = () => {
    if (!editingText) return;

    if (ignoreNextBlurRef.current && !editingText.draft.trim()) {
      ignoreNextBlurRef.current = false;

      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });

      return;
    }

    commitTextEditing();
  };

  const onElementKeyDown = (event: KeyboardEvent<SVGElement>, element: WhiteboardElement) => {
    if (event.key !== "Delete" && event.key !== "Backspace") return;
    event.preventDefault();
    event.stopPropagation();
    deleteElement(element.id);
  };

  const onCanvasPointerDown = (event: PointerEvent<SVGSVGElement>) => {
    if (editingText) {
      commitTextEditing();
      return;
    }

    const point = pointFromEvent(event);
    const id = crypto.randomUUID();

    if (tool === "text" || tool === "equation") {
      const element: WhiteboardElement = {
        id,
        type: tool,
        x: point.x,
        y: point.y,
        text: "",
        stroke,
      };

      addElement(element);
      startTextEditing(element, true);
      onToolChange("select");
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
    const isSelected = element.id === selected?.id;

    const common = {
      onPointerDown: (event: PointerEvent<SVGElement>) => onElementPointerDown(event, element),
      onDoubleClick: () => startTextEditing(element),
      onKeyDown: (event: KeyboardEvent<SVGElement>) => onElementKeyDown(event, element),
      className: cn("cursor-move outline-none", isSelected && "drop-shadow-sm"),
      tabIndex: 0,
      role: "button",
      "aria-label": `Elemento ${element.type}`,
    };

    if (element.type === "text" || element.type === "equation") {
      return (
          <g key={element.id} {...common}>
            <text
                x={element.x}
                y={element.y}
                fill={stroke}
                fontSize={element.type === "equation" ? "18" : "16"}
                fontWeight="600"
            >
              {element.text}
            </text>

            {isSelected && (
                <rect
                    x={element.x - 4}
                    y={element.y - 20}
                    width={Math.max(56, (element.text?.length ?? 4) * 9)}
                    height={28}
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
            fontSize="14"
            fontWeight="600"
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
                fill="white"
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
                fill="white"
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
              fill="white"
              stroke={isSelected ? accent : stroke}
              strokeWidth="2"
          />
          {label}
        </g>
    );
  };

  return (
      <div className="relative min-h-0 flex-1 overflow-hidden bg-[linear-gradient(#e5e7eb_1px,transparent_1px),linear-gradient(90deg,#e5e7eb_1px,transparent_1px)] bg-[size:24px_24px]">
        <svg
            ref={svgRef}
            className={cn("h-full w-full touch-none", (tool === "text" || tool === "equation") && "cursor-text")}
            onPointerDown={onCanvasPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerUp}
            role="application"
            aria-label="Pizarra inteligente"
        >
          {data.elements.map(renderElement)}
        </svg>

        {editingText && editingPosition && (
            <input
                ref={inputRef}
                value={editingText.draft}
                onPointerDown={(event) => event.stopPropagation()}
                onMouseDown={(event) => event.stopPropagation()}
                onClick={(event) => event.stopPropagation()}
                onChange={(event) =>
                    setEditingText((current) =>
                        current ? { ...current, draft: event.target.value, isNew: false } : current
                    )
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    commitTextEditing();
                  } else if (event.key === "Escape") {
                    event.preventDefault();
                    cancelTextEditing();
                  }
                }}
                onBlur={handleTextBlur}
                aria-label="Editar texto de la pizarra"
                className="absolute z-20 h-8 min-w-24 rounded-md border border-accent bg-background px-2 text-sm font-semibold text-foreground shadow-lg outline-none ring-2 ring-accent/25"
                style={{
                  left: editingPosition.x - 6,
                  top: editingPosition.y - 24,
                  width: Math.max(120, editingText.draft.length * 9 + 28),
                }}
            />
        )}
      </div>
  );
}