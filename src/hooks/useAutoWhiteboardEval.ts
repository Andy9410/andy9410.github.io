import { useCallback, useEffect, useRef } from "react";
import type { Whiteboard } from "@/types/whiteboard";

const DEBOUNCE_MS = 3000; // wait 3s of inactivity before evaluating

interface Options {
  whiteboard: Whiteboard | null;
  panelOpen: boolean;
  chatIdle: boolean;           // true when chat is not loading
  teacherMode?: boolean;       // when true, fires onAnnotate instead of onEvaluate
  onEvaluate: () => void;      // fires in normal mode → sends to chat
  onAnnotate?: () => void;     // fires in teacher mode → annotates whiteboard directly
}

/**
 * Automatically triggers whiteboard evaluation when the user adds or
 * modifies elements, without requiring the "Preguntar sobre la pizarra" button.
 *
 * Fires after DEBOUNCE_MS ms of inactivity on the whiteboard data.
 * Only triggers when:
 *  - The whiteboard panel is open
 *  - The whiteboard has at least one user element
 *  - The chat is idle (not loading)
 *  - The element count actually increased (new content was drawn)
 *
 * In teacher mode, calls onAnnotate (AI writes directly on the whiteboard)
 * instead of onEvaluate (AI responds in chat).
 */
export function useAutoWhiteboardEval({ whiteboard, panelOpen, chatIdle, teacherMode = false, onEvaluate, onAnnotate }: Options) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevCountRef = useRef<number>(0);
  const onEvaluateRef = useRef(onEvaluate);
  onEvaluateRef.current = onEvaluate;
  const onAnnotateRef = useRef(onAnnotate);
  onAnnotateRef.current = onAnnotate;
  const teacherModeRef = useRef(teacherMode);
  teacherModeRef.current = teacherMode;

  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    const elements = whiteboard?.data?.elements ?? [];
    const count = elements.length;

    // Reset counter when whiteboard changes
    if (!whiteboard) {
      prevCountRef.current = 0;
      cancel();
      return;
    }

    // Only trigger if new elements were added (user drew something)
    const newContent = count > prevCountRef.current;
    prevCountRef.current = count;

    if (!panelOpen || count === 0 || !newContent || !chatIdle) {
      cancel();
      return;
    }

    // Debounce: reset timer on every change
    cancel();
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      if (teacherModeRef.current && onAnnotateRef.current) {
        onAnnotateRef.current();
      } else {
        onEvaluateRef.current();
      }
    }, DEBOUNCE_MS);

    return cancel;
  }, [whiteboard?.data?.elements, panelOpen, chatIdle, cancel]);

  // Cleanup on unmount
  useEffect(() => cancel, [cancel]);
}
