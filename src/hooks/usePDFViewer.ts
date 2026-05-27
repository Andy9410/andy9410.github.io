import { useState, useCallback, useEffect } from "react";
import type { ActiveExercise } from "@/types/chat";
import { exerciseOutToDetected, listExercises } from "@/services/documentApi";
import { mergeDetectedExercises } from "@/lib/pdfExerciseDetection";
import type { DetectedExercise } from "@/types/pdfExercises";

export function usePDFViewer(token: string | null) {
  const [activeDocId, setActiveDocId] = useState<number | null>(null);
  const [activeDocName, setActiveDocName] = useState<string | null>(null);
  const [activeExercise, setActiveExercise] = useState<ActiveExercise | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [exercises, setExercises] = useState<DetectedExercise[]>([]);
  const [loadingExercises, setLoadingExercises] = useState(false);

  useEffect(() => {
    if (!activeDocId || !token) {
      setExercises([]);
      setLoadingExercises(false);
      return;
    }

    setLoadingExercises(true);
    listExercises(activeDocId, token)
      .then((items) => setExercises(items.map(exerciseOutToDetected)))
      .catch(() => setExercises([]))
      .finally(() => setLoadingExercises(false));
  }, [activeDocId, token]);

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

  const syncDetectedExercises = useCallback((detected: DetectedExercise[]) => {
    setExercises((current) => mergeDetectedExercises(detected, current));
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
    exercises,
    loadingExercises,
    openDocument,
    closeViewer,
    selectExercise,
    syncDetectedExercises,
    clearExercise,
    clearAll,
  };
}
