import type { WhiteboardLesson } from "@/types/lesson";

const BASE_URL = import.meta.env.VITE_CHAT_API_URL ?? "http://localhost:8080";

export async function generateLesson(
  conversationId: number,
  userMessage: string,
  assistantMessage: string,
  token: string,
): Promise<WhiteboardLesson> {
  const res = await fetch(`${BASE_URL}/tools/whiteboard/lesson`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ conversationId, userMessage, assistantMessage }),
  });

  if (!res.ok) throw new Error(`${res.status}`);
  return (await res.json()) as WhiteboardLesson;
}
