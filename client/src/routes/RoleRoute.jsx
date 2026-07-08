import { Navigate, Outlet } from "react-router-dom"
import { useSelector } from "react-redux"
import { ROUTES } from "@/constants/routes"
export function RoleRoute({ roles = [] }) {
  const user = useSelector((state) => state.auth.user)
  const role = user?.role
  if (!role || (roles.length && !roles.includes(role))) {
    return <Navigate to={ROUTES.UNAUTHORIZED} replace />
  }
  return <Outlet />
}
export default RoleRoute
