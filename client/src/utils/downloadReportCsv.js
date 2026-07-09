import { env } from "@/config/env"
import { getAccessToken } from "@/utils/tokenStorage"

export async function downloadReportCsv(reportType, params = {}) {
  const usp = new URLSearchParams()
  if (params.fromDate) usp.set("fromDate", params.fromDate)
  if (params.toDate) usp.set("toDate", params.toDate)
  const qs = usp.toString()
  const url = `${env.apiBaseUrl}/reports/${reportType}/export/csv${qs ? `?${qs}` : ""}`
  const token = getAccessToken()
  const res = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw data
  }
  const blob = await res.blob()
  const disposition = res.headers.get("content-disposition")
  const filename = disposition?.match(/filename="(.+)"/)?.[1] || `${reportType}.csv`
  const link = document.createElement("a")
  link.href = URL.createObjectURL(blob)
  link.download = filename
  link.click()
  URL.revokeObjectURL(link.href)
}
