import { Link } from "react-router-dom"
import { ListOrdered, Activity, Bed } from "lucide-react"
import { useGetQueueQuery } from "@/api/appointments.api"
import { useGetAdmissionsQuery } from "@/api/ipd.api"
import { APPOINTMENT_STATUS } from "@/constants/statuses"
import { NURSE_ROUTES } from "@/constants/routes"
import PageLoader from "@/components/feedback/PageLoader"
import ErrorState from "@/components/ui/ErrorState"
import StatCard from "@/components/data-display/StatCard"
import Card from "@/components/ui/Card"
import Button from "@/components/ui/Button"
import StatusBadge from "@/components/data-display/StatusBadge"

const WAITING = new Set([
  APPOINTMENT_STATUS.SCHEDULED,
  APPOINTMENT_STATUS.CONFIRMED,
  APPOINTMENT_STATUS.CHECKED_IN
])

function today() {
  return new Date().toISOString().slice(0, 10)
}

export default function NurseDashboardPage() {
  const date = today()
  const queue = useGetQueueQuery({ date })
  const admissions = useGetAdmissionsQuery({ status: "admitted", page: 1, limit: 20 })
  const isLoading = queue.isLoading || admissions.isLoading
  const error = queue.error || admissions.error
  if (isLoading) return <PageLoader />
  if (error) {
    return (
      <ErrorState
        error={error?.data || error}
        onRetry={() => {
          queue.refetch()
          admissions.refetch()
        }}
      />
    )
  }
  const queueRows = queue.data?.data?.queue || []
  const waiting = queueRows.filter((row) => WAITING.has(row.status))
  const admitted = admissions.data?.data?.admissions || []
  const queuePreview = waiting.slice(0, 5)
  const admissionPreview = admitted.slice(0, 5)
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Nurse dashboard</h1>
          <p className="mt-1 text-sm text-slate-600">Queue, vitals, and inpatient care.</p>
        </div>
        <Button as={Link} to={NURSE_ROUTES.QUEUE}>Open queue</Button>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Waiting patients" value={waiting.length} icon={ListOrdered} trend={`${queueRows.length} in queue today`} />
        <StatCard label="Active admissions" value={admitted.length} icon={Bed} />
        <StatCard label="Vitals today" value={queueRows.filter((r) => r.status === APPOINTMENT_STATUS.CHECKED_IN).length} icon={Activity} trend="Checked in" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-slate-900">Waiting for vitals</h2>
            <Button variant="secondary" size="sm" as={Link} to={NURSE_ROUTES.QUEUE}>Queue</Button>
          </div>
          {queuePreview.length === 0 ? (
            <p className="mt-4 text-sm text-slate-600">No patients waiting.</p>
          ) : (
            <div className="mt-4 divide-y divide-slate-100">
              {queuePreview.map((appt) => (
                <div key={appt.id} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <div>
                    <p className="font-medium text-slate-900">{appt.patient_name || "Patient"}</p>
                    <p className="text-sm text-slate-600">{appt.doctor_name || "Doctor"}</p>
                  </div>
                  <StatusBadge status={appt.status} />
                </div>
              ))}
            </div>
          )}
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-slate-900">Active admissions</h2>
            <Button variant="secondary" size="sm" as={Link} to={NURSE_ROUTES.IPD}>View all</Button>
          </div>
          {admissionPreview.length === 0 ? (
            <p className="mt-4 text-sm text-slate-600">No active admissions.</p>
          ) : (
            <div className="mt-4 divide-y divide-slate-100">
              {admissionPreview.map((adm) => (
                <div key={adm.id} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <div>
                    <p className="font-medium text-slate-900">{adm.patient_name || "Patient"}</p>
                    <p className="text-sm text-slate-600">
                      {(adm.ward || "-") + " • " + (adm.room_number || "-")}
                    </p>
                  </div>
                  <Button variant="secondary" size="sm" as={Link} to={`${NURSE_ROUTES.IPD}/${adm.id}/notes`}>
                    Notes
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
