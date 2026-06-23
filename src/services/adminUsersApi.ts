import { fetchWithAuth } from "@/auth/authService";
import type { AdminUserFilters, AdminUserPage } from "@/types/adminUsers";

const BASE_URL = import.meta.env.VITE_AUTH_API_URL ?? "http://localhost:8081";

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

export async function fetchAdminUsers(
  filters: AdminUserFilters,
  onRefresh: () => Promise<string | null>,
): Promise<AdminUserPage> {
  return requestJson<AdminUserPage>(`/admin/users${buildQuery(filters)}`, onRefresh);
}
