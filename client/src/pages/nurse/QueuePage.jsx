import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { useGetQueueQuery, useLazyGetAppointmentQuery } from "@/api/appointments.api"
import PageLoader from "@/components/feedback/PageLoader"
import ErrorState from "@/components/ui/ErrorState"
import Card from "@/components/ui/Card"
import Button from "@/components/ui/Button"
import Input from "@/components/ui/Input"
import StatusBadge from "@/components/data-display/StatusBadge"
import { parseApiError } from "@/utils/parseApiError"

const STATUSES = ["scheduled", "confirmed", "checked_in", "in_consultation", "completed"]
const LANE_LABEL = {
  scheduled: "Scheduled",
  confirmed: "Confirmed",
  checked_in: "Checked in",
  in_consultation: "In consultation",
  completed: "Completed"
}

function groupByStatus(rows) {
  return rows.reduce((acc, row) => {
    const status = row.status || "scheduled"
    if (!acc[status]) acc[status] = []
    acc[status].push(row)
    return acc
  }, {})
}

export default function QueuePage() {
  return <QueueBoard />
}

function QueueBoard() {
  const navigate = useNavigate()
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const { data, isLoading, error, refetch } = useGetQueueQuery({ date })
  const queue = data?.data?.queue || []
  const grouped = useMemo(() => groupByStatus(queue), [queue])
  const [getAppointment, { isFetching: isResolving }] = useLazyGetAppointmentQuery()

  const openVitals = async (appointmentId) => {
    try {
      const res = await getAppointment(appointmentId).unwrap()
      const appointment = res?.data?.appointment
      const patientId = appointment?.patient_id
      if (!patientId) {
        toast.error("Patient not found for this appointment")
        return
      }
      navigate(`/nurse/vitals?patientId=${patientId}&appointmentId=${appointmentId}`)
    } catch (e) {
      const message = parseApiError(e?.data || e)
      console.error("resolveAppointmentForVitals failed", { appointmentId, error: e })
      toast.error(message)
    }
  }

  if (isLoading) return <PageLoader />
  if (error) return <ErrorState error={error?.data || error} onRetry={refetch} />

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Queue</h1>
          <p className="text-sm text-slate-600">Live updates are applied via `queue:update` socket events.</p>
        </div>
        <Button variant="secondary" onClick={refetch}>
          Refresh
        </Button>
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="w-[220px]">
            <p className="mb-1 text-sm font-medium text-slate-700">Date</p>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-5">
        {STATUSES.map((status) => (
          <Lane key={status} status={status} items={grouped[status] || []} onVitals={openVitals} isResolving={isResolving} />
        ))}
      </div>
    </div>
  )
}

function Lane({ status, items, onVitals, isResolving }) {
  return (
    <Card className="p-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-slate-900">{LANE_LABEL[status] || status}</h2>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">{items.length}</span>
      </div>
      <div className="mt-3 space-y-3">
        {items.length === 0 ? <p className="text-xs text-slate-500">No patients</p> : items.map((item) => (
          <QueueCard key={item.id} item={item} onVitals={onVitals} isResolving={isResolving} />
        ))}
      </div>
    </Card>
  )
}

function QueueCard({ item, onVitals, isResolving }) {
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
      <div className="mt-3 flex justify-end">
        <Button variant="secondary" size="sm" disabled={isResolving} onClick={() => onVitals(item.id)}>
          {isResolving ? "Loading..." : "Record vitals"}
        </Button>
      </div>
    </div>
  )
}
