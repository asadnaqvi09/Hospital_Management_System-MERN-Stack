import { Navigate, Outlet, useLocation } from "react-router-dom"
import { useSelector } from "react-redux"
import { ROUTES } from "@/constants/routes"
export function ProtectedRoute() {
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated)
  const location = useLocation()
  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />
  }
  return <Outlet />
}
export default ProtectedRoute
