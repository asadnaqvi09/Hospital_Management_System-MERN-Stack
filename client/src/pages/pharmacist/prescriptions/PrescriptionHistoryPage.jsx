import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { useGetPrescriptionsQuery } from "@/api/prescriptions.api"
import { usePagination } from "@/hooks/usePagination"
import { PRESCRIPTION_STATUS } from "@/constants/statuses"
import DataTable from "@/components/data-display/DataTable"
import PageLoader from "@/components/feedback/PageLoader"
import ErrorState from "@/components/ui/ErrorState"
import Button from "@/components/ui/Button"
import Card from "@/components/ui/Card"
import Select from "@/components/ui/Select"
import Pagination from "@/components/ui/Pagination"
import StatusBadge from "@/components/data-display/StatusBadge"
function formatDate(value) {
  return String(value || "").replace("T", " ").slice(0, 16) || "-"
}
const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: PRESCRIPTION_STATUS.PENDING, label: "Pending" },
  { value: PRESCRIPTION_STATUS.PARTIALLY_DISPENSED, label: "Partially dispensed" },
  { value: PRESCRIPTION_STATUS.DISPENSED, label: "Dispensed" },
  { value: PRESCRIPTION_STATUS.CANCELLED, label: "Cancelled" }
]
export default function PrescriptionHistoryPage() {
  const { page, limit, setPage } = usePagination({ page: 1, limit: 20 })
  const [status, setStatus] = useState("")
  const { data, isLoading, error, refetch } = useGetPrescriptionsQuery({
    page,
    limit,
    status: status || undefined
  })
  const prescriptions = data?.data?.prescriptions || []
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
        header: "Doctor",
        cell: ({ row }) => <span className="text-sm text-slate-800">{row.original.doctor_name || "-"}</span>
      },
      {
        header: "Created",
        cell: ({ row }) => <span className="text-sm text-slate-800">{formatDate(row.original.created_at)}</span>
      },
      {
        header: "Status",
        cell: ({ row }) => <StatusBadge status={row.original.status} />
      },
      {
        header: "",
        cell: ({ row }) => {
          const canDispense =
            row.original.status === PRESCRIPTION_STATUS.PENDING ||
            row.original.status === PRESCRIPTION_STATUS.PARTIALLY_DISPENSED
          return (
            <div className="flex justify-end">
              {canDispense ? (
                <Button variant="secondary" size="sm" as={Link} to={`/pharmacy/prescriptions/${row.original.id}/dispense`}>
                  Dispense
                </Button>
              ) : (
                <Button variant="secondary" size="sm" as={Link} to={`/pharmacy/prescriptions/${row.original.id}/dispense`}>
                  View
                </Button>
              )}
            </div>
          )
        }
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
          <h1 className="text-lg font-semibold text-slate-900">Prescription history</h1>
          <p className="text-sm text-slate-600">All prescriptions with optional status filter.</p>
        </div>
        <Button variant="secondary" as={Link} to="/pharmacy">
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
          <div className="flex items-end justify-end md:col-span-2">
            <Button variant="secondary" onClick={refetch}>
              Refresh
            </Button>
          </div>
        </div>
      </Card>
      <DataTable
        columns={columns}
        data={prescriptions}
        emptyTitle="No prescriptions"
        emptyDescription="No prescriptions match the current filter."
      />
      <Pagination page={pagination?.page || page} totalPages={pagination?.totalPages} onPageChange={setPage} />
    </div>
  )
}
