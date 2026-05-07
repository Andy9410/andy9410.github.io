import { useState, useCallback } from "react";
import type { Conversation, Message, ChatStatus } from "@/types/chat";
import { mockConversations, generateMockResponse } from "@/mocks/chatMocks";

export const useChat = () => {
  const [conversations, setConversations] = useState<Conversation[]>(mockConversations);
  const [activeId, setActiveId] = useState<string | null>(mockConversations[0]?.id ?? null);
  const [status, setStatus] = useState<ChatStatus>("idle");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const activeConversation = conversations.find((c) => c.id === activeId) ?? null;

  const newConversation = useCallback(() => {
    const id = crypto.randomUUID();
    const conv: Conversation = {
      id,
      title: "Nueva conversación",
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setConversations((prev) => [conv, ...prev]);
    setActiveId(id);
    setSidebarOpen(false);
  }, []);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || status === "loading") return;

      let targetId = activeId;

      if (!targetId) {
        targetId = crypto.randomUUID();
        const title = content.length > 45 ? content.slice(0, 45) + "…" : content;
        const newConv: Conversation = {
          id: targetId,
          title,
          messages: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        setConversations((prev) => [newConv, ...prev]);
        setActiveId(targetId);
      }

      const capturedId = targetId;

      const userMsg: Message = {
        id: crypto.randomUUID(),
        role: "user",
        content: content.trim(),
        timestamp: new Date(),
      };

      setConversations((prev) =>
        prev.map((c) =>
          c.id === capturedId
            ? {
                ...c,
                messages: [...c.messages, userMsg],
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

      const delay = 1400 + Math.random() * 900;
      await new Promise((r) => setTimeout(r, delay));

      const aiMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: generateMockResponse(content),
        timestamp: new Date(),
      };

      setConversations((prev) =>
        prev.map((c) =>
          c.id === capturedId
            ? { ...c, messages: [...c.messages, aiMsg], updatedAt: new Date() }
            : c
        )
      );

      setStatus("idle");
    },
    [activeId, status]
  );

  const selectConversation = useCallback((id: string) => {
    setActiveId(id);
    setSidebarOpen(false);
  }, []);

  const deleteConversation = useCallback((id: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== id));
    setActiveId((prev) => (prev === id ? null : prev));
  }, []);

  return {
    conversations,
    activeConversation,
    activeId,
    status,
    sidebarOpen,
    setSidebarOpen,
    newConversation,
    sendMessage,
    selectConversation,
    deleteConversation,
  };
};
