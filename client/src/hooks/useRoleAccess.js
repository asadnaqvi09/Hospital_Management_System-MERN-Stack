import { useMemo } from "react"
import { useSelector } from "react-redux"
export function useRoleAccess(allowedRoles = []) {
  const role = useSelector((state) => state.auth.user?.role)
  return useMemo(() => {
    if (!role) return false
    if (!allowedRoles.length) return true
    return allowedRoles.includes(role)
  }, [role, allowedRoles])
}
export function useCurrentRole() {
  return useSelector((state) => state.auth.user?.role)
}
