import type { AuthResponse, LoginData, RegisterData, User } from './authTypes'

const AUTH_URL = import.meta.env.VITE_AUTH_API_URL || 'http://localhost:8081'

const TOKEN_KEY = 'auth_access_token'
const REFRESH_KEY = 'auth_refresh_token'
const EXPIRY_KEY = 'auth_token_expiry'

// ── Token storage ──────────────────────────────────────────────────────────────

export const tokenStorage = {
  save(response: AuthResponse) {
    const expiryMs = Date.now() + response.expiresIn * 1000
    localStorage.setItem(TOKEN_KEY, response.accessToken)
    localStorage.setItem(REFRESH_KEY, response.refreshToken)
    localStorage.setItem(EXPIRY_KEY, String(expiryMs))
  },
  getAccess(): string | null {
    return localStorage.getItem(TOKEN_KEY)
  },
  getRefresh(): string | null {
    return localStorage.getItem(REFRESH_KEY)
  },
  isExpired(): boolean {
    const expiry = localStorage.getItem(EXPIRY_KEY)
    if (!expiry) return true
    // Refresh 60 s before actual expiry
    return Date.now() > Number(expiry) - 60_000
  },
  clear() {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(REFRESH_KEY)
    localStorage.removeItem(EXPIRY_KEY)
  },
}

// ── HTTP helpers ───────────────────────────────────────────────────────────────

async function post<T>(path: string, body: unknown, token?: string): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${AUTH_URL}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }))
    throw new Error(err.message ?? 'Request failed')
  }

  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

async function get<T>(path: string, token: string): Promise<T> {
  const res = await fetch(`${AUTH_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }))
    throw new Error(err.message ?? 'Request failed')
  }

  return res.json() as Promise<T>
}

// ── Auth API calls ─────────────────────────────────────────────────────────────

export async function register(data: RegisterData): Promise<AuthResponse> {
  return post<AuthResponse>('/auth/register', data)
}

export async function login(data: LoginData): Promise<AuthResponse> {
  return post<AuthResponse>('/auth/login', data)
}

export async function refreshTokens(refreshToken: string): Promise<AuthResponse> {
  return post<AuthResponse>('/auth/refresh', { refreshToken })
}

export async function logout(accessToken: string | null, refreshToken: string | null): Promise<void> {
  await post<void>(
    '/auth/logout',
    refreshToken ? { refreshToken } : {},
    accessToken ?? undefined,
  ).catch(() => {})
}

export async function getMe(accessToken: string): Promise<User> {
  return get<User>('/auth/me', accessToken)
}

// ── fetchWithAuth — wraps fetch, auto-refreshes token ─────────────────────────

type RefreshFn = () => Promise<string | null>

export async function fetchWithAuth(
  url: string,
  options: RequestInit = {},
  onRefresh: RefreshFn,
): Promise<Response> {
  let token = tokenStorage.getAccess()

  if (tokenStorage.isExpired()) {
    token = await onRefresh()
  }

  const headers = new Headers(options.headers)
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const res = await fetch(url, { ...options, headers })

  if (res.status === 401) {
    token = await onRefresh()
    if (!token) return res
    headers.set('Authorization', `Bearer ${token}`)
    return fetch(url, { ...options, headers })
  }

  return res
}
