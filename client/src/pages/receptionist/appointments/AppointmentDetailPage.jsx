import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Link, useParams } from "react-router-dom"
import { toast } from "sonner"
import {
  useCancelAppointmentMutation,
  useGetAppointmentQuery,
  useRescheduleAppointmentMutation
} from "@/api/appointments.api"
import { useGetPatientQuery } from "@/api/patients.api"
import { useGetDoctorQuery } from "@/api/doctors.api"
import PageLoader from "@/components/feedback/PageLoader"
import ErrorState from "@/components/ui/ErrorState"
import Card from "@/components/ui/Card"
import Button from "@/components/ui/Button"
import Input from "@/components/ui/Input"
import FormField from "@/components/forms/FormField"
import StatusBadge from "@/components/data-display/StatusBadge"
import AppointmentStatusActions from "@/components/domain/AppointmentStatusActions"
import { parseApiError } from "@/utils/parseApiError"
export default function AppointmentDetailPage() {
  const { id } = useParams()
  const { data, isLoading, error, refetch } = useGetAppointmentQuery(id, { skip: !id })
  const appointment = data?.data?.appointment
  const patientId = appointment?.patient_id
  const doctorId = appointment?.doctor_id
  const { data: patientRes } = useGetPatientQuery(patientId, { skip: !patientId })
  const { data: doctorRes } = useGetDoctorQuery(doctorId, { skip: !doctorId })
  const patient = patientRes?.data?.patient
  const doctor = doctorRes?.data?.doctor
  if (isLoading) return <PageLoader />
  if (error) return <ErrorState error={error?.data || error} onRetry={refetch} />
  if (!appointment) return <ErrorState title="Appointment not found" />
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Appointment</h1>
          <div className="mt-1 flex items-center gap-2">
            <StatusBadge status={appointment.status} />
            <p className="text-sm text-slate-600">
              {appointment.appointment_date} • {String(appointment.slot_time || "").slice(0, 5)}
            </p>
          </div>
        </div>
        <Button variant="secondary" as={Link} to="/reception/appointments">
          Back
        </Button>
      </div>
      <Card className="p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Patient</p>
            <p className="mt-1 text-sm text-slate-900">{patient?.full_name || patient?.fullName || appointment.patient_name || "-"}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Doctor</p>
            <p className="mt-1 text-sm text-slate-900">{doctor?.full_name || doctor?.fullName || appointment.doctor_name || "-"}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Type</p>
            <p className="mt-1 text-sm text-slate-900">{appointment.type || "-"}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Booked via</p>
            <p className="mt-1 text-sm text-slate-900">{appointment.booking_source || "-"}</p>
          </div>
          <div className="md:col-span-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Chief complaint</p>
            <p className="mt-1 text-sm text-slate-900">{appointment.chief_complaint || "-"}</p>
          </div>
        </div>
      </Card>
      <Card className="p-6">
        <h2 className="text-sm font-semibold text-slate-900">Status actions</h2>
        <p className="mt-1 text-sm text-slate-600">Only transitions allowed by backend are shown.</p>
        <div className="mt-3">
          <AppointmentStatusActions appointmentId={appointment.id} currentStatus={appointment.status} />
        </div>
      </Card>
      <RescheduleCard appointmentId={appointment.id} currentDate={appointment.appointment_date} currentTime={appointment.slot_time} />
      <CancelCard appointmentId={appointment.id} />
    </div>
  )
}
const rescheduleSchema = z.object({
  appointmentDate: z.string().min(1, "Select a date"),
  slotTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/, "Time must be HH:MM or HH:MM:SS")
})
function RescheduleCard({ appointmentId, currentDate, currentTime }) {
  const [reschedule, { isLoading }] = useRescheduleAppointmentMutation()
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError
  } = useForm({
    resolver: zodResolver(rescheduleSchema),
    defaultValues: {
      appointmentDate: currentDate || new Date().toISOString().slice(0, 10),
      slotTime: String(currentTime || "").slice(0, 5)
    }
  })
  const onSubmit = async (values) => {
    try {
      const res = await reschedule({ id: appointmentId, ...values }).unwrap()
      toast.success(res?.message || "Rescheduled")
    } catch (error) {
      const message = parseApiError(error?.data || error)
      console.error("rescheduleAppointment failed", { appointmentId, error })
      setError("root", { message })
    }
  }
  return (
    <Card className="p-6">
      <h2 className="text-sm font-semibold text-slate-900">Reschedule</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="mt-3 space-y-3">
        {errors.root?.message && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{errors.root.message}</div>}
        <div className="grid gap-3 md:grid-cols-2">
          <FormField label="Date" htmlFor="appointmentDate" error={errors.appointmentDate?.message}>
            <Input id="appointmentDate" type="date" {...register("appointmentDate")} error={Boolean(errors.appointmentDate)} />
          </FormField>
          <FormField label="Time" htmlFor="slotTime" error={errors.slotTime?.message}>
            <Input id="slotTime" placeholder="09:30" {...register("slotTime")} error={Boolean(errors.slotTime)} />
          </FormField>
        </div>
        <div className="flex justify-end">
          <Button type="submit" variant="secondary" disabled={isLoading}>
            {isLoading ? "Updating..." : "Reschedule"}
          </Button>
        </div>
      </form>
    </Card>
  )
}
function CancelCard({ appointmentId }) {
  const [cancel, { isLoading, error }] = useCancelAppointmentMutation()
  const run = async () => {
    try {
      const res = await cancel(appointmentId).unwrap()
      toast.success(res?.message || "Cancelled")
    } catch (e) {
      const message = parseApiError(e?.data || e)
      console.error("cancelAppointment failed", { appointmentId, error: e })
      toast.error(message)
    }
  }
  return (
    <Card className="p-6">
      <h2 className="text-sm font-semibold text-slate-900">Cancel</h2>
      <p className="mt-1 text-sm text-slate-600">Cancellation is only allowed for scheduled/confirmed appointments.</p>
      {error && <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{parseApiError(error?.data || error)}</div>}
      <div className="mt-3 flex justify-end">
        <Button variant="danger" disabled={isLoading} onClick={run}>
          {isLoading ? "Cancelling..." : "Cancel appointment"}
        </Button>
      </div>
    </Card>
  )
}
