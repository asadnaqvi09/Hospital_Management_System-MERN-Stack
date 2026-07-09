import { Link } from "react-router-dom"
import { FlaskConical, BookOpen, Clock } from "lucide-react"
import { useGetLabOrdersQuery } from "@/api/lab.api"
import { LAB_ORDER_STATUS } from "@/constants/statuses"
import { LAB_ROUTES } from "@/constants/routes"
import PageLoader from "@/components/feedback/PageLoader"
import ErrorState from "@/components/ui/ErrorState"
import StatCard from "@/components/data-display/StatCard"
import Card from "@/components/ui/Card"
import Button from "@/components/ui/Button"
import StatusBadge from "@/components/data-display/StatusBadge"

const IN_PROGRESS = new Set([
  LAB_ORDER_STATUS.ORDERED,
  LAB_ORDER_STATUS.SAMPLE_COLLECTED,
  LAB_ORDER_STATUS.PROCESSING
])

export default function LabDashboardPage() {
  const orders = useGetLabOrdersQuery({ page: 1, limit: 50 })
  const isLoading = orders.isLoading
  const error = orders.error
  if (isLoading) return <PageLoader />
  if (error) return <ErrorState error={error?.data || error} onRetry={orders.refetch} />
  const rows = orders.data?.data?.orders || []
  const inProgress = rows.filter((o) => IN_PROGRESS.has(o.status))
  const ordered = rows.filter((o) => o.status === LAB_ORDER_STATUS.ORDERED)
  const processing = rows.filter((o) => o.status === LAB_ORDER_STATUS.PROCESSING)
  const preview = inProgress.slice(0, 6)
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Laboratory dashboard</h1>
          <p className="mt-1 text-sm text-slate-600">Orders queue and processing status.</p>
        </div>
        <Button as={Link} to={LAB_ROUTES.ORDERS}>Open queue</Button>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="In progress" value={inProgress.length} icon={FlaskConical} />
        <StatCard label="Awaiting sample" value={ordered.length} icon={Clock} />
        <StatCard label="Processing" value={processing.length} icon={BookOpen} />
      </div>
      <Card className="p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-slate-900">Active orders</h2>
          <Button variant="secondary" size="sm" as={Link} to={LAB_ROUTES.ORDERS}>View all</Button>
        </div>
        {preview.length === 0 ? (
          <p className="mt-4 text-sm text-slate-600">No active lab orders.</p>
        ) : (
          <div className="mt-4 divide-y divide-slate-100">
            {preview.map((order) => (
              <div key={order.id} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                <div>
                  <p className="font-medium text-slate-900">{order.patient_name || "Patient"}</p>
                  <p className="text-sm text-slate-600">{order.doctor_name || "Doctor"}</p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={order.status} />
                  <Button variant="secondary" size="sm" as={Link} to={`${LAB_ROUTES.ORDERS}/${order.id}`}>
                    Open
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
