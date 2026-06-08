import { hasText } from "@/utils/whiteboardRenderGuards";

interface QuestionCardProps {
  x: number;
  y: number;
  width: number;
  height: number;
  question: string;
  index: number;
  fontFamily: string;
  active: boolean;
}

export function QuestionCard({ x, y, width, height, question, index, fontFamily, active }: QuestionCardProps) {
  const visibleQuestion = question.trim();

  if (!hasText(visibleQuestion)) return null;

  return (
    <g
      aria-label={`Pregunta ${index + 1} del tutor`}
      opacity={active ? 1 : 0.68}
      onPointerDown={(event) => {
        event.preventDefault();
        event.stopPropagation();
      }}
    >
      <foreignObject x={x} y={y} width={width} height={height}>
        <div
          style={{
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            gap: 8,
            minHeight: "100%",
            height: "auto",
            overflow: "visible",
            padding: "24px 28px",
            borderRadius: 24,
            border: `1px solid ${active ? "rgba(186, 230, 253, 0.42)" : "rgba(255, 255, 255, 0.12)"}`,
            background: active ? "rgba(245, 255, 250, 0.13)" : "rgba(245, 255, 250, 0.07)",
            color: "rgba(255, 255, 255, 0.96)",
            fontFamily,
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              color: "rgba(236, 253, 245, 0.72)",
              fontSize: 15,
              fontWeight: 800,
              lineHeight: 1.2,
              whiteSpace: "normal",
            }}
          >
            Pregunta del tutor
          </div>
          <div
            style={{
              fontSize: active ? 23 : 20,
              fontWeight: 760,
              lineHeight: 1.5,
              whiteSpace: "normal",
              overflowWrap: "break-word",
              wordBreak: "break-word",
            }}
          >
            {visibleQuestion}
          </div>
        </div>
      </foreignObject>
    </g>
  );
}
