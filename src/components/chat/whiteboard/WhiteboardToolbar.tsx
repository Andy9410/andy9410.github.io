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

const TOOL_HINTS: Partial<Record<WhiteboardTool, string>> = {
  select: "Hacé clic en un elemento para seleccionarlo o arrastralo para moverlo",
  text: "Hacé clic en la pizarra para escribir texto",
  equation: "Hacé clic en la pizarra o seleccioná un símbolo de abajo para insertar una ecuación",
  pen: "Dibujá a mano alzada sobre la pizarra",
  rect: "Hacé clic en la pizarra para agregar un rectángulo",
  circle: "Hacé clic en la pizarra para agregar un círculo",
  diamond: "Hacé clic en la pizarra para agregar un rombo de decisión",
  arrow: "Hacé clic en la pizarra para agregar una flecha",
  erase: "Hacé clic sobre un elemento para borrarlo",
};

export function WhiteboardToolbar({ tool, selectedElement, showGrid = true, onToggleGrid, onToolChange, onSelectedTextChange, onInsertSymbol }: Props) {
  const hint = TOOL_HINTS[tool];

  return (
    <div className="flex flex-col">
      <div className="flex min-w-0 items-center gap-2 border-b bg-muted/30 px-3 py-2">
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
            className="ml-auto h-8 min-w-0 max-w-64 rounded-md border border-border bg-background px-2 text-xs outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
            placeholder={selectedElement.type === "equation" ? "Ej: 2x + 3 = 4" : "Texto del elemento"}
          />
        ) : tool === "select" ? (
          <div className="ml-auto text-xs text-muted-foreground">Pizarra editable</div>
        ) : null}
      </div>

      {tool !== "select" && hint && (
        <div className="flex items-center gap-2 border-b bg-accent/5 px-3 py-1.5">
          <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-accent/20 text-[10px] font-bold text-accent">i</span>
          <p className="text-[11px] leading-tight text-muted-foreground">{hint}</p>
        </div>
      )}

      {tool === "equation" && (
        <MathSymbolPicker onInsertSymbol={onInsertSymbol} />
      )}
    </div>
  );
}
