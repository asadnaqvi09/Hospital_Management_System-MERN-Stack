import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { useGetLabOrdersQuery } from "@/api/lab.api"
import { usePagination } from "@/hooks/usePagination"
import { LAB_ORDER_STATUS } from "@/constants/statuses"
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
  { value: LAB_ORDER_STATUS.COMPLETED, label: "Completed" },
  { value: "", label: "All statuses" },
  { value: LAB_ORDER_STATUS.ORDERED, label: "Ordered" },
  { value: LAB_ORDER_STATUS.SAMPLE_COLLECTED, label: "Sample collected" },
  { value: LAB_ORDER_STATUS.PROCESSING, label: "Processing" }
]
export default function MyLabReportsPage() {
  const { page, limit, setPage } = usePagination({ page: 1, limit: 20 })
  const [status, setStatus] = useState(LAB_ORDER_STATUS.COMPLETED)
  const { data, isLoading, error, refetch } = useGetLabOrdersQuery({
    page,
    limit,
    status: status || undefined
  })
  const orders = data?.data?.orders || []
  const pagination = data?.pagination
  const columns = useMemo(
    () => [
      {
        header: "Doctor",
        cell: ({ row }) => <span className="text-sm text-slate-800">{row.original.doctor_name || "-"}</span>
      },
      {
        header: "Status",
        cell: ({ row }) => <StatusBadge status={row.original.status} />
      },
      {
        header: "Priority",
        cell: ({ row }) => <StatusBadge status={row.original.priority} />
      },
      {
        header: "Ordered",
        cell: ({ row }) => <span className="text-sm text-slate-800">{formatDate(row.original.ordered_at)}</span>
      },
      {
        header: "Completed",
        cell: ({ row }) => <span className="text-sm text-slate-800">{formatDate(row.original.completed_at)}</span>
      },
      {
        header: "",
        cell: ({ row }) => (
          <div className="flex justify-end">
            <Button variant="secondary" size="sm" as={Link} to={`/patient/lab/${row.original.id}`} state={{ order: row.original }}>
              View report
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
      <div>
        <h1 className="text-lg font-semibold text-slate-900">Lab reports</h1>
        <p className="text-sm text-slate-600">View your lab orders and results.</p>
      </div>
      <Card className="p-4">
        <div className="grid gap-3 md:grid-cols-2">
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
          <div className="flex items-end justify-end">
            <Button variant="secondary" onClick={refetch}>
              Refresh
            </Button>
          </div>
        </div>
      </Card>
      <DataTable
        columns={columns}
        data={orders}
        emptyTitle="No lab reports"
        emptyDescription="No lab orders match the current filter."
      />
      <Pagination page={pagination?.page || page} totalPages={pagination?.totalPages} onPageChange={setPage} />
    </div>
  )
}
