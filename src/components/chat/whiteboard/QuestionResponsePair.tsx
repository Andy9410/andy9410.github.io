import type { PointerEvent } from "react";
import type { WhiteboardQuestionResponsePair } from "@/types/whiteboard";
import { hasText } from "@/utils/whiteboardRenderGuards";
import { QuestionCard } from "./QuestionCard";
import { StudentAnswerCard } from "./StudentAnswerCard";
import { COLLAPSED_QUESTION_RESPONSE_HEIGHT, QUESTION_RESPONSE_CARD_GAP } from "./questionResponseLayout";

interface QuestionResponsePairProps {
  pair: WhiteboardQuestionResponsePair;
  index: number;
  x: number;
  y: number;
  width: number;
  questionHeight: number;
  answerHeight: number;
  question: string;
  active: boolean;
  collapsed: boolean;
  showAnswer: boolean;
  fontFamily: string;
  onStartAnswer?: (event: PointerEvent<SVGElement>) => void;
  onSubmit?: (event: PointerEvent<SVGElement>) => void;
  onContinue?: (event: PointerEvent<SVGElement>) => void;
  onToggleCollapsed?: (questionId: string) => void;
}

export function QuestionResponsePair({
  pair,
  index,
  x,
  y,
  width,
  questionHeight,
  answerHeight,
  question,
  active,
  collapsed,
  showAnswer,
  fontFamily,
  onStartAnswer,
  onSubmit,
  onContinue,
  onToggleCollapsed,
}: QuestionResponsePairProps) {
  const hasQuestion = hasText(pair.question);
  const hasSubmittedAnswer = pair.status === "answered" && hasText(pair.answer);

  if (!hasQuestion) return null;
  if (!active && !hasSubmittedAnswer) return null;

  const answerY = y + questionHeight + QUESTION_RESPONSE_CARD_GAP;

  if (collapsed) {
    if (!hasSubmittedAnswer) return null;

    return (
      <g
        aria-label={`Pregunta ${index + 1} respondida`}
        data-question-id={pair.questionId}
        role="button"
        tabIndex={0}
        className="cursor-pointer"
        onPointerDown={(event) => {
          event.preventDefault();
          event.stopPropagation();
          onToggleCollapsed?.(pair.questionId);
        }}
      >
        <rect
          x={x}
          y={y}
          width={width}
          height={COLLAPSED_QUESTION_RESPONSE_HEIGHT}
          rx={18}
          fill="rgba(255, 255, 255, 0.06)"
          stroke="rgba(255, 255, 255, 0.08)"
          strokeWidth={1}
        />
        <text x={x + 24} y={y + 34} fill="rgba(209, 250, 229, 0.82)" fontSize="17" fontWeight="850" fontFamily={fontFamily}>
          {`✓ Pregunta ${index + 1} respondida`}
        </text>
        <text x={x + width - 24} y={y + 34} textAnchor="end" fill="rgba(255, 255, 255, 0.46)" fontSize="14" fontWeight="700" fontFamily={fontFamily}>
          Click para expandir
        </text>
      </g>
    );
  }

  return (
    <g aria-label={`Pregunta y respuesta ${index + 1}`} data-question-id={pair.questionId}>
      <QuestionCard
        x={x}
        y={y}
        width={width}
        height={questionHeight}
        question={question}
        index={index}
        fontFamily={fontFamily}
        active={active}
      />
      {showAnswer && (
        <StudentAnswerCard
          x={x}
          y={answerY}
          width={width}
          height={answerHeight}
          status={pair.status}
          hasAnswer={hasText(pair.answer)}
          active={active}
          fontFamily={fontFamily}
          onStartAnswer={onStartAnswer}
          onSubmit={onSubmit}
          onContinue={onContinue}
        />
      )}
    </g>
  );
}
