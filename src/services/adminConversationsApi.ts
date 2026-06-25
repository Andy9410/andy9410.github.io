import { fetchWithAuth } from "@/auth/authService";
import type {
  AdminConversationDetail,
  AdminConversationFilters,
  AdminConversationMetrics,
  AdminConversationPage,
} from "@/types/adminConversations";

const BASE_URL = import.meta.env.VITE_CHAT_API_URL ?? "http://localhost:8080";

async function requestJson<T>(path: string, onRefresh: () => Promise<string | null>): Promise<T> {
  const res = await fetchWithAuth(
    `${BASE_URL}${path}`,
    {
      headers: {
        Accept: "application/json",
      },
    },
    onRefresh,
  );

  if (!res.ok) {
    const payload = await res.json().catch(() => null) as { message?: string } | null;
    throw new Error(payload?.message ?? `Request failed (${res.status})`);
  }

  return res.json() as Promise<T>;
}

function buildQuery(params: Record<string, string | number | undefined>) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      query.set(key, String(value));
    }
  });
  const qs = query.toString();
  return qs ? `?${qs}` : "";
}

export async function fetchAdminConversations(
  filters: AdminConversationFilters,
  onRefresh: () => Promise<string | null>,
): Promise<AdminConversationPage> {
  const query = buildQuery(filters);
  return requestJson<AdminConversationPage>(`/api/admin/conversations${query}`, onRefresh);
}

export async function fetchAdminConversationMetrics(
  filters: Omit<AdminConversationFilters, "page" | "size">,
  onRefresh: () => Promise<string | null>,
): Promise<AdminConversationMetrics> {
  const query = buildQuery(filters);
  return requestJson<AdminConversationMetrics>(`/api/admin/conversations/metrics${query}`, onRefresh);
}

export async function fetchAdminConversationDetail(
  conversationId: number,
  onRefresh: () => Promise<string | null>,
): Promise<AdminConversationDetail> {
  return requestJson<AdminConversationDetail>(`/api/admin/conversations/${conversationId}`, onRefresh);
}
