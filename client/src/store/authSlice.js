import { createSlice } from "@reduxjs/toolkit"
import { getAccessToken, getRefreshToken, setTokens, clearTokens } from "@/utils/tokenStorage"
const initialState = {
  user: null,
  accessToken: getAccessToken(),
  refreshToken: getRefreshToken(),
  isAuthenticated: Boolean(getAccessToken())
}
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      const { user, accessToken, refreshToken } = action.payload
      state.user = user
      state.accessToken = accessToken
      state.refreshToken = refreshToken
      state.isAuthenticated = true
      setTokens({ accessToken, refreshToken })
    },
    setUser: (state, action) => {
      state.user = action.payload
    },
    logout: (state) => {
      state.user = null
      state.accessToken = null
      state.refreshToken = null
      state.isAuthenticated = false
      clearTokens()
    }
  }
})
export const { setCredentials, setUser, logout } = authSlice.actions
export default authSlice.reducer
