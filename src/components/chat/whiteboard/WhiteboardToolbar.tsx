import { Circle, Diamond, Eraser, Grid2x2, Grid2x2X, MousePointer2, MoveRight, Pencil, Sigma, Square, Type } from "lucide-react";
import type { WhiteboardElement, WhiteboardTool } from "@/types/whiteboard";
import { WhiteboardToolButton } from "./WhiteboardToolButton";
import { MathSymbolPicker } from "./MathSymbolPicker";

interface Props {
  tool: WhiteboardTool;
  selectedElement?: WhiteboardElement;
  showGrid?: boolean;
  onToggleGrid?: () => void;
  onToolChange: (tool: WhiteboardTool) => void;
  onSelectedTextChange: (text: string) => void;
  onInsertSymbol: (symbol: string) => void;
}

const tools: Array<{ id: WhiteboardTool; label: string; icon: typeof MousePointer2 }> = [
  { id: "select", label: "Mover", icon: MousePointer2 },
  { id: "text", label: "Texto", icon: Type },
  { id: "equation", label: "Ecuación", icon: Sigma },
  { id: "pen", label: "Lápiz", icon: Pencil },
  { id: "rect", label: "Rectángulo", icon: Square },
  { id: "circle", label: "Círculo", icon: Circle },
  { id: "diamond", label: "Rombo de decisión", icon: Diamond },
  { id: "arrow", label: "Flecha", icon: MoveRight },
  { id: "erase", label: "Borrar", icon: Eraser },
];

export function WhiteboardToolbar({ tool, selectedElement, showGrid = true, onToggleGrid, onToolChange, onSelectedTextChange, onInsertSymbol }: Props) {
  return (
    <div className="flex flex-col">
      <div className="flex min-w-0 items-center gap-2 bg-background/95 px-4 py-2 shadow-[0_1px_0_rgba(15,23,42,0.06)]">
        <div className="flex flex-wrap items-center gap-1.5">
          {tools.map((item) => (
            <WhiteboardToolButton
              key={item.id}
              label={item.label}
              icon={item.icon}
              active={tool === item.id}
              onClick={() => onToolChange(item.id)}
            />
          ))}
          {onToggleGrid && (
            <WhiteboardToolButton
              label={showGrid ? "Ocultar cuadrícula" : "Mostrar cuadrícula"}
              icon={showGrid ? Grid2x2X : Grid2x2}
              active={showGrid}
              onClick={onToggleGrid}
            />
          )}
        </div>

        {selectedElement?.type === "text" || selectedElement?.type === "equation" || selectedElement?.type === "rect" || selectedElement?.type === "circle" || selectedElement?.type === "diamond" ? (
          <input
            value={selectedElement.text ?? ""}
            onChange={(event) => onSelectedTextChange(event.target.value)}
            aria-label={selectedElement.type === "equation" ? "Ecuación seleccionada" : "Texto del elemento seleccionado"}
            className="ml-auto h-8 min-w-0 max-w-64 rounded-full bg-muted px-3 text-xs outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
            placeholder={selectedElement.type === "equation" ? "Ej: 2x + 3 = 4" : "Texto del elemento"}
          />
        ) : null}
      </div>

      {tool === "equation" && (
        <MathSymbolPicker onInsertSymbol={onInsertSymbol} />
      )}
    </div>
  );
}
