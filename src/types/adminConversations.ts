export interface AdminConversationSummary {
  conversationId: number;
  title: string;
  userEmail: string;
  userName: string;
  messageCount: number;
  createdAt: string;
  lastActivity: string;
  lastMessage: string;
  active: boolean;
}

export interface AdminConversationPage {
  content: AdminConversationSummary[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}

export interface AdminConversationMetrics {
  totalConversations: number;
  activeToday: number;
  uniqueUsersToday: number;
  messagesToday: number;
}

export interface AdminConversationFilters {
  page: number;
  size: number;
  email?: string;
  name?: string;
  title?: string;
  from?: string;
  to?: string;
}

export interface AdminConversationUser {
  id: number | null;
  name: string;
  email: string;
}

export interface AdminConversationMessage {
  role: "USER" | "ASSISTANT" | string;
  content: string;
  createdAt: string;
}

export interface AdminConversationDetail {
  id: number;
  title: string;
  user: AdminConversationUser;
  createdAt: string;
  lastActivity: string;
  messageCount: number;
  messages: AdminConversationMessage[];
}
