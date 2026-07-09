import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { useGetQueueQuery } from "@/api/appointments.api"
import PageLoader from "@/components/feedback/PageLoader"
import ErrorState from "@/components/ui/ErrorState"
import Card from "@/components/ui/Card"
import Button from "@/components/ui/Button"
import Input from "@/components/ui/Input"
import StatusBadge from "@/components/data-display/StatusBadge"
import AppointmentStatusActions from "@/components/domain/AppointmentStatusActions"

export default function QueueBoardPage() {
  return <QueueBoard />
}
const STATUSES = ["scheduled", "confirmed", "checked_in", "in_consultation", "completed"]
function groupByStatus(rows) {
  return rows.reduce((acc, row) => {
    const status = row.status || "scheduled"
    if (!acc[status]) acc[status] = []
    acc[status].push(row)
    return acc
  }, {})
}
function QueueBoard() {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const { data, isLoading, error, refetch } = useGetQueueQuery({ date })
  const queue = data?.data?.queue || []
  const grouped = useMemo(() => groupByStatus(queue), [queue])
  if (isLoading) return <PageLoader />
  if (error) return <ErrorState error={error?.data || error} onRetry={refetch} />
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Queue board</h1>
          <p className="text-sm text-slate-600">Live updates are applied via `queue:update` socket events.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" as={Link} to="/reception/appointments">
            Appointments
          </Button>
          <Button variant="secondary" as={Link} to="/reception/appointments/new">
            Book
          </Button>
        </div>
      </div>
      <Card className="p-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="w-[220px]">
            <p className="mb-1 text-sm font-medium text-slate-700">Date</p>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <Button variant="secondary" onClick={refetch}>
            Refresh
          </Button>
        </div>
      </Card>
      <div className="grid gap-4 lg:grid-cols-5">
        {STATUSES.map((status) => (
          <Lane key={status} status={status} items={grouped[status] || []} />
        ))}
      </div>
    </div>
  )
}
const LANE_LABEL = {
  scheduled: "Scheduled",
  confirmed: "Confirmed",
  checked_in: "Checked in",
  in_consultation: "In consultation",
  completed: "Completed"
}
function Lane({ status, items }) {
  return (
    <Card className="p-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-slate-900">{LANE_LABEL[status] || status}</h2>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">{items.length}</span>
      </div>
      <div className="mt-3 space-y-3">
        {items.length === 0 ? (
          <p className="text-xs text-slate-500">No patients</p>
        ) : (
          items.map((item) => <QueueCard key={item.id} item={item} />)
        )}
      </div>
    </Card>
  )
}
function QueueCard({ item }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-slate-900">{item.patient_name || "Patient"}</p>
          <p className="mt-0.5 text-xs text-slate-600">
            MRN {item.patient_mrn || "-"} • {String(item.slot_time || "").slice(0, 5) || "-"}
          </p>
        </div>
        <StatusBadge status={item.status} className="shrink-0" />
      </div>
      <p className="mt-2 text-xs text-slate-600">{item.doctor_name || "-"}</p>
      {item.chief_complaint && <p className="mt-2 text-xs text-slate-600">{item.chief_complaint}</p>}
      <div className="mt-3 space-y-2">
        <AppointmentStatusActions appointmentId={item.id} currentStatus={item.status} size="sm" />
        <div className="flex justify-end">
          <Button variant="ghost" size="sm" as={Link} to={`/reception/appointments/${item.id}`}>
            Details
          </Button>
        </div>
      </div>
    </div>
  )
}
