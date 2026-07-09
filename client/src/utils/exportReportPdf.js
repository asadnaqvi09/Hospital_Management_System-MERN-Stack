import { apiFetch, apiPost } from "@/api/client"

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function exportReportPdf(reportType, params = {}, { onStatus } = {}) {
  const body = {}
  if (params.fromDate) body.fromDate = params.fromDate
  if (params.toDate) body.toDate = params.toDate
  const res = await apiPost(`/reports/${reportType}/export/pdf`, body)
  const exportId = res?.data?.export?.id
  if (!exportId) throw { error: "Failed to queue PDF export" }
  const maxAttempts = 30
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    await sleep(2000)
    const statusRes = await apiFetch(`/reports/exports/${exportId}`)
    const record = statusRes?.data?.export
    onStatus?.(record?.status)
    if (record?.status === "completed" && record?.file_url) {
      window.open(record.file_url, "_blank", "noopener,noreferrer")
      return record
    }
    if (record?.status === "failed") {
      throw { error: "PDF export failed on the server" }
    }
  }
  throw {
    error: "PDF export is still processing. Enable the Redis PDF worker or use CSV export."
  }
}
