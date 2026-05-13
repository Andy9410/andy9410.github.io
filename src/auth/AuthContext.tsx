import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  getMe,
  login as apiLogin,
  logout as apiLogout,
  refreshTokens,
  register as apiRegister,
  tokenStorage,
} from './authService'
import type { AuthState, LoginData, RegisterData, User } from './authTypes'

interface AuthContextValue extends AuthState {
  login: (data: LoginData) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => Promise<void>
  refreshAccessToken: () => Promise<string | null>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(tokenStorage.getAccess)
  const [refreshToken, setRefreshToken] = useState<string | null>(tokenStorage.getRefresh)
  const [isLoading, setIsLoading] = useState(true)

  const applyTokens = useCallback((token: string, rToken: string, u: User) => {
    setAccessToken(token)
    setRefreshToken(rToken)
    setUser(u)
  }, [])

  const clearSession = useCallback(() => {
    tokenStorage.clear()
    setAccessToken(null)
    setRefreshToken(null)
    setUser(null)
  }, [])

  // Re-hydrate session on mount
  useEffect(() => {
    const token = tokenStorage.getAccess()
    if (!token) {
      setIsLoading(false)
      return
    }

    const hydrate = async () => {
      try {
        if (tokenStorage.isExpired()) {
          const rt = tokenStorage.getRefresh()
          if (!rt) throw new Error('No refresh token')
          const resp = await refreshTokens(rt)
          tokenStorage.save(resp)
          applyTokens(resp.accessToken, resp.refreshToken, resp.user)
        } else {
          const me = await getMe(token)
          setUser(me)
          setAccessToken(token)
        }
      } catch {
        clearSession()
      } finally {
        setIsLoading(false)
      }
    }

    hydrate()
  }, [applyTokens, clearSession])

  const login = useCallback(
    async (data: LoginData) => {
      const resp = await apiLogin(data)
      tokenStorage.save(resp)
      applyTokens(resp.accessToken, resp.refreshToken, resp.user)
    },
    [applyTokens],
  )

  const register = useCallback(
    async (data: RegisterData) => {
      const resp = await apiRegister(data)
      tokenStorage.save(resp)
      applyTokens(resp.accessToken, resp.refreshToken, resp.user)
    },
    [applyTokens],
  )

  const logout = useCallback(async () => {
    await apiLogout(accessToken, tokenStorage.getRefresh())
    clearSession()
  }, [accessToken, clearSession])

  const refreshAccessToken = useCallback(async (): Promise<string | null> => {
    const rt = tokenStorage.getRefresh()
    if (!rt) {
      clearSession()
      return null
    }
    try {
      const resp = await refreshTokens(rt)
      tokenStorage.save(resp)
      applyTokens(resp.accessToken, resp.refreshToken, resp.user)
      return resp.accessToken
    } catch {
      clearSession()
      return null
    }
  }, [applyTokens, clearSession])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      accessToken,
      refreshToken,
      isAuthenticated: !!user && !!accessToken,
      isLoading,
      login,
      register,
      logout,
      refreshAccessToken,
    }),
    [user, accessToken, refreshToken, isLoading, login, register, logout, refreshAccessToken],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuthContext must be used inside <AuthProvider>')
  return ctx
}
