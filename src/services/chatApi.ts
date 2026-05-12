import type { ConversationSummary, BackendMessage } from "@/types/chat";

const BASE_URL = import.meta.env.VITE_CHAT_API_URL ?? "http://localhost:8080";

interface ChatApiRequest {
  message: string;
  conversationId?: number;
}

type SseEvent =
  | { type: "meta"; conversationId: number }
  | { type: "chunk"; text: string }
  | { type: "done" }
  | { type: "error" };

async function chatFetch(path: string, token: string, options: RequestInit = {}): Promise<Response> {
  const headers = new Headers(options.headers);
  headers.set("Authorization", `Bearer ${token}`);
  headers.set("Content-Type", "application/json");

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (!res.ok) {
    throw new Error(`${res.status}`);
  }

  return res;
}

export async function streamChatMessage(
  message: string,
  token: string,
  conversationId: number | undefined,
  onEvent: (event: SseEvent) => void | Promise<void>,
  signal?: AbortSignal
): Promise<void> {
  const body: ChatApiRequest = { message };
  if (conversationId !== undefined) body.conversationId = conversationId;

  const res = await chatFetch("/chat/stream", token, {
    method: "POST",
    body: JSON.stringify(body),
    signal,
  });

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop()!;

      for (const line of lines) {
        if (!line.startsWith("data:")) continue;
        const data = line.slice(5).trim();
        if (!data) continue;
        try {
          await onEvent(JSON.parse(data) as SseEvent);
        } catch {
          // skip malformed line
        }
      }
    }

    if (buffer.trim().startsWith("data:")) {
      const data = buffer.trim().slice(5).trim();
      if (data) {
        try {
          await onEvent(JSON.parse(data) as SseEvent);
        } catch {}
      }
    }
  } finally {
    reader.releaseLock();
  }
}

export async function fetchMyConversations(token: string): Promise<ConversationSummary[]> {
  const res = await chatFetch("/api/conversations", token);
  return res.json() as Promise<ConversationSummary[]>;
}

export async function fetchConversationMessages(id: number, token: string): Promise<BackendMessage[]> {
  const res = await chatFetch(`/api/conversations/${id}/messages`, token);
  return res.json() as Promise<BackendMessage[]>;
}

export async function deleteConversationApi(id: number, token: string): Promise<void> {
  await chatFetch(`/api/conversations/${id}`, token, { method: "DELETE" });
}

export async function checkHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${BASE_URL}/health`);
    return res.ok;
  } catch {
    return false;
  }
}
