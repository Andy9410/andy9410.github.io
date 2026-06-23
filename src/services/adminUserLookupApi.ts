import { fetchWithAuth } from "@/auth/authService";

const BASE_URL = import.meta.env.VITE_AUTH_API_URL ?? "http://localhost:8081";

export interface AdminUserLookup {
  email: string;
  name: string;
  role: string;
}

export async function fetchAdminUserLookup(
  emails: string[],
  onRefresh: () => Promise<string | null>,
): Promise<Record<string, AdminUserLookup>> {
  const unique = Array.from(new Set(emails.filter(Boolean)));
  if (unique.length === 0) return {};

  const query = new URLSearchParams();
  unique.forEach((email) => query.append("emails", email));

  const res = await fetchWithAuth(
    `${BASE_URL}/admin/users/lookup?${query.toString()}`,
    {
      headers: { Accept: "application/json" },
    },
    onRefresh,
  );

  if (!res.ok) {
    return {};
  }

  const payload = await res.json() as AdminUserLookup[];
  return Object.fromEntries(payload.map((entry) => [entry.email, entry]));
}
