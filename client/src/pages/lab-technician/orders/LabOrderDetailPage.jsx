import { useMemo } from "react"
import { Link, useLocation, useParams } from "react-router-dom"
import { toast } from "sonner"
import { useGetLabOrderQuery, useUpdateLabOrderStatusMutation } from "@/api/lab.api"
import { LAB_ORDER_STATUS, LAB_ORDER_STATUS_TRANSITIONS } from "@/constants/statuses"
import PageLoader from "@/components/feedback/PageLoader"
import ErrorState from "@/components/ui/ErrorState"
import Button from "@/components/ui/Button"
import Card from "@/components/ui/Card"
import StatusBadge from "@/components/data-display/StatusBadge"
import { parseApiError } from "@/utils/parseApiError"
function formatDate(value) {
  return String(value || "").replace("T", " ").slice(0, 16) || "-"
}
function isItemPending(item) {
  return item.result_value == null && item.result_numeric == null
}
function canEnterResults(status) {
  return status === LAB_ORDER_STATUS.SAMPLE_COLLECTED || status === LAB_ORDER_STATUS.PROCESSING
}
const STATUS_LABELS = {
  sample_collected: "Mark sample collected",
  processing: "Start processing",
  completed: "Mark completed"
}
function ResultFlags({ item }) {
  if (item.is_critical) {
    return <span className="text-xs font-medium text-red-700">Critical</span>
  }
  if (item.is_abnormal) {
    return <span className="text-xs font-medium text-amber-700">Abnormal</span>
  }
  if (!isItemPending(item)) {
    return <span className="text-xs text-emerald-700">Normal</span>
  }
  return <span className="text-xs text-slate-500">Pending</span>
}
export default function LabOrderDetailPage() {
  const { id } = useParams()
  const location = useLocation()
  const listRow = location.state?.order
  const { data, isLoading, error, refetch } = useGetLabOrderQuery(id, { skip: !id })
  const [updateStatus, { isLoading: isUpdating }] = useUpdateLabOrderStatusMutation()
  const order = data?.data?.order
  const items = order?.items || []
  const pendingCount = useMemo(() => items.filter(isItemPending).length, [items])
  const nextStatuses = order ? LAB_ORDER_STATUS_TRANSITIONS[order.status] || [] : []
  const handleStatusChange = async (status) => {
    try {
      const res = await updateStatus({ orderId: id, status }).unwrap()
      toast.success(res?.message || "Status updated")
    } catch (err) {
      console.error("updateLabOrderStatus", { orderId: id, status, error: err })
      toast.error(parseApiError(err?.data || err))
    }
  }
  if (isLoading) return <PageLoader />
  if (error) return <ErrorState error={error?.data || error} onRetry={refetch} />
  if (!order) return <ErrorState error="Lab order not found" onRetry={refetch} />
  const patientName = listRow?.patient_name
  const patientMrn = listRow?.patient_mrn
  const doctorName = listRow?.doctor_name
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Lab order</h1>
          <p className="text-sm text-slate-600">Order details and test results.</p>
        </div>
        <div className="flex gap-2">
          {canEnterResults(order.status) && pendingCount > 0 && (
            <Button as={Link} to={`/lab/orders/${id}/results`} state={{ order: listRow }}>
              Enter results
            </Button>
          )}
          <Button variant="secondary" as={Link} to="/lab/orders">
            Back
          </Button>
        </div>
      </div>
      <Card className="p-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Patient</p>
            <p className="mt-1 font-medium text-slate-900">{patientName || order.patient_id || "-"}</p>
            {patientMrn && <p className="text-sm text-slate-600">MRN {patientMrn}</p>}
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Doctor</p>
            <p className="mt-1 text-sm text-slate-900">{doctorName || order.doctor_id || "-"}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Ordered</p>
            <p className="mt-1 text-sm text-slate-900">{formatDate(order.ordered_at)}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Priority</p>
            <div className="mt-1">
              <StatusBadge status={order.priority} />
            </div>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Status</p>
            <div className="mt-1">
              <StatusBadge status={order.status} />
            </div>
          </div>
          {order.sample_collected_at && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Sample collected</p>
              <p className="mt-1 text-sm text-slate-900">{formatDate(order.sample_collected_at)}</p>
            </div>
          )}
          {order.completed_at && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Completed</p>
              <p className="mt-1 text-sm text-slate-900">{formatDate(order.completed_at)}</p>
            </div>
          )}
        </div>
        {nextStatuses.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-200 pt-4">
            {nextStatuses.map((next) => {
              if (next === LAB_ORDER_STATUS.COMPLETED && pendingCount > 0) return null
              return (
                <Button
                  key={next}
                  size="sm"
                  disabled={isUpdating}
                  onClick={() => handleStatusChange(next)}
                >
                  {isUpdating ? "Updating..." : STATUS_LABELS[next] || next}
                </Button>
              )
            })}
          </div>
        )}
      </Card>
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-900">Tests ({items.length})</h2>
        {items.length === 0 ? (
          <Card className="p-4">
            <p className="text-sm text-slate-600">No test items on this order.</p>
          </Card>
        ) : (
          items.map((item) => (
            <Card key={item.id} className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-slate-900">{item.test_name}</p>
                  {item.category && <p className="text-xs text-slate-600">{item.category}</p>}
                  <p className="mt-1 text-sm text-slate-700">
                    {item.unit ? `Unit: ${item.unit}` : "No unit"}
                    {item.normal_range ? ` • Range: ${item.normal_range}` : ""}
                  </p>
                </div>
                <ResultFlags item={item} />
              </div>
              {!isItemPending(item) && (
                <div className="mt-3 border-t border-slate-100 pt-3 text-sm text-slate-800">
                  <p>
                    Result:{" "}
                    <span className="font-medium text-slate-900">
                      {item.result_value ?? item.result_numeric ?? "-"}
                      {item.unit ? ` ${item.unit}` : ""}
                    </span>
                  </p>
                  {item.notes && <p className="mt-1 text-slate-600">Notes: {item.notes}</p>}
                  {item.processed_at && (
                    <p className="mt-1 text-xs text-slate-500">Processed {formatDate(item.processed_at)}</p>
                  )}
                </div>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
