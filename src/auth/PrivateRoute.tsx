import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useCallback } from 'react'
import { useAuth } from './useAuth'
import { useInactivityTimeout } from '@/hooks/useInactivityTimeout'

export default function PrivateRoute() {
  const { isAuthenticated, isLoading, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const handleInactivity = useCallback(async () => {
    await logout()
    navigate('/login', { replace: true, state: { sessionExpired: true } })
  }, [logout, navigate])

  useInactivityTimeout(handleInactivity)

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#212121]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white border-t-transparent" />
      </div>
    )
  }

  return isAuthenticated ? (
    <Outlet />
  ) : (
    <Navigate to="/login" state={{ from: location }} replace />
  )
}
