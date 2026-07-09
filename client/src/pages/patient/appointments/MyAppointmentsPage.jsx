import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { useGetAppointmentsQuery } from "@/api/appointments.api"
import { usePatientScope } from "@/hooks/usePatientScope"
import { usePagination } from "@/hooks/usePagination"
import { APPOINTMENT_STATUS } from "@/constants/statuses"
import { PATIENT_ROUTES } from "@/constants/routes"
import DataTable from "@/components/data-display/DataTable"
import PageLoader from "@/components/feedback/PageLoader"
import ErrorState from "@/components/ui/ErrorState"
import Button from "@/components/ui/Button"
import Card from "@/components/ui/Card"
import Select from "@/components/ui/Select"
import Input from "@/components/ui/Input"
import FormField from "@/components/forms/FormField"
import Pagination from "@/components/ui/Pagination"
import StatusBadge from "@/components/data-display/StatusBadge"

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: APPOINTMENT_STATUS.SCHEDULED, label: "Scheduled" },
  { value: APPOINTMENT_STATUS.CONFIRMED, label: "Confirmed" },
  { value: APPOINTMENT_STATUS.CHECKED_IN, label: "Checked in" },
  { value: APPOINTMENT_STATUS.IN_CONSULTATION, label: "In consultation" },
  { value: APPOINTMENT_STATUS.COMPLETED, label: "Completed" },
  { value: APPOINTMENT_STATUS.CANCELLED, label: "Cancelled" },
  { value: APPOINTMENT_STATUS.NO_SHOW, label: "No show" }
]

export default function MyAppointmentsPage() {
  const { patientId, isLoading: profileLoading, error: profileError, refetch: refetchProfile } = usePatientScope()
  const { page, limit, setPage } = usePagination({ page: 1, limit: 20 })
  const [date, setDate] = useState("")
  const [status, setStatus] = useState("")
  const { data, isLoading, error, refetch } = useGetAppointmentsQuery(
    { page, limit, date: date || undefined, status: status || undefined },
    { skip: !patientId }
  )
  const appointments = data?.data?.appointments || []
  const pagination = data?.pagination
  const columns = useMemo(
    () => [
      { header: "Doctor", cell: ({ row }) => <span className="font-medium text-slate-900">{row.original.doctor_name || "-"}</span> },
      { header: "Date", cell: ({ row }) => row.original.appointment_date || "-" },
      { header: "Time", cell: ({ row }) => String(row.original.slot_time || "").slice(0, 5) || "-" },
      { header: "Status", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
      {
        header: "",
        cell: ({ row }) => (
          <div className="flex justify-end">
            <Button variant="secondary" size="sm" as={Link} to={`${PATIENT_ROUTES.APPOINTMENTS}/${row.original.id}`}>
              View
            </Button>
          </div>
        )
      }
    ],
    []
  )
  if (profileLoading) return <PageLoader />
  if (profileError) return <ErrorState error={profileError?.data || profileError} onRetry={refetchProfile} />
  if (!patientId) {
    return <ErrorState title="Patient profile not found" description="Your account is not linked to a patient profile." />
  }
  if (isLoading) return <PageLoader />
  if (error) return <ErrorState error={error?.data || error} onRetry={refetch} />
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">My appointments</h1>
          <p className="text-sm text-slate-600">View and manage your visits.</p>
        </div>
        <Button as={Link} to={PATIENT_ROUTES.BOOK}>
          Book appointment
        </Button>
      </div>
      <Card className="p-4">
        <div className="grid gap-3 md:grid-cols-2">
          <FormField label="Date" htmlFor="date">
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => {
                setDate(e.target.value)
                setPage(1)
              }}
            />
          </FormField>
          <FormField label="Status" htmlFor="status">
            <Select
              id="status"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value)
                setPage(1)
              }}
              options={STATUS_OPTIONS}
            />
          </FormField>
        </div>
      </Card>
      <DataTable columns={columns} data={appointments} emptyTitle="No appointments" emptyDescription="You have not booked any appointments yet." />
      <Pagination page={pagination?.page || page} totalPages={pagination?.totalPages} onPageChange={setPage} />
    </div>
  )
}
