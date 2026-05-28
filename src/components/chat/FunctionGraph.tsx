import { useEffect, useId, useMemo, useRef } from "react";
import JXG from "jsxgraph";
import { cn } from "@/lib/utils";

interface Props {
  expression: string;
  title?: string;
}

const MATH_FUNCTIONS: Record<string, string> = {
  sin: "Math.sin",
  cos: "Math.cos",
  tan: "Math.tan",
  sqrt: "Math.sqrt",
  abs: "Math.abs",
  exp: "Math.exp",
  ln: "Math.log",
  log: "Math.log10",
};

const compileExpression = (rawExpression: string): ((x: number) => number) => {
  let source = rawExpression.trim().toLowerCase();

  if (!source) throw new Error("empty expression");

  source = source
    .replace(/π/g, "pi")
    .replace(/\s+/g, "")
    .replace(/(\d|\))(?=x|pi|e|sin|cos|tan|sqrt|abs|exp|ln|log|\()/g, "$1*")
    .replace(/(x|pi|e|\))(?=\d|\()/g, "$1*")
    .replace(/\^/g, "**");

  const unknownIdentifiers = source
    .replace(/\b(sin|cos|tan|sqrt|abs|exp|ln|log|pi|e|x)\b/g, "")
    .match(/[a-z]+/g);

  if (unknownIdentifiers) throw new Error("unsupported identifier");

  source = source
    .replace(/\bpi\b/g, "Math.PI")
    .replace(/\be\b/g, "Math.E");

  for (const [name, replacement] of Object.entries(MATH_FUNCTIONS)) {
    source = source.replace(new RegExp(`\\b${name}\\b`, "g"), replacement);
  }

  if (!/^[0-9x+\-*/().,A-Za-z]+$/.test(source)) {
    throw new Error("invalid characters");
  }

  const fn = new Function("x", `"use strict"; const y = ${source}; return Number.isFinite(y) ? y : NaN;`) as (
    x: number,
  ) => number;

  fn(1);
  return fn;
};

const FunctionGraph = ({ expression, title }: Props) => {
  const boardRef = useRef<JXG.Board | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const boardId = useId().replace(/:/g, "");
  const compiledExpression = useMemo(() => {
    try {
      return { fn: compileExpression(expression), hasError: false };
    } catch {
      return { fn: null, hasError: true };
    }
  }, [expression]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !compiledExpression.fn) return;

    const styles = getComputedStyle(container);
    const axisColor = styles.getPropertyValue("--graph-axis").trim() || "#64748b";
    const labelColor = styles.getPropertyValue("--graph-label").trim() || "#475569";
    const lineColor = styles.getPropertyValue("--graph-line").trim() || "#14b8a6";

    const board = JXG.JSXGraph.initBoard(container, {
      boundingbox: [-6, 6, 6, -6],
      axis: false,
      showCopyright: false,
      showNavigation: true,
      keepaspectratio: false,
      pan: { enabled: true },
      zoom: { wheel: true, pinchHorizontal: true, pinchVertical: true },
    });

    boardRef.current = board;
    board.create("axis", [[0, 0], [1, 0]], {
      strokeColor: axisColor,
      highlight: false,
      ticks: { strokeColor: axisColor, label: { strokeColor: labelColor } },
    });
    board.create("axis", [[0, 0], [0, 1]], {
      strokeColor: axisColor,
      highlight: false,
      ticks: { strokeColor: axisColor, label: { strokeColor: labelColor } },
    });
    board.create("functiongraph", [compiledExpression.fn], {
      strokeColor: lineColor,
      strokeWidth: 3,
      highlight: false,
    });

    const resizeObserver = new ResizeObserver(([entry]) => {
      const width = Math.floor(entry.contentRect.width);
      const height = Math.floor(entry.contentRect.height);
      if (width > 0 && height > 0) {
        board.resizeContainer(width, height);
        board.update();
      }
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      if (boardRef.current) {
        JXG.JSXGraph.freeBoard(boardRef.current);
        boardRef.current = null;
      }
    };
  }, [compiledExpression]);

  if (compiledExpression.hasError || !compiledExpression.fn) {
    return (
      <div className="my-3 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
        No se pudo generar el gráfico.
      </div>
    );
  }

  return (
    <figure className="my-3 overflow-hidden rounded-lg border border-border bg-background shadow-sm">
      <figcaption className="flex items-center justify-between gap-3 border-b border-border bg-secondary/60 px-3 py-2">
        <span className="min-w-0 truncate text-xs font-semibold text-muted-foreground">
          {title ?? "Gráfico de función"}
        </span>
        <code className="rounded bg-background/80 px-2 py-0.5 text-[11px] text-foreground">
          {expression.trim()}
        </code>
      </figcaption>
      <div
        id={`function-graph-${boardId}`}
        ref={containerRef}
        className={cn(
          "h-72 w-full bg-background",
          "[--graph-axis:#64748b] [--graph-label:#475569] [--graph-line:#14b8a6]",
          "dark:[--graph-axis:#94a3b8] dark:[--graph-label:#cbd5e1] dark:[--graph-line:#2dd4bf]",
        )}
      />
    </figure>
  );
};

export default FunctionGraph;
