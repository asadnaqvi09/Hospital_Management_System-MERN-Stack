import { Link } from "react-router-dom"
import { ListOrdered, FileText } from "lucide-react"
import { useGetAppointmentsQuery } from "@/api/appointments.api"
import { useGetConsultationsQuery } from "@/api/consultations.api"
import { APPOINTMENT_STATUS } from "@/constants/statuses"
import { DOCTOR_ROUTES } from "@/constants/routes"
import PageLoader from "@/components/feedback/PageLoader"
import ErrorState from "@/components/ui/ErrorState"
import StatCard from "@/components/data-display/StatCard"
import Card from "@/components/ui/Card"
import Button from "@/components/ui/Button"
import StatusBadge from "@/components/data-display/StatusBadge"

const QUEUE_STATUSES = new Set([
  APPOINTMENT_STATUS.SCHEDULED,
  APPOINTMENT_STATUS.CONFIRMED,
  APPOINTMENT_STATUS.CHECKED_IN,
  APPOINTMENT_STATUS.IN_CONSULTATION
])

function today() {
  return new Date().toISOString().slice(0, 10)
}

export default function DoctorDashboardPage() {
  const date = today()
  const appointments = useGetAppointmentsQuery({ date, page: 1, limit: 100 })
  const consultations = useGetConsultationsQuery({ page: 1, limit: 50 })
  const isLoading = appointments.isLoading || consultations.isLoading
  const error = appointments.error || consultations.error
  if (isLoading) return <PageLoader />
  if (error) {
    return (
      <ErrorState
        error={error?.data || error}
        onRetry={() => {
          appointments.refetch()
          consultations.refetch()
        }}
      />
    )
  }
  const todayRows = appointments.data?.data?.appointments || []
  const queueToday = todayRows.filter((a) => QUEUE_STATUSES.has(a.status))
  const allConsultations = consultations.data?.data?.consultations || []
  const openConsultations = allConsultations.filter((c) => !c.is_locked)
  const queuePreview = queueToday.slice(0, 6)
  const consultPreview = openConsultations.slice(0, 5)
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Doctor dashboard</h1>
          <p className="mt-1 text-sm text-slate-600">Today&apos;s clinic overview.</p>
        </div>
        <Button as={Link} to={DOCTOR_ROUTES.QUEUE}>Open queue</Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <StatCard label="Today's queue" value={queueToday.length} icon={ListOrdered} trend={`${todayRows.length} appointments today`} />
        <StatCard label="Open consultations" value={openConsultations.length} icon={FileText} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-slate-900">Queue today</h2>
            <Button variant="secondary" size="sm" as={Link} to={DOCTOR_ROUTES.QUEUE}>View all</Button>
          </div>
          {queuePreview.length === 0 ? (
            <p className="mt-4 text-sm text-slate-600">No patients in today&apos;s queue.</p>
          ) : (
            <div className="mt-4 divide-y divide-slate-100">
              {queuePreview.map((appt) => (
                <div key={appt.id} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <div>
                    <p className="font-medium text-slate-900">{appt.patient_name || "Patient"}</p>
                    <p className="text-sm text-slate-600">{String(appt.slot_time || "").slice(0, 5)}</p>
                  </div>
                  <StatusBadge status={appt.status} />
                </div>
              ))}
            </div>
          )}
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-slate-900">Pending consultations</h2>
            <Button variant="secondary" size="sm" as={Link} to={DOCTOR_ROUTES.CONSULTATIONS}>View all</Button>
          </div>
          {consultPreview.length === 0 ? (
            <p className="mt-4 text-sm text-slate-600">No open consultations.</p>
          ) : (
            <div className="mt-4 divide-y divide-slate-100">
              {consultPreview.map((c) => (
                <div key={c.id} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <div>
                    <p className="font-medium text-slate-900">{c.patient_name || "Patient"}</p>
                    <p className="text-sm text-slate-600">{String(c.created_at || "").slice(0, 10)}</p>
                  </div>
                  <Button variant="secondary" size="sm" as={Link} to={`${DOCTOR_ROUTES.CONSULTATIONS}/${c.id}`}>
                    Open
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
