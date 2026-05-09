import type { ConversationSummary, BackendMessage } from "@/types/chat";

const BASE_URL = import.meta.env.VITE_CHAT_API_URL ?? "http://localhost:8080";

interface ChatApiRequest {
  message: string;
  conversationId?: number;
}

interface ChatApiResponse {
  response: string;
  conversationId: number;
}

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

export async function sendChatMessage(
  message: string,
  token: string,
  conversationId?: number
): Promise<ChatApiResponse> {
  const body: ChatApiRequest = { message };
  if (conversationId !== undefined) body.conversationId = conversationId;

  const res = await chatFetch("/chat", token, {
    method: "POST",
    body: JSON.stringify(body),
  });

  return res.json() as Promise<ChatApiResponse>;
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
