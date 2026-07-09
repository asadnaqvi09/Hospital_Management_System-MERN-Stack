import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { useGetInvoicesQuery } from "@/api/billing.api"
import { usePagination } from "@/hooks/usePagination"
import { INVOICE_STATUS } from "@/constants/statuses"
import { RECEPTIONIST_ROUTES } from "@/constants/routes"
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
  { value: INVOICE_STATUS.DRAFT, label: "Draft" },
  { value: INVOICE_STATUS.FINALIZED, label: "Finalized" },
  { value: INVOICE_STATUS.PARTIALLY_PAID, label: "Partially paid" },
  { value: INVOICE_STATUS.FULLY_PAID, label: "Fully paid" },
  { value: INVOICE_STATUS.CANCELLED, label: "Cancelled" }
]

export default function InvoiceListPage() {
  const { page, limit, setPage } = usePagination({ page: 1, limit: 20 })
  const [status, setStatus] = useState("")
  const { data, isLoading, error, refetch } = useGetInvoicesQuery({
    page,
    limit,
    status: status || undefined
  })
  const invoices = data?.data?.invoices || []
  const pagination = data?.pagination
  const columns = useMemo(
    () => [
      {
        header: "Patient",
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-slate-900">{row.original.patient_name || "-"}</p>
            <p className="text-xs text-slate-600">MRN {row.original.patient_mrn || "-"}</p>
          </div>
        )
      },
      {
        header: "Created",
        cell: ({ row }) => <span className="text-sm text-slate-800">{formatDate(row.original.created_at)}</span>
      },
      {
        header: "Total",
        cell: ({ row }) => <span className="text-sm font-medium text-slate-900">{formatCurrency(row.original.total)}</span>
      },
      {
        header: "Paid",
        cell: ({ row }) => <span className="text-sm text-slate-800">{formatCurrency(row.original.paid_amount)}</span>
      },
      {
        header: "Status",
        cell: ({ row }) => <StatusBadge status={row.original.status} />
      },
      {
        header: "",
        cell: ({ row }) => (
          <div className="flex justify-end">
            <Button variant="secondary" size="sm" as={Link} to={`${RECEPTIONIST_ROUTES.BILLING}/${row.original.id}`}>
              View
            </Button>
          </div>
        )
      }
    ],
    []
  )

  if (isLoading) return <PageLoader />
  if (error) return <ErrorState error={error?.data || error} onRetry={refetch} />

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Billing</h1>
          <p className="text-sm text-slate-600">Invoices and payment records.</p>
        </div>
        <Button as={Link} to={RECEPTIONIST_ROUTES.BILLING_NEW}>
          Generate invoice
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
      <DataTable
        columns={columns}
        data={invoices}
        emptyTitle="No invoices"
        emptyDescription="No invoices match the current filter."
      />
      <Pagination page={pagination?.page || page} totalPages={pagination?.totalPages} onPageChange={setPage} />
    </div>
  )
}
