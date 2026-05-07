export type MessageRole = "user" | "assistant";

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  isError?: boolean;
}

export interface Conversation {
  id: string;
  backendId?: number;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

export type ChatStatus = "idle" | "loading" | "error";
