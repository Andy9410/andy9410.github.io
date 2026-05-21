import { useState, useCallback, useRef, useEffect } from "react";

const RATE_LIMIT_MAX = Number(import.meta.env.VITE_RATE_LIMIT_MAX ?? 20);
const RATE_LIMIT_WINDOW_MS = Number(import.meta.env.VITE_RATE_LIMIT_WINDOW_MS ?? 60_000);

const savePrefDoc = (backendId: number, docId: number) => {
  try { localStorage.setItem(`ls_pref_doc_${backendId}`, String(docId)); } catch {}
};
const loadPrefDoc = (backendId: number): number | undefined => {
  try { return Number(localStorage.getItem(`ls_pref_doc_${backendId}`)) || undefined; } catch { return undefined; }
};

const DEFAULT_LEVEL = 3;
const loadLevel = (): number => {
  try { return Number(localStorage.getItem("ls_explanation_level")) || DEFAULT_LEVEL; } catch { return DEFAULT_LEVEL; }
};
const saveLevel = (level: number) => {
  try { localStorage.setItem("ls_explanation_level", String(level)); } catch {}
};
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

const deriveTitle = (content: string, files?: File[]): string => {
  const t = content.trim() || files?.[0]?.name || "Nueva conversación";
  return t.length > 45 ? t.slice(0, 45) + "…" : t;
};

export const useChat = () => {
  const { accessToken, refreshAccessToken, forceLogout } = useAuth();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [status, setStatus] = useState<ChatStatus>("idle");
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [hasConnectionError, setHasConnectionError] = useState(false);
  const [connectionReady, setConnectionReady] = useState(false);
  const [rateLimitSecondsLeft, setRateLimitSecondsLeft] = useState(0);
  const [explanationLevel, setExplanationLevelState] = useState<number>(loadLevel);

  const setExplanationLevel = useCallback((level: number) => {
    setExplanationLevelState(level);
    saveLevel(level);
  }, []);

  const msgTimestampsRef = useRef<number[]>([]);
  const rateLimitTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
            preferredDocumentId: loadPrefDoc(s.id),
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
        const { messages: backendMessages, hasMore } = await fetchConversationMessages(conv.backendId, accessToken);
        setConversations((prev) =>
          prev.map((c) =>
            c.id === id
              ? {
                  ...c,
                  messagesLoaded: true,
                  hasMoreMessages: hasMore,
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
    async (content: string, files?: File[]) => {
      const file = files?.[0];
      if (!content.trim() && !files?.length) return;
      if (status === "loading" || !accessToken) return;

      const now = Date.now();
      msgTimestampsRef.current = msgTimestampsRef.current.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
      if (msgTimestampsRef.current.length >= RATE_LIMIT_MAX) {
        const oldestExpiry = msgTimestampsRef.current[0] + RATE_LIMIT_WINDOW_MS;
        const secondsLeft = Math.ceil((oldestExpiry - now) / 1000);
        setRateLimitSecondsLeft(secondsLeft);
        if (!rateLimitTimerRef.current) {
          rateLimitTimerRef.current = setInterval(() => {
            const remaining = Math.ceil((msgTimestampsRef.current[0] + RATE_LIMIT_WINDOW_MS - Date.now()) / 1000);
            if (remaining <= 0) {
              setRateLimitSecondsLeft(0);
              clearInterval(rateLimitTimerRef.current!);
              rateLimitTimerRef.current = null;
            } else {
              setRateLimitSecondsLeft(remaining);
            }
          }, 1000);
        }
        return;
      }
      msgTimestampsRef.current.push(now);

      let targetId = activeIdRef.current;
      let targetBackendId: number | undefined;

      if (!targetId) {
        targetId = crypto.randomUUID();
        const title = deriveTitle(content, files);
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
        attachedFileName: files?.length ? files.map(f => f.name).join(", ") : undefined,
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
                    ? deriveTitle(content, files)
                    : c.title,
              }
            : c
        )
      );

      setStatus("loading");

      // Upload attached files before streaming so RAG can find them
      let uploadedDocId: number | undefined;
      if (files?.length) {
        const doUpload = async (token: string) => uploadDocuments(files, token);
        let uploadError: string | null = null;
        try {
          const results = await doUpload(accessToken).catch(async (err: Error) => {
            if (err.message === "401") {
              const fresh = await refreshAccessToken();
              if (!fresh) throw new Error("session_expired");
              return doUpload(fresh);
            }
            throw err;
          });
          uploadedDocId = results[0]?.document_id ?? undefined;
          if (uploadedDocId) {
            setConversations((prev) =>
              prev.map((c) => c.id === capturedId ? { ...c, preferredDocumentId: uploadedDocId } : c)
            );
          }
        } catch (err) {
          const code = err instanceof Error ? err.message : "";
          if (code === "401" || code === "session_expired" || code === "403") {
            if (code === "403") forceLogout();
            setStatus("idle");
            return;
          }
          uploadError =
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

      const activeDocId = uploadedDocId
        ?? conversationsRef.current.find((c) => c.id === capturedId)?.preferredDocumentId;

      const capturedLevel = explanationLevel;

      const doStream = (token: string) =>
        streamChatMessage(userMsg.content, token, targetBackendId, async (event) => {
          if (event.type === "meta") {
            setConversations((prev) =>
              prev.map((c) =>
                c.id === capturedId ? { ...c, backendId: event.conversationId } : c
              )
            );
            if (uploadedDocId) {
              savePrefDoc(event.conversationId, uploadedDocId);
            }
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
            setConversations((prev) =>
              prev.map((c) =>
                c.id === capturedId
                  ? {
                      ...c,
                      messages: c.messages.map((m) =>
                        m.id === aiMsgId ? { ...m, content: (m.content ?? "") + event.text} : m
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
        }, undefined, activeDocId, capturedLevel);

      try {
        await doStream(accessToken).catch(async (err: Error) => {
          if (err.message === "401") {
            const fresh = await refreshAccessToken();
            if (!fresh) return; // clearSession + redirect handled by refreshAccessToken
            return doStream(fresh);
          }
          if (err.message === "403") {
            forceLogout();
            return;
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
    [accessToken, status, explanationLevel, refreshAccessToken, forceLogout]
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
      }, undefined, undefined, explanationLevel);

    try {
      await doStream(accessToken).catch(async (err: Error) => {
        if (err.message === "401") {
          const fresh = await refreshAccessToken();
          if (!fresh) return;
          return doStream(fresh);
        }
        if (err.message === "403") {
          forceLogout();
          return;
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
  }, [accessToken, status, explanationLevel, refreshAccessToken, forceLogout]);

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
        preferredDocumentId: loadPrefDoc(s.id),
        createdAt: new Date(s.createdAt),
        updatedAt: new Date(s.createdAt),
      })));
    } catch {}

    const activeConv = conversationsRef.current.find((c) => c.id === activeIdRef.current);
    if (activeConv?.backendId) {
      try {
        const { messages: msgs, hasMore } = await fetchConversationMessages(activeConv.backendId, token);
        setConversations((prev) =>
          prev.map((c) =>
            c.id === activeIdRef.current
              ? {
                  ...c,
                  messagesLoaded: true,
                  hasMoreMessages: hasMore,
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
    rateLimitSecondsLeft,
    explanationLevel,
    setExplanationLevel,
    newConversation,
    sendMessage,
    selectConversation,
    deleteConversation,
    regenerateLastMessage,
  };
};
