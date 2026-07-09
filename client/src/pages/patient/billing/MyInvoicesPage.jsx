import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { ExternalLink } from "lucide-react"
import { useGetInvoicesQuery } from "@/api/billing.api"
import { usePatientScope } from "@/hooks/usePatientScope"
import { usePagination } from "@/hooks/usePagination"
import { INVOICE_STATUS } from "@/constants/statuses"
import { PATIENT_ROUTES } from "@/constants/routes"
import DataTable from "@/components/data-display/DataTable"
import PageLoader from "@/components/feedback/PageLoader"
import ErrorState from "@/components/ui/ErrorState"
import Button from "@/components/ui/Button"
import Card from "@/components/ui/Card"
import Select from "@/components/ui/Select"
import Pagination from "@/components/ui/Pagination"
import StatusBadge from "@/components/data-display/StatusBadge"
import { formatCurrency } from "@/utils/formatCurrency"

function formatDate(value) {
  return String(value || "").replace("T", " ").slice(0, 16) || "-"
}

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: INVOICE_STATUS.FINALIZED, label: "Finalized" },
  { value: INVOICE_STATUS.PARTIALLY_PAID, label: "Partially paid" },
  { value: INVOICE_STATUS.FULLY_PAID, label: "Fully paid" },
  { value: INVOICE_STATUS.CANCELLED, label: "Cancelled" }
]

export default function MyInvoicesPage() {
  const { patientId, isLoading: profileLoading, error: profileError, refetch: refetchProfile } = usePatientScope()
  const { page, limit, setPage } = usePagination({ page: 1, limit: 20 })
  const [status, setStatus] = useState("")
  const { data, isLoading, error, refetch } = useGetInvoicesQuery(
    { page, limit, status: status || undefined },
    { skip: !patientId }
  )
  const invoices = data?.data?.invoices || []
  const pagination = data?.pagination
  const columns = useMemo(
    () => [
      { header: "Created", cell: ({ row }) => <span className="text-sm text-slate-800">{formatDate(row.original.created_at)}</span> },
      { header: "Total", cell: ({ row }) => <span className="font-medium text-slate-900">{formatCurrency(row.original.total)}</span> },
      { header: "Paid", cell: ({ row }) => <span className="text-sm text-slate-800">{formatCurrency(row.original.paid_amount)}</span> },
      { header: "Status", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
      {
        header: "",
        cell: ({ row }) => {
          const outstanding = Number(row.original.total || 0) - Number(row.original.paid_amount || 0)
          return (
            <div className="flex justify-end gap-2">
              {row.original.pdf_url && (
                <Button variant="ghost" size="sm" as="a" href={row.original.pdf_url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                </Button>
              )}
              <span className="self-center text-xs text-slate-600">Due {formatCurrency(outstanding)}</span>
            </div>
          )
        }
      }
    ],
    []
  )
  if (profileLoading) return <PageLoader />
  if (profileError) return <ErrorState error={profileError?.data || profileError} onRetry={refetchProfile} />
  if (!patientId) {
    return <ErrorState title="Patient profile not found" description="Your account is not linked to a patient profile." />
  }
  if (isLoading) return <PageLoader />
  if (error) return <ErrorState error={error?.data || error} onRetry={refetch} />
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">My bills</h1>
          <p className="text-sm text-slate-600">View invoices and download PDFs when available.</p>
        </div>
        <Button variant="secondary" as={Link} to={PATIENT_ROUTES.DASHBOARD}>
          Back
        </Button>
      </div>
      <Card className="p-4">
        <div className="grid gap-3 md:grid-cols-3">
          <div>
            <p className="mb-1 text-sm font-medium text-slate-700">Status</p>
            <Select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value)
                setPage(1)
              }}
              options={STATUS_OPTIONS}
            />
          </div>
        </div>
      </Card>
      <DataTable columns={columns} data={invoices} emptyTitle="No invoices" emptyDescription="You have no bills on record." />
      <Pagination page={pagination?.page || page} totalPages={pagination?.totalPages} onPageChange={setPage} />
    </div>
  )
}
