import { useEffect, useRef } from "react";
import { checkHealth } from "@/services/chatApi";

const MAX_DELAY_MS = 60_000;

export const useHealthCheck = (enabled: boolean, onRestored: () => void) => {
  const callbackRef = useRef(onRestored);
  callbackRef.current = onRestored;

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout>;
    let prev = 3, curr = 5;

    const nextDelay = () => {
      const delay = Math.min(prev * 1000, MAX_DELAY_MS);
      [prev, curr] = [curr, prev + curr];
      return delay;
    };

    const poll = async () => {
      const ok = await checkHealth();
      if (cancelled) return;
      if (ok) {
        callbackRef.current();
      } else {
        timeoutId = setTimeout(poll, nextDelay());
      }
    };

    timeoutId = setTimeout(poll, nextDelay());

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [enabled]);
};
