import { fetchWithAuth } from "@/auth/authService";
import type { LearningProfile } from "@/types/learningProfile";

const BASE_URL = import.meta.env.VITE_CHAT_API_URL ?? "http://localhost:8080";

export async function fetchLearningProfile(
  onRefresh: () => Promise<string | null>,
): Promise<LearningProfile> {
  const res = await fetchWithAuth(
    `${BASE_URL}/api/learning/profile`,
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

  return res.json() as Promise<LearningProfile>;
}

export async function fetchAdminLearningProfile(
  email: string,
  onRefresh: () => Promise<string | null>,
): Promise<LearningProfile> {
  const query = new URLSearchParams({ email });
  const res = await fetchWithAuth(
    `${BASE_URL}/api/admin/learning/profile?${query.toString()}`,
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

  return res.json() as Promise<LearningProfile>;
}
