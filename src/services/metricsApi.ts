import { fetchWithAuth } from "@/auth/authService";
import type {
  AnalyticsFeature,
  AnalyticsMetricType,
  AnalyticsOverview,
  AnalyticsSeriesPoint,
  EndpointStats,
  MetricsDashboardData,
  TopUserStats,
} from "@/types/metrics";

const BASE_URL = import.meta.env.VITE_AUTH_API_URL ?? "http://localhost:8081";

async function requestJson<T>(
  path: string,
  onRefresh: () => Promise<string | null>,
): Promise<T> {
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

export async function fetchOverview(
  filters: { from: string; to: string; feature: AnalyticsFeature },
  onRefresh: () => Promise<string | null>,
): Promise<AnalyticsOverview> {
  const query = buildQuery(filters);
  return requestJson<AnalyticsOverview>(`/admin/metrics/overview${query}`, onRefresh);
}

export async function fetchSeries(
  metric: AnalyticsMetricType,
  filters: { from: string; to: string; feature: AnalyticsFeature },
  onRefresh: () => Promise<string | null>,
): Promise<AnalyticsSeriesPoint[]> {
  const query = buildQuery({ metric, ...filters });
  return requestJson<AnalyticsSeriesPoint[]>(`/admin/metrics/timeseries${query}`, onRefresh);
}

export async function fetchEndpoints(
  filters: { from: string; to: string; feature: AnalyticsFeature },
  onRefresh: () => Promise<string | null>,
): Promise<EndpointStats[]> {
  const query = buildQuery({ ...filters, limit: 8 });
  return requestJson<EndpointStats[]>(`/admin/metrics/endpoints${query}`, onRefresh);
}

export async function fetchTopUsers(
  filters: { from: string; to: string; feature: AnalyticsFeature },
  onRefresh: () => Promise<string | null>,
): Promise<TopUserStats[]> {
  const query = buildQuery({ ...filters, limit: 8 });
  return requestJson<TopUserStats[]>(`/admin/metrics/users/top${query}`, onRefresh);
}

export async function fetchDashboardData(
  filters: { from: string; to: string; feature: AnalyticsFeature },
  onRefresh: () => Promise<string | null>,
): Promise<MetricsDashboardData> {
  const [
    overview,
    requestSeries,
    errorSeries,
    slowRequestSeries,
    chatSeries,
    documentSeries,
    activeUsersSeries,
    newUsersSeries,
    endpoints,
    topUsers,
  ] = await Promise.allSettled([
    fetchOverview(filters, onRefresh),
    fetchSeries("REQUESTS", filters, onRefresh),
    fetchSeries("ERRORS", filters, onRefresh),
    fetchSeries("SLOW_REQUESTS", filters, onRefresh),
    fetchSeries("CHAT_MESSAGES", filters, onRefresh),
    fetchSeries("DOCUMENTS_UPLOADED", filters, onRefresh),
    fetchSeries("ACTIVE_USERS", filters, onRefresh),
    fetchSeries("NEW_USERS", filters, onRefresh),
    fetchEndpoints(filters, onRefresh),
    fetchTopUsers(filters, onRefresh),
  ]);

  const unwrap = <T,>(result: PromiseSettledResult<T>, fallback: T): T => {
    if (result.status === "fulfilled") {
      return result.value;
    }
    console.error("Metrics dashboard request failed:", result.reason);
    return fallback;
  };

  return {
    overview: unwrap(overview, {
      registeredUsers: 0,
      activeUsers: 0,
      requests: 0,
      errors: 0,
      logins: 0,
      chatMessages: 0,
      documentsUploaded: 0,
      slowRequests: 0,
    }),
    requestSeries: unwrap(requestSeries, []),
    errorSeries: unwrap(errorSeries, []),
    slowRequestSeries: unwrap(slowRequestSeries, []),
    chatSeries: unwrap(chatSeries, []),
    documentSeries: unwrap(documentSeries, []),
    activeUsersSeries: unwrap(activeUsersSeries, []),
    newUsersSeries: unwrap(newUsersSeries, []),
    endpoints: unwrap(endpoints, []),
    topUsers: unwrap(topUsers, []),
  };
}
