export interface AdminUserSummary {
  id: number;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  lastLoginAt: string | null;
  active: boolean;
}

export interface AdminUserPage {
  content: AdminUserSummary[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}

export interface AdminUserFilters {
  page: number;
  size: number;
  email?: string;
  name?: string;
}
