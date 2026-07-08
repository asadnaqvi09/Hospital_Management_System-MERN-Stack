import { Navigate, Outlet } from "react-router-dom"
import { useSelector } from "react-redux"
import { ROLE_DEFAULT_ROUTES } from "@/constants/routes"
export function PublicRoute() {
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated)
  const role = useSelector((state) => state.auth.user?.role)
  if (isAuthenticated && role) {
    return <Navigate to={ROLE_DEFAULT_ROUTES[role] || "/"} replace />
  }
  return <Outlet />
}
export default PublicRoute
