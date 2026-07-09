import { useEffect, useMemo } from "react"
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
import { useGetDoctorAvailabilityQuery } from "@/api/doctors.api"
import { APPOINTMENT_STATUS } from "@/constants/statuses"
import { PATIENT_ROUTES } from "@/constants/routes"
import PageLoader from "@/components/feedback/PageLoader"
import ErrorState from "@/components/ui/ErrorState"
import Card from "@/components/ui/Card"
import Button from "@/components/ui/Button"
import Input from "@/components/ui/Input"
import Select from "@/components/ui/Select"
import FormField from "@/components/forms/FormField"
import StatusBadge from "@/components/data-display/StatusBadge"
import { parseApiError } from "@/utils/parseApiError"

const rescheduleSchema = z.object({
  appointmentDate: z.string().min(1, "Select a date"),
  slotTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/, "Select a time slot")
})

function canModify(status) {
  return [APPOINTMENT_STATUS.SCHEDULED, APPOINTMENT_STATUS.CONFIRMED].includes(status)
}

export default function AppointmentDetailPage() {
  const { id } = useParams()
  const { data, isLoading, error, refetch } = useGetAppointmentQuery(id, { skip: !id })
  const appointment = data?.data?.appointment
  if (isLoading) return <PageLoader />
  if (error) return <ErrorState error={error?.data || error} onRetry={refetch} />
  if (!appointment) return <ErrorState title="Appointment not found" />
  const modifiable = canModify(appointment.status)
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
        <Button variant="secondary" as={Link} to={PATIENT_ROUTES.APPOINTMENTS}>
          Back
        </Button>
      </div>
      <Card className="p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Doctor</p>
            <p className="mt-1 text-sm text-slate-900">{appointment.doctor_name || "-"}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Type</p>
            <p className="mt-1 text-sm text-slate-900">{appointment.type || "-"}</p>
          </div>
          <div className="md:col-span-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Chief complaint</p>
            <p className="mt-1 text-sm text-slate-900">{appointment.chief_complaint || "-"}</p>
          </div>
        </div>
      </Card>
      {modifiable ? (
        <>
          <RescheduleCard
            appointmentId={appointment.id}
            doctorId={appointment.doctor_id}
            currentDate={appointment.appointment_date}
            currentTime={appointment.slot_time}
            onSuccess={refetch}
          />
          <CancelCard appointmentId={appointment.id} onSuccess={refetch} />
        </>
      ) : (
        <Card className="p-6">
          <p className="text-sm text-slate-600">This appointment can no longer be rescheduled or cancelled online.</p>
        </Card>
      )}
    </div>
  )
}

function RescheduleCard({ appointmentId, doctorId, currentDate, currentTime, onSuccess }) {
  const [reschedule, { isLoading }] = useRescheduleAppointmentMutation()
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    setError
  } = useForm({
    resolver: zodResolver(rescheduleSchema),
    defaultValues: {
      appointmentDate: currentDate || new Date().toISOString().slice(0, 10),
      slotTime: String(currentTime || "").slice(0, 5)
    }
  })
  const appointmentDate = watch("appointmentDate")
  const { data: availabilityData, isFetching } = useGetDoctorAvailabilityQuery(
    { doctorId, date: appointmentDate },
    { skip: !doctorId || !appointmentDate }
  )
  const availableSlots = availabilityData?.data?.availableSlots || []
  useEffect(() => {
    if (currentDate) setValue("appointmentDate", currentDate)
    if (currentTime) setValue("slotTime", String(currentTime).slice(0, 5))
  }, [currentDate, currentTime, setValue])
  const slotOptions = useMemo(
    () => [{ value: "", label: "Select..." }, ...availableSlots.map((t) => ({ value: t, label: String(t).slice(0, 5) }))],
    [availableSlots]
  )
  const onSubmit = async (values) => {
    try {
      const res = await reschedule({ id: appointmentId, ...values }).unwrap()
      toast.success(res?.message || "Rescheduled")
      onSuccess?.()
    } catch (err) {
      setError("root", { message: parseApiError(err?.data || err) })
    }
  }
  return (
    <Card className="p-6">
      <h2 className="text-sm font-semibold text-slate-900">Reschedule</h2>
      <p className="mt-1 text-sm text-slate-600">Pick a new date and available slot.</p>
      <form onSubmit={handleSubmit(onSubmit)} className="mt-3 space-y-3">
        {errors.root?.message && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{errors.root.message}</div>}
        <div className="grid gap-3 md:grid-cols-2">
          <FormField label="Date" htmlFor="appointmentDate" error={errors.appointmentDate?.message}>
            <Input id="appointmentDate" type="date" {...register("appointmentDate")} error={Boolean(errors.appointmentDate)} />
          </FormField>
          <FormField
            label="Time"
            htmlFor="slotTime"
            error={errors.slotTime?.message}
            hint={isFetching ? "Loading slots..." : `${availableSlots.length} slots available`}
          >
            {availableSlots.length > 0 ? (
              <Select id="slotTime" {...register("slotTime")} error={Boolean(errors.slotTime)} options={slotOptions} />
            ) : (
              <Input id="slotTime" placeholder="09:30" {...register("slotTime")} error={Boolean(errors.slotTime)} />
            )}
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

function CancelCard({ appointmentId, onSuccess }) {
  const [cancel, { isLoading }] = useCancelAppointmentMutation()
  const run = async () => {
    try {
      const res = await cancel(appointmentId).unwrap()
      toast.success(res?.message || "Cancelled")
      onSuccess?.()
    } catch (err) {
      toast.error(parseApiError(err?.data || err))
    }
  }
  return (
    <Card className="p-6">
      <h2 className="text-sm font-semibold text-slate-900">Cancel</h2>
      <p className="mt-1 text-sm text-slate-600">Cancellations must be made at least 2 hours before the visit.</p>
      <div className="mt-3 flex justify-end">
        <Button variant="danger" disabled={isLoading} onClick={run}>
          {isLoading ? "Cancelling..." : "Cancel appointment"}
        </Button>
      </div>
    </Card>
  )
}
