import { Link } from "react-router-dom"
import { ArrowLeft, Download, FileText } from "lucide-react"
import { ADMIN_ROUTES } from "@/constants/routes"
import { useReportExportActions } from "@/hooks/useReportExportActions"
import PageLoader from "@/components/feedback/PageLoader"
import ErrorState from "@/components/ui/ErrorState"
import Button from "@/components/ui/Button"
import FormField from "@/components/forms/FormField"
import Input from "@/components/ui/Input"

export function ReportPageShell({
  title,
  description,
  reportType,
  dateParams = {},
  showDateRange = true,
  fromDate,
  toDate,
  onFromDateChange,
  onToDateChange,
  isLoading,
  error,
  onRetry,
  children
}) {
  const { onExportCsv, onExportPdf, isExportingCsv, isExportingPdf } = useReportExportActions(reportType, dateParams)
  if (isLoading) return <PageLoader />
  if (error) return <ErrorState error={error?.data || error} onRetry={onRetry} />
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <Link to={ADMIN_ROUTES.REPORTS} className="inline-flex items-center gap-1.5 text-sm text-teal-700 hover:text-teal-800">
            <ArrowLeft className="h-4 w-4" />
            Reports hub
          </Link>
          <div>
            <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
            {description && <p className="mt-1 text-sm text-slate-600">{description}</p>}
          </div>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          {showDateRange && (
            <>
              <FormField label="From" htmlFor="report-from">
                <Input id="report-from" type="date" value={fromDate} onChange={(e) => onFromDateChange(e.target.value)} className="w-[160px]" />
              </FormField>
              <FormField label="To" htmlFor="report-to">
                <Input id="report-to" type="date" value={toDate} onChange={(e) => onToDateChange(e.target.value)} className="w-[160px]" />
              </FormField>
            </>
          )}
          {reportType && (
            <>
              <Button variant="secondary" onClick={onExportCsv} disabled={isExportingCsv || isExportingPdf}>
                <Download className="mr-2 h-4 w-4" />
                {isExportingCsv ? "Exporting..." : "Export CSV"}
              </Button>
              <Button variant="secondary" onClick={onExportPdf} disabled={isExportingCsv || isExportingPdf}>
                <FileText className="mr-2 h-4 w-4" />
                {isExportingPdf ? "Generating..." : "Export PDF"}
              </Button>
            </>
          )}
        </div>
      </div>
      {children}
    </div>
  )
}

export default ReportPageShell
