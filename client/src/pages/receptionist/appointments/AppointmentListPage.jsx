import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { useGetAppointmentsQuery } from "@/api/appointments.api"
import { useGetDoctorsQuery } from "@/api/doctors.api"
import DataTable from "@/components/data-display/DataTable"
import PageLoader from "@/components/feedback/PageLoader"
import ErrorState from "@/components/ui/ErrorState"
import Button from "@/components/ui/Button"
import Select from "@/components/ui/Select"
import Input from "@/components/ui/Input"
import FormField from "@/components/forms/FormField"
import Pagination from "@/components/ui/Pagination"
import StatusBadge from "@/components/data-display/StatusBadge"
import { usePagination } from "@/hooks/usePagination"
import { APPOINTMENT_STATUS } from "@/constants/statuses"
export default function AppointmentListPage() {
  return <AppointmentsList />
}
function toDoctorLabel(d) {
  return d?.full_name || d?.fullName || d?.email || "Doctor"
}
function AppointmentsList() {
  const { page, limit, setPage } = usePagination({ page: 1, limit: 20 })
  const [date, setDate] = useState("")
  const [status, setStatus] = useState("")
  const [doctorId, setDoctorId] = useState("")
  const { data: doctorsData } = useGetDoctorsQuery({})
  const doctors = doctorsData?.data?.doctors || []
  const { data, isLoading, error, refetch } = useGetAppointmentsQuery({
    page,
    limit,
    date: date || undefined,
    status: status || undefined,
    doctorId: doctorId || undefined
  })
  const appointments = data?.data?.appointments || []
  const pagination = data?.pagination
  const columns = useMemo(
    () => [
      {
        header: "Patient",
        cell: ({ row }) => (
          <div className="space-y-0.5">
            <div className="font-medium text-slate-900">{row.original.patient_name || "-"}</div>
            <div className="text-xs text-slate-500">MRN {row.original.patient_mrn || "-"}</div>
          </div>
        )
      },
      { header: "Doctor", cell: ({ row }) => row.original.doctor_name || "-" },
      { header: "Date", cell: ({ row }) => row.original.appointment_date || "-" },
      { header: "Time", cell: ({ row }) => String(row.original.slot_time || "").slice(0, 5) || "-" },
      { header: "Status", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
      {
        header: "",
        cell: ({ row }) => (
          <div className="flex justify-end">
            <Button variant="secondary" size="sm" as={Link} to={`/reception/appointments/${row.original.id}`}>
              View
            </Button>
          </div>
        )
      }
    ],
    []
  )
  if (isLoading) return <PageLoader />
  if (error) return <ErrorState error={error?.data || error} onRetry={refetch} />
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-semibold text-slate-900">Appointments</h1>
        <div className="flex items-center gap-2">
          <Button as={Link} to="/reception/appointments/new">
            Book appointment
          </Button>
          <Button variant="secondary" as={Link} to="/reception/queue">
            Queue board
          </Button>
        </div>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="grid gap-3 md:grid-cols-3">
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
              options={[
                { value: "", label: "All" },
                { value: APPOINTMENT_STATUS.SCHEDULED, label: "Scheduled" },
                { value: APPOINTMENT_STATUS.CONFIRMED, label: "Confirmed" },
                { value: APPOINTMENT_STATUS.CHECKED_IN, label: "Checked in" },
                { value: APPOINTMENT_STATUS.IN_CONSULTATION, label: "In consultation" },
                { value: APPOINTMENT_STATUS.COMPLETED, label: "Completed" },
                { value: APPOINTMENT_STATUS.CANCELLED, label: "Cancelled" },
                { value: APPOINTMENT_STATUS.NO_SHOW, label: "No show" }
              ]}
            />
          </FormField>
          <FormField label="Doctor" htmlFor="doctorId">
            <Select
              id="doctorId"
              value={doctorId}
              onChange={(e) => {
                setDoctorId(e.target.value)
                setPage(1)
              }}
              options={[{ value: "", label: "All" }, ...doctors.map((d) => ({ value: d.id, label: toDoctorLabel(d) }))]}
            />
          </FormField>
        </div>
      </div>
      <DataTable columns={columns} data={appointments} emptyTitle="No appointments" emptyDescription="No appointments found for these filters." />
      <Pagination page={pagination?.page || page} totalPages={pagination?.totalPages} onPageChange={setPage} />
    </div>
  )
}
