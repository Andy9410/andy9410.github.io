import { useCallback, useRef, useState } from "react";
import type { WhiteboardEntry } from "@/types/whiteboard";
import { teachWhiteboard } from "@/services/whiteboardApi";

export type TeachingPhase =
  | "IDLE"
  | "THINKING"
  | "WRITING_FRAGMENT"
  | "WAITING_USER_INPUT"
  | "USER_WRITING"
  | "ANALYZING_USER_INPUT"
  | "CONTINUING"
  | "COMPLETED";

interface TeachingState {
  phase: TeachingPhase;
  pauseQuestion: string | null;
  stepIndex: number;
  userDraft: string;
}

interface Options {
  conversationId: number | null;
  whiteboardId: string | null;
  token: string | null;
  onEntries: (entries: WhiteboardEntry[]) => void;
}

const INITIAL: TeachingState = {
  phase: "IDLE",
  pauseQuestion: null,
  stepIndex: 0,
  userDraft: "",
};

export function useWhiteboardTeaching({ conversationId, whiteboardId, token, onEntries }: Options) {
  const [state, setState] = useState<TeachingState>(INITIAL);
  const onEntriesRef = useRef(onEntries);
  onEntriesRef.current = onEntries;

  const buildFallbackEntry = useCallback(
    (
      targetConversationId: number,
      targetWhiteboardId: string,
      stepIndex: number,
      content: string
    ): WhiteboardEntry => ({
      id: -(Date.now() + stepIndex),
      whiteboardId: targetWhiteboardId,
      conversationId: targetConversationId,
      type: "SYSTEM_NOTE",
      author: "assistant",
      content,
      orderIndex: Math.max(1, stepIndex + 1),
    }),
    []
  );

  const callTeach = useCallback(
    async (
      userInput: string | undefined,
      stepIndex: number,
      topic?: string,
      targetWhiteboardId = whiteboardId
    ) => {
      if (!conversationId || !targetWhiteboardId || !token) return;

      setState((s) => ({
        ...s,
        phase: stepIndex === 0 ? "THINKING" : "CONTINUING",
        userDraft: "",
      }));

      try {
        const resp = await teachWhiteboard(conversationId, targetWhiteboardId, token, {
          userInput: userInput?.trim() || undefined,
          stepIndex,
          topic,
        });

        const entries = resp.entries.length > 0
          ? resp.entries
          : [
              buildFallbackEntry(
                conversationId,
                targetWhiteboardId,
                stepIndex,
                "No recibí contenido para mostrar en la pizarra. Intentá pedir la explicación nuevamente."
              ),
            ];

        onEntriesRef.current(entries);

        setState((s) => ({
          ...s,
          phase: "WRITING_FRAGMENT",
          pauseQuestion: resp.pauseQuestion,
          stepIndex: resp.nextStepIndex,
          userDraft: "",
        }));

        // onAnimationComplete() is called externally when the animation finishes
        // and transitions WRITING_FRAGMENT → WAITING_USER_INPUT | COMPLETED
        // Store isComplete in a closure for the callback
        return resp.isComplete;
      } catch {
        onEntriesRef.current([
          buildFallbackEntry(
            conversationId,
            targetWhiteboardId,
            stepIndex,
            "No pude cargar la explicación en la pizarra. Intentá de nuevo en unos segundos."
          ),
        ]);
        setState((s) => ({
          ...s,
          phase: "WRITING_FRAGMENT",
          pauseQuestion: null,
          stepIndex,
          userDraft: "",
        }));
        return true;
      }
    },
    [buildFallbackEntry, conversationId, token, whiteboardId]
  );

  // Called by parent when the animation for the current fragment finishes
  const onAnimationComplete = useCallback(() => {
    setState((s) => {
      if (s.phase !== "WRITING_FRAGMENT") return s;
      // If no question was set (isComplete was true), go to COMPLETED
      return { ...s, phase: s.pauseQuestion ? "WAITING_USER_INPUT" : "COMPLETED" };
    });
  }, []);

  const start = useCallback(
    (topic?: string, targetWhiteboardId?: string) => {
      void callTeach(undefined, 0, topic, targetWhiteboardId);
    },
    [callTeach]
  );

  const submitResponse = useCallback((canvasAnswer?: string) => {
    setState((s) => {
      if (s.phase !== "WAITING_USER_INPUT" && s.phase !== "USER_WRITING") return s;
      const answer = canvasAnswer?.trim() || s.userDraft.trim();
      if (!answer) return s;
      void callTeach(answer, s.stepIndex);
      return { ...s, phase: "ANALYZING_USER_INPUT", userDraft: "" };
    });
  }, [callTeach]);

  const continueWithout = useCallback(() => {
    setState((s) => {
      void callTeach(undefined, s.stepIndex);
      return { ...s, phase: "CONTINUING" };
    });
  }, [callTeach]);

  const setUserDraft = useCallback((v: string) => {
    setState((s) => {
      const nextPhase =
        v.length > 0 && s.phase === "WAITING_USER_INPUT"
          ? "USER_WRITING"
          : v.length === 0 && s.phase === "USER_WRITING"
          ? "WAITING_USER_INPUT"
          : s.phase;
      return { ...s, userDraft: v, phase: nextPhase };
    });
  }, []);

  const reset = useCallback(() => setState(INITIAL), []);

  const isActive =
    state.phase !== "IDLE" && state.phase !== "COMPLETED";

  return {
    phase: state.phase,
    pauseQuestion: state.pauseQuestion,
    userDraft: state.userDraft,
    stepIndex: state.stepIndex,
    isActive,
    start,
    onAnimationComplete,
    submitResponse,
    continueWithout,
    setUserDraft,
    reset,
  };
}
