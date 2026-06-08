import { useCallback, useEffect, useState } from "react";
import { createWhiteboard, listWhiteboards } from "@/services/whiteboardApi";
import type { Whiteboard, WhiteboardData, WhiteboardElement, WhiteboardSuggestion } from "@/types/whiteboard";

const emptyData: WhiteboardData = { version: 1, elements: [] };

export function useWhiteboard(token: string | null, conversationId?: number) {
  const [whiteboards, setWhiteboards] = useState<Whiteboard[]>([]);
  const [activeWhiteboard, setActiveWhiteboard] = useState<Whiteboard | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !conversationId) {
      setWhiteboards([]);
      setActiveWhiteboard(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    listWhiteboards(conversationId, token)
      .then((items) => {
        if (cancelled) return;
        setWhiteboards(items);
        setActiveWhiteboard(items[0] ?? null);
      })
      .catch(() => {
        if (!cancelled) setError("No se pudieron cargar las pizarras.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [conversationId, token]);

  const openConversationWhiteboard = useCallback(async (overrideConversationId?: number) => {
    const targetConversationId = overrideConversationId ?? conversationId;
    setPanelOpen(true);
    setError(null);
    if (!token) {
      setError("No hay sesión activa para abrir la pizarra.");
      return null;
    }
    if (!targetConversationId) {
      setError("No se pudo preparar la conversación para la pizarra.");
      return null;
    }
    setLoading(true);
    try {
      let items: Whiteboard[] | null = null;
      const existing = activeWhiteboard?.conversationId === targetConversationId
        ? activeWhiteboard
        : (items = await listWhiteboards(targetConversationId, token))[0] ?? null;
      const board = existing ?? await createWhiteboard(targetConversationId, token, {
        title: "Pizarra inteligente",
        data: emptyData,
      });
      setActiveWhiteboard(board);
      setWhiteboards((current) => {
        const source = targetConversationId === conversationId ? items ?? current : current;
        return [board, ...source.filter((item) => item.id !== board.id)];
      });
      return board;
    } catch (err) {
      setError(err instanceof Error ? `No se pudo abrir la pizarra (${err.message}).` : "No se pudo abrir la pizarra.");
      return null;
    } finally {
      setLoading(false);
    }
  }, [activeWhiteboard, conversationId, token]);

  const openExerciseWhiteboard = useCallback(async (exerciseLabel: string, documentId?: number, overrideConversationId?: number) => {
    const targetConversationId = overrideConversationId ?? conversationId;
    setPanelOpen(true);
    setError(null);
    if (!token) {
      setError("No hay sesión activa para abrir la pizarra.");
      return null;
    }
    if (!targetConversationId) {
      setError("No se pudo preparar la conversación para la pizarra.");
      return null;
    }
    setLoading(true);
    try {
      const board = await createWhiteboard(targetConversationId, token, {
        documentId,
        exerciseLabel,
        title: `Pizarra - ${exerciseLabel}`,
        data: emptyData,
      });
      setActiveWhiteboard(board);
      setWhiteboards((items) => [board, ...items.filter((item) => item.id !== board.id)]);
      return board;
    } catch (err) {
      setError(err instanceof Error ? `No se pudo abrir la pizarra (${err.message}).` : "No se pudo abrir la pizarra.");
      return null;
    } finally {
      setLoading(false);
    }
  }, [conversationId, token]);

  const updateData = useCallback((updater: (data: WhiteboardData) => WhiteboardData) => {
    setActiveWhiteboard((current) =>
      current ? { ...current, data: updater(current.data) } : current
    );
  }, []);

  const applySuggestion = useCallback((suggestion: WhiteboardSuggestion) => {
    updateData((data) => ({
      ...data,
      elements: [
        ...data.elements,
        ...suggestion.elements.map((element): WhiteboardElement => ({
          ...element,
          id: crypto.randomUUID(),
        })),
      ],
    }));
    setPanelOpen(true);
  }, [updateData]);

  const openPendingPanel = useCallback(() => {
    setPanelOpen(true);
    setError(null);
    setLoading(true);
  }, []);

  const failPendingPanel = useCallback((message: string) => {
    setPanelOpen(true);
    setLoading(false);
    setError(message);
  }, []);

  return {
    whiteboards,
    activeWhiteboard,
    panelOpen,
    loading,
    error,
    setPanelOpen,
    setActiveWhiteboard,
    openPendingPanel,
    failPendingPanel,
    openConversationWhiteboard,
    openExerciseWhiteboard,
    updateData,
    applySuggestion,
  };
}
