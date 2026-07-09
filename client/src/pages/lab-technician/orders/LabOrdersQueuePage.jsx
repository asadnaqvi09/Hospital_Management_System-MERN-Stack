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
function canEnterResults(status) {
  return status === LAB_ORDER_STATUS.SAMPLE_COLLECTED || status === LAB_ORDER_STATUS.PROCESSING
}
const STATUS_OPTIONS = [
  { value: "active", label: "In progress" },
  { value: "", label: "All statuses" },
  { value: LAB_ORDER_STATUS.ORDERED, label: "Ordered" },
  { value: LAB_ORDER_STATUS.SAMPLE_COLLECTED, label: "Sample collected" },
  { value: LAB_ORDER_STATUS.PROCESSING, label: "Processing" },
  { value: LAB_ORDER_STATUS.COMPLETED, label: "Completed" }
]
const PRIORITY_OPTIONS = [
  { value: "", label: "All priorities" },
  { value: "routine", label: "Routine" },
  { value: "urgent", label: "Urgent" },
  { value: "critical", label: "Critical" }
]
export default function LabOrdersQueuePage() {
  const { page, limit, setPage } = usePagination({ page: 1, limit: 20 })
  const [status, setStatus] = useState("active")
  const [priority, setPriority] = useState("")
  const isActiveFilter = status === "active"
  const { data, isLoading, error, refetch } = useGetLabOrdersQuery({
    page,
    limit,
    status: !status || isActiveFilter ? undefined : status,
    priority: priority || undefined
  })
  const rawOrders = data?.data?.orders || []
  const orders = isActiveFilter
    ? rawOrders.filter((o) => o.status !== LAB_ORDER_STATUS.COMPLETED)
    : rawOrders
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
        header: "Priority",
        cell: ({ row }) => <StatusBadge status={row.original.priority} />
      },
      {
        header: "Status",
        cell: ({ row }) => <StatusBadge status={row.original.status} />
      },
      {
        header: "Ordered",
        cell: ({ row }) => <span className="text-sm text-slate-800">{formatDate(row.original.ordered_at)}</span>
      },
      {
        header: "",
        cell: ({ row }) => (
          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="sm" as={Link} to={`/lab/orders/${row.original.id}`} state={{ order: row.original }}>
              View
            </Button>
            {canEnterResults(row.original.status) && (
              <Button size="sm" as={Link} to={`/lab/orders/${row.original.id}/results`} state={{ order: row.original }}>
                Enter results
              </Button>
            )}
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
          <h1 className="text-lg font-semibold text-slate-900">Orders queue</h1>
          <p className="text-sm text-slate-600">Lab orders awaiting sample collection or results.</p>
        </div>
        <Button variant="secondary" as={Link} to="/lab">
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
          <div>
            <p className="mb-1 text-sm font-medium text-slate-700">Priority</p>
            <Select
              value={priority}
              onChange={(e) => {
                setPriority(e.target.value)
                setPage(1)
              }}
              options={PRIORITY_OPTIONS}
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
        emptyTitle="No lab orders"
        emptyDescription="No orders match the current filters."
      />
      <Pagination page={pagination?.page || page} totalPages={pagination?.totalPages} onPageChange={setPage} />
    </div>
  )
}
