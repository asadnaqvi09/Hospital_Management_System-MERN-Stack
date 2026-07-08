import { createApi } from "@reduxjs/toolkit/query/react"
import { apiFetch } from "@/api/client"
import { QUERY_TAGS } from "@/constants/queryKeys"
const tagTypes = Object.values(QUERY_TAGS)

function toSearchParams(params) {
  if (!params) return ""
  const usp = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return
    usp.set(key, String(value))
  })
  const qs = usp.toString()
  return qs ? `?${qs}` : ""
}

async function baseQuery(arg) {
  try {
    if (typeof arg === "string") {
      const data = await apiFetch(arg, { method: "GET" })
      return { data }
    }
    const { url, method = "GET", body, params, headers } = arg || {}
    const endpoint = `${url}${toSearchParams(params)}`
    const data = await apiFetch(endpoint, {
      method,
      headers,
      body: body instanceof FormData ? body : body !== undefined ? JSON.stringify(body) : undefined
    })
    return { data }
  } catch (error) {
    const status = typeof error?.status === "number" ? error.status : 500
    return { error: { status, data: error } }
  }
}

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery,
  tagTypes,
  endpoints: () => ({})
})
