export type MessageRole = "user" | "assistant";

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  isError?: boolean;
  isRestored?: boolean;
  sources?: string[];
  attachedFileName?: string;
}

export interface Conversation {
  id: string;
  backendId?: number;
  title: string;
  messages: Message[];
  messagesLoaded: boolean;
  messageCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConversationSummary {
  id: number;
  title: string;
  createdAt: string;
  messageCount: number;
}

export interface BackendMessage {
  id: number;
  role: MessageRole;
  content: string;
  createdAt: string;
}

export type ChatStatus = "idle" | "loading" | "error";
