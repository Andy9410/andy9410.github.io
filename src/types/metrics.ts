export type AnalyticsMetricType =
  | "REQUESTS"
  | "ERRORS"
  | "LOGINS"
  | "CHAT_MESSAGES"
  | "DOCUMENTS_UPLOADED"
  | "ACTIVE_USERS"
  | "NEW_USERS"
  | "SLOW_REQUESTS";

export type AnalyticsFeature = "ALL" | "AUTH" | "CHAT" | "DOCUMENTS" | "TUTORIA" | "OTHER";

export interface AnalyticsOverview {
  registeredUsers: number;
  activeUsers: number;
  requests: number;
  errors: number;
  logins: number;
  chatMessages: number;
  documentsUploaded: number;
  slowRequests: number;
}

export interface AnalyticsSeriesPoint {
  day: string;
  value: number;
}

export interface EndpointStats {
  serviceName: string;
  method: string;
  endpoint: string;
  value: number;
}

export interface TopUserStats {
  email: string;
  name: string;
  value: number;
}

export interface MetricsDashboardData {
  overview: AnalyticsOverview;
  requestSeries: AnalyticsSeriesPoint[];
  errorSeries: AnalyticsSeriesPoint[];
  slowRequestSeries: AnalyticsSeriesPoint[];
  chatSeries: AnalyticsSeriesPoint[];
  documentSeries: AnalyticsSeriesPoint[];
  activeUsersSeries: AnalyticsSeriesPoint[];
  newUsersSeries: AnalyticsSeriesPoint[];
  endpoints: EndpointStats[];
  topUsers: TopUserStats[];
}

export interface MetricsFilters {
  from: string;
  to: string;
  feature: AnalyticsFeature;
}
