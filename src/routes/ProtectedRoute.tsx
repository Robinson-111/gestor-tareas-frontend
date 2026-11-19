import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth'
import type { GlobalRole } from '@/types'

interface ProtectedRouteProps {
  roles?: GlobalRole[]
}

export function ProtectedRoute({ roles }: ProtectedRouteProps) {
  const access = useAuthStore((state) => state.access)
  const user = useAuthStore((state) => state.user)
  const location = useLocation()

  if (!access || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (roles && !roles.includes(user.rol)) {
    return <Navigate to="/modules" replace />
  }

  return <Outlet />
}
