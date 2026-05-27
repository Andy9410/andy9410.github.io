export type MessageRole = "user" | "assistant";

export interface BBox {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export interface ActiveExercise {
  number: string;
  page: number;
  bbox?: BBox;
  title?: string;
}

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  isError?: boolean;
  isRestored?: boolean;
  sources?: string[];
  suggestions?: string[];
  attachedFileName?: string;
}

export interface Conversation {
  id: string;
  backendId?: number;
  title: string;
  messages: Message[];
  messagesLoaded: boolean;
  messageCount?: number;
  hasMoreMessages?: boolean;
  createdAt: Date;
  updatedAt: Date;
  preferredDocumentId?: number;
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
  suggestions?: string[];
}

export type ChatStatus = "idle" | "loading" | "error";
