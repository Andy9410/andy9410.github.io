export interface AdminDocumentSummary {
  id: number;
  filename: string;
  fileType: string;
  uploadDate: string;
  pageCount: number | null;
  chunkCount: number;
  ownerEmail: string;
  queryCount: number;
  uniqueUsers: number;
  lastUsedAt: string | null;
}

export interface AdminDocumentPage {
  content: AdminDocumentSummary[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}

export interface AdminDocumentMetrics {
  totalDocuments: number;
  documentsUsedToday: number;
  uniqueUsersToday: number;
  uploadsToday: number;
}

export interface AdminDocumentFilters {
  page: number;
  size: number;
  email?: string;
  filename?: string;
}

export interface AdminDocumentDetail extends AdminDocumentSummary {
  downloadAvailable: boolean;
}
