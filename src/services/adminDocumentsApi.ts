import { fetchWithAuth } from "@/auth/authService";
import type {
  AdminDocumentDetail,
  AdminDocumentFilters,
  AdminDocumentMetrics,
  AdminDocumentPage,
} from "@/types/adminDocuments";

const BASE_URL = import.meta.env.VITE_DOCUMENT_API_URL ?? "http://localhost:8083";

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
    const payload = await res.json().catch(() => null) as { detail?: string; message?: string } | null;
    throw new Error(payload?.detail ?? payload?.message ?? `Request failed (${res.status})`);
  }

  const data = await res.json() as Record<string, unknown>;
  return camelize(data) as T;
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

function camelize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(camelize);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, nested]) => [
        key.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase()),
        camelize(nested),
      ]),
    );
  }
  return value;
}

export async function fetchAdminDocuments(
  filters: AdminDocumentFilters,
  onRefresh: () => Promise<string | null>,
): Promise<AdminDocumentPage> {
  return requestJson<AdminDocumentPage>(`/documents/admin${buildQuery(filters)}`, onRefresh);
}

export async function fetchAdminDocumentMetrics(
  filters: Omit<AdminDocumentFilters, "page" | "size">,
  onRefresh: () => Promise<string | null>,
): Promise<AdminDocumentMetrics> {
  return requestJson<AdminDocumentMetrics>(`/documents/admin/metrics${buildQuery(filters)}`, onRefresh);
}

export async function fetchAdminDocumentDetail(
  documentId: number,
  onRefresh: () => Promise<string | null>,
): Promise<AdminDocumentDetail> {
  return requestJson<AdminDocumentDetail>(`/documents/admin/${documentId}`, onRefresh);
}
