import type { PointerEvent } from "react";
import type { WhiteboardAnswerStatus } from "@/types/whiteboard";
import { cn } from "@/lib/utils";

interface StudentAnswerCardProps {
  x: number;
  y: number;
  width: number;
  height: number;
  status: WhiteboardAnswerStatus;
  hasAnswer: boolean;
  active: boolean;
  fontFamily: string;
  onStartAnswer?: (event: PointerEvent<SVGElement>) => void;
  onSubmit?: (event: PointerEvent<SVGElement>) => void;
  onContinue?: (event: PointerEvent<SVGElement>) => void;
}

export function StudentAnswerCard({
  x,
  y,
  width,
  height,
  status,
  hasAnswer,
  active,
  fontFamily,
  onStartAnswer,
  onSubmit,
}: StudentAnswerCardProps) {
  if (!active && (!hasAnswer || status !== "answered")) return null;

  const bodyTop = y + 48;
  const answerLineY = bodyTop + 68;
  const buttonY = y + height - 42;
  const canSubmit = active && hasAnswer;
  const answered = status === "answered";
  const blockCanvasWrite = (event: PointerEvent<SVGElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  return (
    <g aria-label="Respuesta del alumno">
      <g
        role={active ? "button" : undefined}
        tabIndex={active ? 0 : undefined}
        aria-label="Escribir respuesta del alumno"
        onPointerDown={active && onStartAnswer ? onStartAnswer : blockCanvasWrite}
        className={cn(active && "cursor-text")}
      >
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          rx={24}
          fill={active ? "rgba(255, 251, 235, 0.12)" : "rgba(255, 251, 235, 0.06)"}
          stroke={active ? "rgba(251, 191, 36, 0.55)" : "rgba(255, 255, 255, 0.12)"}
          strokeWidth={1}
        />
        <text x={x + 28} y={y + 36} fill="rgba(255, 251, 235, 0.78)" fontSize="15" fontWeight="850" fontFamily={fontFamily}>
          Tu respuesta
        </text>
        {answered && (
          <text x={x + width - 28} y={y + 36} textAnchor="end" fill="rgba(134, 239, 172, 0.96)" fontSize="15" fontWeight="850" fontFamily={fontFamily}>
            Respuesta enviada ✓
          </text>
        )}
        {!hasAnswer && (
          <text x={x + 28} y={bodyTop + 36} fill="rgba(255, 255, 255, 0.5)" fontSize="20" fontWeight="700" fontFamily={fontFamily}>
            Escribí aquí tu respuesta...
          </text>
        )}
        <line
          x1={x + 28}
          y1={answerLineY}
          x2={x + width - 28}
          y2={answerLineY}
          stroke={hasAnswer ? "rgba(134, 239, 172, 0.62)" : "rgba(255, 255, 255, 0.42)"}
          strokeWidth={2}
          strokeLinecap="round"
        />
        {active && !hasAnswer && (
          <line
            x1={x + 33}
            y1={answerLineY - 28}
            x2={x + 33}
            y2={answerLineY - 8}
            stroke="rgba(255, 255, 255, 0.95)"
            strokeWidth={2}
            strokeLinecap="round"
          />
        )}
      </g>

      {canSubmit && (
        <g>
          <g
            role="button"
            tabIndex={0}
            aria-label="Enviar respuesta"
            onPointerDown={canSubmit && onSubmit ? onSubmit : blockCanvasWrite}
            className="cursor-pointer"
          >
            <rect x={x + width - 104} y={buttonY} width={76} height={30} rx={15} fill="rgba(251, 191, 36, 0.24)" />
            <text x={x + width - 85} y={buttonY + 20} fill="rgba(255, 251, 235, 0.98)" fontSize="15" fontWeight="900" fontFamily={fontFamily}>
              Enviar
            </text>
          </g>
        </g>
      )}
    </g>
  );
}
