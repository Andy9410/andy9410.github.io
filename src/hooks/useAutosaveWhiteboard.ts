import { useCallback, useEffect, useRef, useState } from "react";
import type { Whiteboard } from "@/types/whiteboard";
import { updateWhiteboard } from "@/services/whiteboardApi";

export function useAutosaveWhiteboard(whiteboard: Whiteboard | null, token: string | null) {
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const lastSavedRef = useRef<string>("");
  const latestSerializedRef = useRef<string>("");
  const timeoutRef = useRef<number | null>(null);

  const flush = useCallback(async () => {
    if (!whiteboard || !token) return;
    const serialized = JSON.stringify(whiteboard.data);
    latestSerializedRef.current = serialized;
    if (serialized === lastSavedRef.current) return;

    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    setStatus("saving");
    await updateWhiteboard(whiteboard.id, token, {
      title: whiteboard.title,
      documentId: whiteboard.documentId ?? undefined,
      exerciseLabel: whiteboard.exerciseLabel ?? undefined,
      data: whiteboard.data,
    })
      .then(() => {
        lastSavedRef.current = serialized;
        setStatus(latestSerializedRef.current === serialized ? "saved" : "saving");
      })
      .catch((error) => {
        if (latestSerializedRef.current === serialized) setStatus("error");
        throw error;
      });
  }, [token, whiteboard]);

  useEffect(() => {
    if (!whiteboard || !token) return;

    const serialized = JSON.stringify(whiteboard.data);
    latestSerializedRef.current = serialized;
    if (serialized === lastSavedRef.current) return;

    setStatus("saving");
    timeoutRef.current = window.setTimeout(() => {
      void flush().catch(() => {});
    }, 650);

    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [flush, token, whiteboard]);

  useEffect(() => {
    lastSavedRef.current = whiteboard ? JSON.stringify(whiteboard.data) : "";
    latestSerializedRef.current = lastSavedRef.current;
    setStatus(whiteboard ? "saved" : "idle");
  }, [whiteboard?.id]);

  return { status, flush };
}
