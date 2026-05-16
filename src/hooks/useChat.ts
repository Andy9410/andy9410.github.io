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
import { uploadDocuments } from "@/services/documentApi";
import { useHealthCheck } from "./useHealthCheck";
import { useAuth } from "@/auth/useAuth";

const deriveTitle = (content: string, file?: File): string => {
  const t = content.trim() || file?.name || "Nueva conversación";
  return t.length > 45 ? t.slice(0, 45) + "…" : t;
};

export const useChat = () => {
  const { accessToken, refreshAccessToken } = useAuth();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [status, setStatus] = useState<ChatStatus>("idle");
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [hasConnectionError, setHasConnectionError] = useState(false);
  const [connectionReady, setConnectionReady] = useState(false);

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
            messageCount: s.messageCount,
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
  }, []);

  const selectConversation = useCallback(
    async (id: string) => {
      setActiveId(id);

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
                  messageCount: backendMessages.length,
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
    async (content: string, file?: File) => {
      if (!content.trim() && !file) return;
      if (status === "loading" || !accessToken) return;

      let targetId = activeIdRef.current;
      let targetBackendId: number | undefined;

      if (!targetId) {
        targetId = crypto.randomUUID();
        const title = deriveTitle(content, file);
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
        content: content.trim() || "Analizá el documento adjunto.",
        timestamp: new Date(),
        attachedFileName: file?.name,
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
                    ? deriveTitle(content, file)
                    : c.title,
              }
            : c
        )
      );

      setStatus("loading");

      // Upload attached file before streaming so RAG can find it
      let uploadedDocId: number | undefined;
      if (file) {
        const doUpload = async (token: string) => uploadDocuments([file], token);
        let uploadError: string | null = null;
        try {
          const results = await doUpload(accessToken).catch(async (err: Error) => {
            if (err.message === "401") {
              const fresh = await refreshAccessToken();
              if (!fresh) throw err;
              return doUpload(fresh);
            }
            throw err;
          });
          uploadedDocId = results[0]?.document_id ?? undefined;
        } catch (err) {
          const code = err instanceof Error ? err.message : "";
          uploadError =
            code === "401" ? "Tu sesión expiró. Recargá la página e intentá de nuevo." :
            code === "422" ? "El archivo no es un PDF válido o está protegido." :
            code === "413" ? "El archivo supera el tamaño máximo permitido (20 MB)." :
            code.startsWith("Type") ? "No se pudo conectar con el servidor de documentos." :
            "No se pudo procesar el documento adjunto. Intentá de nuevo.";
        }
        if (uploadError) {
          setConversations((prev) =>
            prev.map((c) =>
              c.id === capturedId
                ? {
                    ...c,
                    messages: c.messages.map((m) =>
                      m.id === aiMsgId ? { ...m, content: uploadError!, isError: true } : m
                    ),
                  }
                : c
            )
          );
          setStatus("idle");
          return;
        }
      }

      let receivedContent = false;

      const isNewConversation = !targetBackendId;

      const doStream = (token: string) =>
        streamChatMessage(userMsg.content, token, targetBackendId, async (event) => {
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
          } else if (event.type === "sources") {
            setConversations((prev) =>
              prev.map((c) =>
                c.id === capturedId
                  ? {
                      ...c,
                      messages: c.messages.map((m) =>
                        m.id === aiMsgId ? { ...m, sources: event.files } : m
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
        }, undefined, uploadedDocId);

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

  const regenerateLastMessage = useCallback(async () => {
    if (status === "loading" || !accessToken) return;

    const conv = conversationsRef.current.find((c) => c.id === activeIdRef.current);
    if (!conv) return;

    const msgs = conv.messages;
    const lastAiEntry = [...msgs].reverse().find((m) => m.role === "assistant");
    if (!lastAiEntry) return;

    const lastUserMsg = [...msgs]
      .slice(0, msgs.indexOf(lastAiEntry))
      .reverse()
      .find((m) => m.role === "user");
    if (!lastUserMsg) return;

    const capturedId = activeIdRef.current!;
    const aiMsgId = lastAiEntry.id;
    const targetBackendId = conv.backendId;
    const isFirstExchange = msgs.filter((m) => m.role === "user").length === 1;

    setConversations((prev) =>
      prev.map((c) =>
        c.id === capturedId
          ? { ...c, messages: c.messages.map((m) =>
              m.id === aiMsgId ? { ...m, content: "", isError: false, timestamp: new Date() } : m
            )}
          : c
      )
    );
    setStatus("loading");

    let receivedContent = false;

    const doStream = (token: string) =>
      streamChatMessage(lastUserMsg.content, token, targetBackendId, async (event) => {
        if (event.type === "meta") {
          setConversations((prev) =>
            prev.map((c) =>
              c.id === capturedId ? { ...c, backendId: event.conversationId } : c
            )
          );
          if (isFirstExchange) {
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
                ? { ...c, messages: c.messages.map((m) =>
                    m.id === aiMsgId ? { ...m, content: m.content + event.text } : m
                  )}
                : c
            )
          );
        } else if (event.type === "error") {
          setConversations((prev) =>
            prev.map((c) =>
              c.id === capturedId
                ? { ...c, messages: c.messages.map((m) =>
                    m.id === aiMsgId
                      ? { ...m, content: m.content || "Error al regenerar. Intentá de nuevo.", isError: true }
                      : m
                  )}
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
    } catch {
      if (!receivedContent) {
        setConversations((prev) =>
          prev.map((c) =>
            c.id === capturedId
              ? { ...c, messages: c.messages.map((m) =>
                  m.id === aiMsgId
                    ? { ...m, content: "Error al regenerar. Intentá de nuevo.", isError: true }
                    : m
                )}
              : c
          )
        );
      }
      setStatus("idle");
    }
  }, [accessToken, status, refreshAccessToken]);

  const reloadData = useCallback(async (token: string) => {
    try {
      const summaries = await fetchMyConversations(token);
      setConversations(summaries.map((s) => ({
        id: `backend-${s.id}`,
        backendId: s.id,
        title: s.title,
        messages: [],
        messagesLoaded: false,
        messageCount: s.messageCount,
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

  // Heartbeat: check immediately on login, then every 20s
  useEffect(() => {
    if (!accessToken) return;
    const check = async () => {
      const ok = await checkHealth();
      if (ok) {
        setConnectionReady(true);
        setHasConnectionError(false);
      } else {
        setHasConnectionError(true);
      }
    };
    check();
    const id = setInterval(check, 20_000);
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
    connectionReady,
    isLoadingHistory,
    newConversation,
    sendMessage,
    selectConversation,
    deleteConversation,
    regenerateLastMessage,
  };
};
