import { useState, useCallback } from "react";
import type { ActiveExercise } from "@/types/chat";

export function usePDFViewer() {
  const [activeDocId, setActiveDocId] = useState<number | null>(null);
  const [activeDocName, setActiveDocName] = useState<string | null>(null);
  const [activeExercise, setActiveExercise] = useState<ActiveExercise | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);

  const openDocument = useCallback((id: number, name: string) => {
    setActiveDocId(id);
    setActiveDocName(name);
    setViewerOpen(true);
    setActiveExercise(null);
  }, []);

  const closeViewer = useCallback(() => setViewerOpen(false), []);

  const selectExercise = useCallback((exercise: ActiveExercise) => {
    setActiveExercise(exercise);
    setViewerOpen(true);
  }, []);

  const clearExercise = useCallback(() => setActiveExercise(null), []);

  const clearAll = useCallback(() => {
    setActiveDocId(null);
    setActiveDocName(null);
    setActiveExercise(null);
    setViewerOpen(false);
  }, []);

  return {
    activeDocId,
    activeDocName,
    activeExercise,
    viewerOpen,
    openDocument,
    closeViewer,
    selectExercise,
    clearExercise,
    clearAll,
  };
}
