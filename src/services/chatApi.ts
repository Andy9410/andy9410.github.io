const BASE_URL = import.meta.env.VITE_CHAT_API_URL ?? "http://localhost:8080";

interface ChatApiRequest {
  message: string;
  conversationId?: number;
}

interface ChatApiResponse {
  response: string;
  conversationId: number;
}

export async function sendChatMessage(
  message: string,
  conversationId?: number
): Promise<ChatApiResponse> {
  const body: ChatApiRequest = { message };
  if (conversationId !== undefined) body.conversationId = conversationId;

  const res = await fetch(`${BASE_URL}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`Chat API error: ${res.status}`);
  }

  return res.json() as Promise<ChatApiResponse>;
}
