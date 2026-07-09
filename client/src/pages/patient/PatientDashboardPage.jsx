import { Link } from "react-router-dom"
import { Calendar, FlaskConical, Receipt } from "lucide-react"
import { useGetAppointmentsQuery } from "@/api/appointments.api"
import { useGetLabOrdersQuery } from "@/api/lab.api"
import { useGetInvoicesQuery } from "@/api/billing.api"
import { usePatientScope } from "@/hooks/usePatientScope"
import { APPOINTMENT_STATUS, INVOICE_STATUS, LAB_ORDER_STATUS } from "@/constants/statuses"
import { PATIENT_ROUTES } from "@/constants/routes"
import PageLoader from "@/components/feedback/PageLoader"
import ErrorState from "@/components/ui/ErrorState"
import Button from "@/components/ui/Button"
import Card from "@/components/ui/Card"
import StatCard from "@/components/data-display/StatCard"
import StatusBadge from "@/components/data-display/StatusBadge"
import { formatCurrency } from "@/utils/formatCurrency"

function formatDate(value) {
  return String(value || "").replace("T", " ").slice(0, 16) || "-"
}

function isUpcoming(appointment) {
  const status = appointment.status
  if (![APPOINTMENT_STATUS.SCHEDULED, APPOINTMENT_STATUS.CONFIRMED].includes(status)) {
    return false
  }
  const slot = String(appointment.slot_time || "00:00").slice(0, 5)
  const start = new Date(`${appointment.appointment_date}T${slot}`)
  return start.getTime() >= Date.now()
}

export default function PatientDashboardPage() {
  const { patient, patientId, isLoading, error, refetch } = usePatientScope()
  const { data: apptData, isLoading: apptLoading } = useGetAppointmentsQuery(
    { page: 1, limit: 20 },
    { skip: !patientId }
  )
  const { data: labData, isLoading: labLoading } = useGetLabOrdersQuery(
    { page: 1, limit: 5, status: LAB_ORDER_STATUS.COMPLETED },
    { skip: !patientId }
  )
  const { data: invoiceData, isLoading: invoiceLoading } = useGetInvoicesQuery(
    { page: 1, limit: 20 },
    { skip: !patientId }
  )
  const appointments = (apptData?.data?.appointments || []).filter(isUpcoming).slice(0, 5)
  const labOrders = labData?.data?.orders || []
  const openInvoices = (invoiceData?.data?.invoices || [])
    .filter((inv) => ![INVOICE_STATUS.FULLY_PAID, INVOICE_STATUS.CANCELLED, INVOICE_STATUS.DRAFT].includes(inv.status))
    .slice(0, 5)
  const upcomingCount = appointments.length
  const openBillCount = openInvoices.length
  if (isLoading) return <PageLoader />
  if (error) return <ErrorState error={error?.data || error} onRetry={refetch} />
  if (!patientId) {
    return <ErrorState title="Patient profile not found" description="Your account is not linked to a patient profile." />
  }
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Welcome back</h1>
          <p className="text-sm text-slate-600">
            {patient?.full_name || patient?.fullName || "Patient"} • MRN {patient?.mrn || "-"}
          </p>
        </div>
        <Button as={Link} to={PATIENT_ROUTES.BOOK}>
          Book appointment
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Upcoming visits" value={upcomingCount} icon={Calendar} />
        <StatCard label="Lab reports" value={labOrders.length} icon={FlaskConical} trend="Recently completed" />
        <StatCard label="Open bills" value={openBillCount} icon={Receipt} />
      </div>
      <Card className="p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-slate-900">Upcoming appointments</h2>
          <Button variant="secondary" size="sm" as={Link} to={PATIENT_ROUTES.APPOINTMENTS}>
            View all
          </Button>
        </div>
        {apptLoading ? (
          <p className="mt-4 text-sm text-slate-600">Loading...</p>
        ) : appointments.length === 0 ? (
          <p className="mt-4 text-sm text-slate-600">No upcoming appointments.</p>
        ) : (
          <div className="mt-4 divide-y divide-slate-100">
            {appointments.map((appt) => (
              <div key={appt.id} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                <div>
                  <p className="font-medium text-slate-900">{appt.doctor_name || "Doctor"}</p>
                  <p className="text-sm text-slate-600">
                    {appt.appointment_date} • {String(appt.slot_time || "").slice(0, 5)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={appt.status} />
                  <Button variant="secondary" size="sm" as={Link} to={`${PATIENT_ROUTES.APPOINTMENTS}/${appt.id}`}>
                    View
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-slate-900">Recent lab reports</h2>
            <Button variant="secondary" size="sm" as={Link} to={PATIENT_ROUTES.LAB}>
              View all
            </Button>
          </div>
          {labLoading ? (
            <p className="mt-4 text-sm text-slate-600">Loading...</p>
          ) : labOrders.length === 0 ? (
            <p className="mt-4 text-sm text-slate-600">No completed lab reports yet.</p>
          ) : (
            <div className="mt-4 divide-y divide-slate-100">
              {labOrders.map((order) => (
                <div key={order.id} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <div>
                    <p className="font-medium text-slate-900">{order.doctor_name || "Doctor"}</p>
                    <p className="text-sm text-slate-600">{formatDate(order.completed_at || order.ordered_at)}</p>
                  </div>
                  <Button variant="secondary" size="sm" as={Link} to={`${PATIENT_ROUTES.LAB}/${order.id}`} state={{ order }}>
                    View
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-slate-900">Outstanding bills</h2>
            <Button variant="secondary" size="sm" as={Link} to={PATIENT_ROUTES.BILLING}>
              View all
            </Button>
          </div>
          {invoiceLoading ? (
            <p className="mt-4 text-sm text-slate-600">Loading...</p>
          ) : openInvoices.length === 0 ? (
            <p className="mt-4 text-sm text-slate-600">No outstanding bills.</p>
          ) : (
            <div className="mt-4 divide-y divide-slate-100">
              {openInvoices.map((invoice) => {
                const outstanding = Number(invoice.total || 0) - Number(invoice.paid_amount || 0)
                return (
                  <div key={invoice.id} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                    <div>
                      <p className="font-medium text-slate-900">{formatCurrency(invoice.total)}</p>
                      <p className="text-sm text-slate-600">Due {formatCurrency(outstanding)}</p>
                    </div>
                    <StatusBadge status={invoice.status} />
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
