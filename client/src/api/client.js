import { env } from "@/config/env"
import { getAccessToken, getRefreshToken, setTokens, clearTokens } from "@/utils/tokenStorage"
let refreshPromise = null
async function refreshAccessToken() {
  const refreshToken = getRefreshToken()
  if (!refreshToken) throw { status: 401, error: "Session expired" }
  const res = await fetch(`${env.apiBaseUrl}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken })
  })
  const contentType = res.headers.get("content-type")
  const data = contentType?.includes("application/json") ? await res.json() : await res.text()
  if (!res.ok) {
    clearTokens()
    throw typeof data === "object" ? data : { status: res.status, error: data }
  }
  setTokens({
    accessToken: data.data?.tokens?.accessToken || data.data?.accessToken || data.accessToken,
    refreshToken: data.data?.tokens?.refreshToken || data.data?.refreshToken || data.refreshToken
  })
  return getAccessToken()
}
export async function apiFetch(endpoint, options = {}) {
  const token = getAccessToken()
  const headers = {
    ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers
  }
  let res = await fetch(`${env.apiBaseUrl}${endpoint}`, { ...options, headers })
  if (res.status === 401 && getRefreshToken() && !options._retry) {
    if (!refreshPromise) refreshPromise = refreshAccessToken().finally(() => { refreshPromise = null })
    try {
      await refreshPromise
      return apiFetch(endpoint, { ...options, _retry: true })
    } catch (error) {
      throw error
    }
  }
  const contentType = res.headers.get("content-type")
  const data = contentType?.includes("application/json") ? await res.json() : await res.text()
  if (!res.ok) throw { status: res.status, ...(typeof data === "object" ? data : { error: data }) }
  return data
}
export function apiGet(endpoint, options) {
  return apiFetch(endpoint, { ...options, method: "GET" })
}
export function apiPost(endpoint, body, options) {
  return apiFetch(endpoint, {
    ...options,
    method: "POST",
    body: body instanceof FormData ? body : JSON.stringify(body)
  })
}
export function apiPut(endpoint, body, options) {
  return apiFetch(endpoint, {
    ...options,
    method: "PUT",
    body: body instanceof FormData ? body : JSON.stringify(body)
  })
}
export function apiPatch(endpoint, body, options) {
  return apiFetch(endpoint, {
    ...options,
    method: "PATCH",
    body: body instanceof FormData ? body : JSON.stringify(body)
  })
}
export function apiDelete(endpoint, options) {
  return apiFetch(endpoint, { ...options, method: "DELETE" })
}
