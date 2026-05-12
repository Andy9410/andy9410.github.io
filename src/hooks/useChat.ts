import { useState, useCallback, useRef, useEffect } from "react";
import type { Conversation, Message, ChatStatus } from "@/types/chat";
import {
  streamChatMessage,
  fetchMyConversations,
  fetchConversationMessages,
  deleteConversationApi,
} from "@/services/chatApi";
import { useHealthCheck } from "./useHealthCheck";
import { useAuth } from "@/auth/useAuth";

export const useChat = () => {
  const { accessToken, refreshAccessToken } = useAuth();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [status, setStatus] = useState<ChatStatus>("idle");
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [hasConnectionError, setHasConnectionError] = useState(false);

  const conversationsRef = useRef(conversations);
  conversationsRef.current = conversations;
  const activeIdRef = useRef(activeId);
  activeIdRef.current = activeId;

  const activeConversation = conversations.find((c) => c.id === activeId) ?? null;

  useEffect(() => {
    if (!accessToken) {
      setConversations([]);
      setActiveId(null);
      return;
    }

    let cancelled = false;
    setIsLoadingHistory(true);

    fetchMyConversations(accessToken)
      .then((summaries) => {
        if (cancelled) return;
        setConversations(
          summaries.map((s) => ({
            id: `backend-${s.id}`,
            backendId: s.id,
            title: s.title,
            messages: [],
            messagesLoaded: false,
            createdAt: new Date(s.createdAt),
            updatedAt: new Date(s.createdAt),
          }))
        );
      })
      .catch(() => {
        if (!cancelled) setConversations([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingHistory(false);
      });

    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  const newConversation = useCallback(() => {
    const existing = conversationsRef.current.find(
      (c) => !c.backendId && c.messages.length === 0
    );
    if (existing) {
      setActiveId(existing.id);
      setSidebarOpen(false);
      return;
    }

    const id = crypto.randomUUID();
    const conv: Conversation = {
      id,
      title: "Nueva conversación",
      messages: [],
      messagesLoaded: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setConversations((prev) => [conv, ...prev]);
    setActiveId(id);
    setSidebarOpen(false);
  }, []);

  const selectConversation = useCallback(
    async (id: string) => {
      setActiveId(id);
      setSidebarOpen(false);

      const conv = conversationsRef.current.find((c) => c.id === id);
      if (!conv || conv.messagesLoaded || !conv.backendId || !accessToken) return;

      try {
        const backendMessages = await fetchConversationMessages(conv.backendId, accessToken);
        setConversations((prev) =>
          prev.map((c) =>
            c.id === id
              ? {
                  ...c,
                  messagesLoaded: true,
                  messages: backendMessages.map((m) => ({
                    id: String(m.id),
                    role: m.role,
                    content: m.content,
                    timestamp: new Date(m.createdAt),
                  })),
                  updatedAt:
                    backendMessages.length > 0
                      ? new Date(backendMessages[backendMessages.length - 1].createdAt)
                      : c.updatedAt,
                }
              : c
          )
        );
      } catch {
        setConversations((prev) =>
          prev.map((c) => (c.id === id ? { ...c, messagesLoaded: true } : c))
        );
      }
    },
    [accessToken]
  );

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || status === "loading" || !accessToken) return;

      let targetId = activeIdRef.current;
      let targetBackendId: number | undefined;

      if (!targetId) {
        targetId = crypto.randomUUID();
        const title = content.length > 45 ? content.slice(0, 45) + "…" : content;
        const newConv: Conversation = {
          id: targetId,
          title,
          messages: [],
          messagesLoaded: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        setConversations((prev) => [newConv, ...prev]);
        setActiveId(targetId);
      } else {
        targetBackendId = conversationsRef.current.find((c) => c.id === targetId)?.backendId;
      }

      const capturedId = targetId;

      const userMsg: Message = {
        id: crypto.randomUUID(),
        role: "user",
        content: content.trim(),
        timestamp: new Date(),
      };

      const aiMsgId = crypto.randomUUID();
      const aiMsg: Message = {
        id: aiMsgId,
        role: "assistant",
        content: "",
        timestamp: new Date(),
      };

      setConversations((prev) =>
        prev.map((c) =>
          c.id === capturedId
            ? {
                ...c,
                messages: [...c.messages, userMsg, aiMsg],
                updatedAt: new Date(),
                title:
                  c.messages.length === 0
                    ? content.length > 45
                      ? content.slice(0, 45) + "…"
                      : content
                    : c.title,
              }
            : c
        )
      );

      setStatus("loading");

      const doStream = (token: string) =>
        streamChatMessage(content.trim(), token, targetBackendId, (event) => {
          if (event.type === "meta") {
            setConversations((prev) =>
              prev.map((c) =>
                c.id === capturedId ? { ...c, backendId: event.conversationId } : c
              )
            );
          } else if (event.type === "chunk") {
            setConversations((prev) =>
              prev.map((c) =>
                c.id === capturedId
                  ? {
                      ...c,
                      messages: c.messages.map((m) =>
                        m.id === aiMsgId ? { ...m, content: m.content + event.text } : m
                      ),
                    }
                  : c
              )
            );
          }
        });

      try {
        await doStream(accessToken).catch(async (err: Error) => {
          if (err.message === "401") {
            const fresh = await refreshAccessToken();
            if (!fresh) throw err;
            return doStream(fresh);
          }
          throw err;
        });
        setStatus("idle");
      } catch (err) {
        const isNetworkDown = err instanceof TypeError;
        setConversations((prev) =>
          prev.map((c) =>
            c.id === capturedId
              ? {
                  ...c,
                  messages: c.messages.map((m) =>
                    m.id === aiMsgId
                      ? {
                          ...m,
                          content: isNetworkDown
                            ? "No se pudo conectar con el servicio. Verificá tu conexión e intentá de nuevo."
                            : "El servicio encontró un error. Intentá de nuevo más tarde.",
                          isError: true,
                        }
                      : m
                  ),
                }
              : c
          )
        );
        if (isNetworkDown) setHasConnectionError(true);
        setStatus("idle");
      }
    },
    [accessToken, status, refreshAccessToken]
  );

  const handleRestored = useCallback(() => {
    const targetId = activeIdRef.current;
    const restoredMsg: Message = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: "Conexión reestablecida. Podés continuar la conversación.",
      timestamp: new Date(),
      isRestored: true,
    };
    if (targetId) {
      setConversations((prev) =>
        prev.map((c) =>
          c.id === targetId ? { ...c, messages: [...c.messages, restoredMsg] } : c
        )
      );
    }
    setHasConnectionError(false);
  }, []);

  useHealthCheck(hasConnectionError, handleRestored);

  const deleteConversation = useCallback(
    async (id: string) => {
      const conv = conversationsRef.current.find((c) => c.id === id);
      setConversations((prev) => prev.filter((c) => c.id !== id));
      setActiveId((prev) => (prev === id ? null : prev));

      if (conv?.backendId && accessToken) {
        deleteConversationApi(conv.backendId, accessToken).catch(() => {});
      }
    },
    [accessToken]
  );

  return {
    conversations,
    activeConversation,
    activeId,
    status,
    isLoadingHistory,
    sidebarOpen,
    setSidebarOpen,
    newConversation,
    sendMessage,
    selectConversation,
    deleteConversation,
  };
};
