import { useMemo } from "react"
import { Link } from "react-router-dom"
import { useGetPendingPrescriptionsQuery } from "@/api/prescriptions.api"
import { usePagination } from "@/hooks/usePagination"
import DataTable from "@/components/data-display/DataTable"
import PageLoader from "@/components/feedback/PageLoader"
import ErrorState from "@/components/ui/ErrorState"
import Button from "@/components/ui/Button"
import Pagination from "@/components/ui/Pagination"
import StatusBadge from "@/components/data-display/StatusBadge"
function formatDate(value) {
  return String(value || "").replace("T", " ").slice(0, 16) || "-"
}
export default function PendingPrescriptionsPage() {
  const { page, limit, setPage } = usePagination({ page: 1, limit: 20 })
  const { data, isLoading, error, refetch } = useGetPendingPrescriptionsQuery({ page, limit })
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
        header: "Items",
        cell: ({ row }) => <span className="text-sm text-slate-800">{(row.original.items || []).length}</span>
      },
      {
        header: "",
        cell: ({ row }) => (
          <div className="flex justify-end">
            <Button variant="secondary" size="sm" as={Link} to={`/pharmacy/prescriptions/${row.original.id}/dispense`}>
              Dispense
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
          <h1 className="text-lg font-semibold text-slate-900">Pending prescriptions</h1>
          <p className="text-sm text-slate-600">Oldest pending prescriptions first.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={refetch}>
            Refresh
          </Button>
          <Button variant="secondary" as={Link} to="/pharmacy">
            Back
          </Button>
        </div>
      </div>
      <DataTable
        columns={columns}
        data={prescriptions}
        emptyTitle="No pending prescriptions"
        emptyDescription="All prescriptions are dispensed or none have been created yet."
      />
      <Pagination page={pagination?.page || page} totalPages={pagination?.totalPages} onPageChange={setPage} />
    </div>
  )
}
