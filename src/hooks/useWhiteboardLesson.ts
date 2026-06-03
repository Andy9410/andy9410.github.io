import { useState, useCallback } from "react";
import type { WhiteboardLesson } from "@/types/lesson";
import type { WhiteboardElement } from "@/types/whiteboard";
import { generateLesson } from "@/services/lessonApi";

export interface UseWhiteboardLessonResult {
  lesson: WhiteboardLesson | null;
  stepIndex: number;
  isGenerating: boolean;
  error: string | null;
  overlayElements: WhiteboardElement[];
  generate: (conversationId: number, userMessage: string, assistantMessage: string, token: string) => Promise<void>;
  nextStep: () => void;
  prevStep: () => void;
  close: () => void;
}

export function useWhiteboardLesson(): UseWhiteboardLessonResult {
  const [lesson, setLesson] = useState<WhiteboardLesson | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async (
    conversationId: number,
    userMessage: string,
    assistantMessage: string,
    token: string,
  ) => {
    setIsGenerating(true);
    setError(null);
    setLesson(null);
    setStepIndex(0);
    try {
      const result = await generateLesson(conversationId, userMessage, assistantMessage, token);
      setLesson(result);
    } catch {
      setError("No se pudo generar la explicación. Intentá de nuevo.");
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const nextStep = useCallback(() => {
    setStepIndex((i) => Math.min(i + 1, (lesson?.steps.length ?? 1) - 1));
  }, [lesson?.steps.length]);

  const prevStep = useCallback(() => {
    setStepIndex((i) => Math.max(i - 1, 0));
  }, []);

  const close = useCallback(() => {
    setLesson(null);
    setStepIndex(0);
    setError(null);
  }, []);

  return {
    lesson,
    stepIndex,
    isGenerating,
    error,
    overlayElements: lesson?.steps[stepIndex]?.elements ?? [],
    generate,
    nextStep,
    prevStep,
    close,
  };
}
