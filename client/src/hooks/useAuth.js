import { useCallback } from "react"
import { useDispatch, useSelector } from "react-redux"
import { useNavigate } from "react-router-dom"
import { setCredentials, setUser, logout as logoutAction } from "@/store/authSlice"
import { useLoginMutation, useLogoutMutation, useLazyMeQuery } from "@/api/auth.api"
import { ROLE_DEFAULT_ROUTES } from "@/constants/routes"
import { getRefreshToken } from "@/utils/tokenStorage"
export function useAuth() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { user, isAuthenticated, accessToken } = useSelector((state) => state.auth)
  const [loginMutation, { isLoading: isLoggingIn }] = useLoginMutation()
  const [logoutMutation] = useLogoutMutation()
  const [fetchMe] = useLazyMeQuery()
  const login = useCallback(async (credentials) => {
    const result = await loginMutation(credentials).unwrap()
    const payload = result.data || result
    if (payload.requiresTwoFactor) return { requiresTwoFactor: true, twoFactorToken: payload.twoFactorToken }
    const tokens = payload.tokens || payload
    dispatch(setCredentials({
      user: payload.user,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken
    }))
    const role = payload.user?.role
    navigate(ROLE_DEFAULT_ROUTES[role] || "/")
    return payload
  }, [dispatch, loginMutation, navigate])
  const logout = useCallback(async () => {
    try {
      const refreshToken = getRefreshToken()
      if (refreshToken) await logoutMutation({ refreshToken }).unwrap()
    } catch {
    } finally {
      dispatch(logoutAction())
      navigate("/login")
    }
  }, [dispatch, logoutMutation, navigate])
  const loadMe = useCallback(async () => {
    const result = await fetchMe().unwrap()
    const payload = result.data || result
    dispatch(setUser(payload.user || payload))
    return payload
  }, [dispatch, fetchMe])
  return {
    user,
    isAuthenticated,
    accessToken,
    login,
    logout,
    loadMe,
    isLoggingIn
  }
}
