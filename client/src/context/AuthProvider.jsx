import { useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"
import { useLazyMeQuery } from "@/api/auth.api"
import { setUser, logout } from "@/store/authSlice"
export function AuthProvider({ children }) {
  const dispatch = useDispatch()
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated)
  const [fetchMe] = useLazyMeQuery()
  useEffect(() => {
    if (!isAuthenticated) return
    fetchMe()
      .unwrap()
      .then((result) => {
        const payload = result.data || result
        dispatch(setUser(payload.user || payload))
      })
      .catch(() => {
        dispatch(logout())
      })
  }, [isAuthenticated, dispatch, fetchMe])
  return children
}
