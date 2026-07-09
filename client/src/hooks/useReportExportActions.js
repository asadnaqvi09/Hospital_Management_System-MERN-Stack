import { useState, useCallback } from "react"
import { toast } from "sonner"
import { downloadReportCsv } from "@/utils/downloadReportCsv"
import { exportReportPdf } from "@/utils/exportReportPdf"
import { parseApiError } from "@/utils/parseApiError"

export function useReportExportActions(reportType, params = {}) {
  const [isExportingCsv, setIsExportingCsv] = useState(false)
  const [isExportingPdf, setIsExportingPdf] = useState(false)
  const onExportCsv = useCallback(async () => {
    setIsExportingCsv(true)
    try {
      await downloadReportCsv(reportType, params)
      toast.success("CSV downloaded")
    } catch (err) {
      toast.error(parseApiError(err))
    } finally {
      setIsExportingCsv(false)
    }
  }, [reportType, params])
  const onExportPdf = useCallback(async () => {
    setIsExportingPdf(true)
    try {
      await exportReportPdf(reportType, params)
      toast.success("PDF ready")
    } catch (err) {
      toast.error(parseApiError(err))
    } finally {
      setIsExportingPdf(false)
    }
  }, [reportType, params])
  return { onExportCsv, onExportPdf, isExportingCsv, isExportingPdf }
}
