import { useState, useCallback, useRef, useEffect } from "react";
import type { Conversation, Message, ChatStatus } from "@/types/chat";
import {
  streamChatMessage,
  fetchMyConversations,
  fetchConversationMessages,
  deleteConversationApi,
  generateConversationTitle,
  checkHealth,
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

      let receivedContent = false;

      const isNewConversation = !targetBackendId;

      const doStream = (token: string) =>
        streamChatMessage(content.trim(), token, targetBackendId, async (event) => {
          if (event.type === "meta") {
            setConversations((prev) =>
              prev.map((c) =>
                c.id === capturedId ? { ...c, backendId: event.conversationId } : c
              )
            );
            if (isNewConversation) {
              generateConversationTitle(event.conversationId, token)
                .then((title) => {
                  setConversations((prev) =>
                    prev.map((c) => (c.id === capturedId ? { ...c, title } : c))
                  );
                })
                .catch(() => {});
            }
          } else if (event.type === "chunk") {
            receivedContent = true;
            await new Promise((r) => setTimeout(r, 40));
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
          } else if (event.type === "error") {
            setConversations((prev) =>
              prev.map((c) =>
                c.id === capturedId
                  ? {
                      ...c,
                      messages: c.messages.map((m) =>
                        m.id === aiMsgId
                          ? {
                              ...m,
                              content: m.content || "El servicio encontró un error. Intentá de nuevo más tarde.",
                              isError: true,
                            }
                          : m
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
        if (!receivedContent) {
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
        }
        setStatus("idle");
      }
    },
    [accessToken, status, refreshAccessToken]
  );

  const reloadData = useCallback(async (token: string) => {
    try {
      const summaries = await fetchMyConversations(token);
      setConversations(summaries.map((s) => ({
        id: `backend-${s.id}`,
        backendId: s.id,
        title: s.title,
        messages: [],
        messagesLoaded: false,
        createdAt: new Date(s.createdAt),
        updatedAt: new Date(s.createdAt),
      })));
    } catch {}

    const activeConv = conversationsRef.current.find((c) => c.id === activeIdRef.current);
    if (activeConv?.backendId) {
      try {
        const msgs = await fetchConversationMessages(activeConv.backendId, token);
        setConversations((prev) =>
          prev.map((c) =>
            c.id === activeIdRef.current
              ? {
                  ...c,
                  messagesLoaded: true,
                  messages: msgs.map((m) => ({
                    id: String(m.id),
                    role: m.role,
                    content: m.content,
                    timestamp: new Date(m.createdAt),
                  })),
                }
              : c
          )
        );
      } catch {}
    }
  }, []);

  const handleRestored = useCallback(() => {
    setHasConnectionError(false);
    if (accessToken) reloadData(accessToken);
  }, [accessToken, reloadData]);

  // Heartbeat: proactively detect API downtime every 30s
  useEffect(() => {
    if (!accessToken) return;
    const id = setInterval(async () => {
      const ok = await checkHealth();
      if (!ok) setHasConnectionError(true);
    }, 30_000);
    return () => clearInterval(id);
  }, [accessToken]);

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
    isOffline: hasConnectionError,
    isLoadingHistory,
    sidebarOpen,
    setSidebarOpen,
    newConversation,
    sendMessage,
    selectConversation,
    deleteConversation,
  };
};
