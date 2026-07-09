import { useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { useGetAppointmentsQuery } from "@/api/appointments.api"
import { useCreateConsultationMutation } from "@/api/consultations.api"
import PageLoader from "@/components/feedback/PageLoader"
import ErrorState from "@/components/ui/ErrorState"
import Card from "@/components/ui/Card"
import Button from "@/components/ui/Button"
import Input from "@/components/ui/Input"
import StatusBadge from "@/components/data-display/StatusBadge"
import AppointmentStatusActions from "@/components/domain/AppointmentStatusActions"
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

export default function MyQueuePage() {
  return <QueueBoard />
}

function QueueBoard() {
  const navigate = useNavigate()
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const { data, isLoading, error, refetch } = useGetAppointmentsQuery({ date, page: 1, limit: 200 })
  const appointments = data?.data?.appointments || []
  const grouped = useMemo(() => groupByStatus(appointments), [appointments])
  const [openConsultation, { isLoading: isOpening }] = useCreateConsultationMutation()

  const startConsultation = async (appointment) => {
    try {
      const res = await openConsultation({
        appointmentId: appointment.id,
        chiefComplaint: appointment.chief_complaint || undefined
      }).unwrap()
      const consultationId = res?.data?.consultation?.id
      toast.success(res?.message || "Consultation opened")
      if (consultationId) {
        navigate(`/doctor/consultations/${consultationId}`)
      } else {
        navigate("/doctor/consultations")
      }
    } catch (e) {
      const message = parseApiError(e?.data || e)
      console.error("openConsultation failed", { appointmentId: appointment?.id, error: e })
      toast.error(message)
    }
  }

  if (isLoading) return <PageLoader />
  if (error) return <ErrorState error={error?.data || error} onRetry={refetch} />

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">My Queue</h1>
          <p className="text-sm text-slate-600">Appointments are scoped to your doctor account by the backend.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" as={Link} to="/doctor/appointments">
            Appointments
          </Button>
          <Button variant="secondary" onClick={refetch}>
            Refresh
          </Button>
        </div>
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
          <Lane
            key={status}
            status={status}
            items={grouped[status] || []}
            onStartConsultation={startConsultation}
            isOpening={isOpening}
          />
        ))}
      </div>
    </div>
  )
}

function Lane({ status, items, onStartConsultation, isOpening }) {
  return (
    <Card className="p-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-slate-900">{LANE_LABEL[status] || status}</h2>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">{items.length}</span>
      </div>
      <div className="mt-3 space-y-3">
        {items.length === 0 ? <p className="text-xs text-slate-500">No patients</p> : items.map((a) => (
          <QueueCard key={a.id} appointment={a} onStartConsultation={onStartConsultation} isOpening={isOpening} />
        ))}
      </div>
    </Card>
  )
}

function QueueCard({ appointment, onStartConsultation, isOpening }) {
  const patientName = appointment.patient_name || "-"
  const patientMrn = appointment.patient_mrn || "-"
  const time = String(appointment.slot_time || "").slice(0, 5) || "-"
  const canStart = ["confirmed", "checked_in", "in_consultation"].includes(appointment.status)

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-slate-900">{patientName}</p>
          <p className="mt-0.5 text-xs text-slate-600">
            MRN {patientMrn} • {time}
          </p>
        </div>
        <StatusBadge status={appointment.status} className="shrink-0" />
      </div>
      {appointment.chief_complaint && <p className="mt-2 text-xs text-slate-600">{appointment.chief_complaint}</p>}
      <div className="mt-3 space-y-2">
        <AppointmentStatusActions appointmentId={appointment.id} currentStatus={appointment.status} size="sm" />
        <div className="flex flex-wrap items-center justify-end gap-2">
          {appointment.patient_id && (
            <Button variant="ghost" size="sm" as={Link} to={`/doctor/patients/${appointment.patient_id}`}>
              Patient
            </Button>
          )}
          <Button
            variant="secondary"
            size="sm"
            disabled={!canStart || isOpening}
            onClick={() => onStartConsultation(appointment)}
          >
            {isOpening ? "Opening..." : "Open consultation"}
          </Button>
        </div>
      </div>
    </div>
  )
}
