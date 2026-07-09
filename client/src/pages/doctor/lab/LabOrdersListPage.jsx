import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { useGetLabOrdersQuery } from "@/api/lab.api"
import { usePagination } from "@/hooks/usePagination"
import { LAB_ORDER_STATUS } from "@/constants/statuses"
import { DOCTOR_ROUTES } from "@/constants/routes"
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

export default function LabOrdersListPage() {
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
  const orders = isActiveFilter ? rawOrders.filter((o) => o.status !== LAB_ORDER_STATUS.COMPLETED) : rawOrders
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
          <h1 className="text-lg font-semibold text-slate-900">Lab orders</h1>
          <p className="text-sm text-slate-600">Orders you have placed for patients.</p>
        </div>
        <Button as={Link} to={`${DOCTOR_ROUTES.LAB}/new`}>
          New order
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
            <Button variant="secondary" onClick={refetch}>Refresh</Button>
          </div>
        </div>
      </Card>
      <DataTable
        columns={columns}
        data={orders}
        emptyTitle="No lab orders"
        emptyDescription="You have not placed any lab orders yet."
      />
      <Pagination page={pagination?.page || page} totalPages={pagination?.totalPages} onPageChange={setPage} />
    </div>
  )
}
