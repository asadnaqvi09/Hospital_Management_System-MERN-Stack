import { Link } from "react-router-dom"
import { ListOrdered, Calendar, Receipt } from "lucide-react"
import { useGetQueueQuery, useGetAppointmentsQuery } from "@/api/appointments.api"
import { useGetInvoicesQuery } from "@/api/billing.api"
import { APPOINTMENT_STATUS, INVOICE_STATUS } from "@/constants/statuses"
import { RECEPTIONIST_ROUTES } from "@/constants/routes"
import PageLoader from "@/components/feedback/PageLoader"
import ErrorState from "@/components/ui/ErrorState"
import StatCard from "@/components/data-display/StatCard"
import Card from "@/components/ui/Card"
import Button from "@/components/ui/Button"
import StatusBadge from "@/components/data-display/StatusBadge"
import { formatCurrency } from "@/utils/formatCurrency"

const ACTIVE_QUEUE = new Set([
  APPOINTMENT_STATUS.SCHEDULED,
  APPOINTMENT_STATUS.CONFIRMED,
  APPOINTMENT_STATUS.CHECKED_IN,
  APPOINTMENT_STATUS.IN_CONSULTATION
])

function today() {
  return new Date().toISOString().slice(0, 10)
}

export default function ReceptionDashboardPage() {
  const date = today()
  const queue = useGetQueueQuery({ date })
  const appointments = useGetAppointmentsQuery({ date, page: 1, limit: 50 })
  const invoices = useGetInvoicesQuery({ page: 1, limit: 100 })
  const isLoading = queue.isLoading || appointments.isLoading || invoices.isLoading
  const error = queue.error || appointments.error || invoices.error
  if (isLoading) return <PageLoader />
  if (error) {
    return (
      <ErrorState
        error={error?.data || error}
        onRetry={() => {
          queue.refetch()
          appointments.refetch()
          invoices.refetch()
        }}
      />
    )
  }
  const queueRows = queue.data?.data?.queue || []
  const activeQueue = queueRows.filter((row) => ACTIVE_QUEUE.has(row.status))
  const todayAppointments = appointments.data?.data?.appointments || []
  const allInvoices = invoices.data?.data?.invoices || []
  const unpaidInvoices = allInvoices.filter(
    (inv) =>
      [INVOICE_STATUS.FINALIZED, INVOICE_STATUS.PARTIALLY_PAID].includes(inv.status) &&
      Number(inv.total || 0) > Number(inv.paid_amount || 0)
  )
  const upcoming = todayAppointments
    .filter((a) => ACTIVE_QUEUE.has(a.status))
    .slice(0, 6)
  const outstanding = unpaidInvoices.slice(0, 5)
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Reception</h1>
          <p className="mt-1 text-sm text-slate-600">Today&apos;s front-desk overview.</p>
        </div>
        <div className="flex gap-2">
          <Button as={Link} to={`${RECEPTIONIST_ROUTES.APPOINTMENTS}/new`}>Book appointment</Button>
          <Button variant="secondary" as={Link} to={RECEPTIONIST_ROUTES.QUEUE}>Queue board</Button>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Active queue" value={activeQueue.length} icon={ListOrdered} trend={`${queueRows.length} total today`} />
        <StatCard label="Today's appointments" value={todayAppointments.length} icon={Calendar} />
        <StatCard label="Unpaid invoices" value={unpaidInvoices.length} icon={Receipt} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-slate-900">Queue now</h2>
            <Button variant="secondary" size="sm" as={Link} to={RECEPTIONIST_ROUTES.QUEUE}>View board</Button>
          </div>
          {upcoming.length === 0 ? (
            <p className="mt-4 text-sm text-slate-600">No active patients in queue.</p>
          ) : (
            <div className="mt-4 divide-y divide-slate-100">
              {upcoming.map((appt) => (
                <div key={appt.id} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <div>
                    <p className="font-medium text-slate-900">{appt.patient_name || "Patient"}</p>
                    <p className="text-sm text-slate-600">
                      {appt.doctor_name || "Doctor"} • {String(appt.slot_time || "").slice(0, 5)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={appt.status} />
                    <Button variant="secondary" size="sm" as={Link} to={`${RECEPTIONIST_ROUTES.APPOINTMENTS}/${appt.id}`}>
                      Open
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-slate-900">Outstanding bills</h2>
            <Button variant="secondary" size="sm" as={Link} to={RECEPTIONIST_ROUTES.BILLING}>All invoices</Button>
          </div>
          {outstanding.length === 0 ? (
            <p className="mt-4 text-sm text-slate-600">No unpaid invoices.</p>
          ) : (
            <div className="mt-4 divide-y divide-slate-100">
              {outstanding.map((inv) => {
                const due = Number(inv.total || 0) - Number(inv.paid_amount || 0)
                return (
                  <div key={inv.id} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                    <div>
                      <p className="font-medium text-slate-900">{inv.patient_name || "Patient"}</p>
                      <p className="text-sm text-slate-600">Due {formatCurrency(due)}</p>
                    </div>
                    <StatusBadge status={inv.status} />
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
