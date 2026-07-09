import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Link, useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { useCreateAppointmentMutation } from "@/api/appointments.api"
import { useGetDoctorsQuery, useGetDoctorAvailabilityQuery } from "@/api/doctors.api"
import { usePatientScope } from "@/hooks/usePatientScope"
import { PATIENT_ROUTES } from "@/constants/routes"
import PageLoader from "@/components/feedback/PageLoader"
import ErrorState from "@/components/ui/ErrorState"
import Button from "@/components/ui/Button"
import Input from "@/components/ui/Input"
import Select from "@/components/ui/Select"
import FormField from "@/components/forms/FormField"
import Card from "@/components/ui/Card"
import { parseApiError } from "@/utils/parseApiError"

const schema = z.object({
  doctorId: z.string().uuid("Select a doctor"),
  appointmentDate: z.string().min(1, "Select a date"),
  slotTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/, "Select a time slot"),
  type: z.enum(["booked", "follow_up"]).optional().or(z.literal("")),
  chiefComplaint: z.string().optional().or(z.literal(""))
})

function toDoctorLabel(d) {
  return d?.full_name || d?.fullName || d?.email || "Doctor"
}

export default function BookAppointmentPage() {
  const navigate = useNavigate()
  const { patientId, isLoading: profileLoading, error: profileError, refetch: refetchProfile } = usePatientScope()
  const { data: doctorsData } = useGetDoctorsQuery({})
  const doctors = doctorsData?.data?.doctors || []
  const [createAppointment, { isLoading }] = useCreateAppointmentMutation()
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    setError
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      doctorId: "",
      appointmentDate: new Date().toISOString().slice(0, 10),
      slotTime: "",
      type: "booked",
      chiefComplaint: ""
    }
  })
  const doctorId = watch("doctorId")
  const appointmentDate = watch("appointmentDate")
  const { data: availabilityData, isFetching: isFetchingAvailability, error: availabilityError } = useGetDoctorAvailabilityQuery(
    { doctorId, date: appointmentDate },
    { skip: !doctorId || !appointmentDate }
  )
  const availableSlots = availabilityData?.data?.availableSlots || []
  const onSubmit = async (values) => {
    if (!patientId) return
    try {
      const res = await createAppointment({
        doctorId: values.doctorId,
        appointmentDate: values.appointmentDate,
        slotTime: values.slotTime,
        type: values.type || undefined,
        chiefComplaint: values.chiefComplaint || undefined
      }).unwrap()
      toast.success(res?.message || "Appointment booked")
      const id = res?.data?.appointment?.id
      navigate(id ? `${PATIENT_ROUTES.APPOINTMENTS}/${id}` : PATIENT_ROUTES.APPOINTMENTS)
    } catch (err) {
      setError("root", { message: parseApiError(err?.data || err) })
    }
  }
  if (profileLoading) return <PageLoader />
  if (profileError) return <ErrorState error={profileError?.data || profileError} onRetry={refetchProfile} />
  if (!patientId) {
    return <ErrorState title="Patient profile not found" description="Your account is not linked to a patient profile." />
  }
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Book appointment</h1>
          <p className="text-sm text-slate-600">Choose a doctor and available time slot.</p>
        </div>
        <Button variant="secondary" as={Link} to={PATIENT_ROUTES.APPOINTMENTS}>
          Back
        </Button>
      </div>
      <Card className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {errors.root?.message && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{errors.root.message}</div>}
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Doctor" htmlFor="doctorId" error={errors.doctorId?.message}>
              <Select
                id="doctorId"
                {...register("doctorId")}
                error={Boolean(errors.doctorId)}
                options={[{ value: "", label: "Select..." }, ...doctors.map((d) => ({ value: d.id, label: toDoctorLabel(d) }))]}
              />
            </FormField>
            <FormField label="Visit type" htmlFor="type" error={errors.type?.message}>
              <Select
                id="type"
                {...register("type")}
                error={Boolean(errors.type)}
                options={[
                  { value: "booked", label: "New visit" },
                  { value: "follow_up", label: "Follow-up" }
                ]}
              />
            </FormField>
            <FormField label="Date" htmlFor="appointmentDate" error={errors.appointmentDate?.message}>
              <Input id="appointmentDate" type="date" {...register("appointmentDate")} error={Boolean(errors.appointmentDate)} />
            </FormField>
            <FormField
              label="Time slot"
              htmlFor="slotTime"
              error={errors.slotTime?.message}
              hint={isFetchingAvailability ? "Loading availability..." : `${availableSlots.length} slots available`}
            >
              {availableSlots.length > 0 ? (
                <Select
                  id="slotTime"
                  {...register("slotTime")}
                  error={Boolean(errors.slotTime)}
                  options={[{ value: "", label: "Select..." }, ...availableSlots.map((t) => ({ value: t, label: String(t).slice(0, 5) }))]}
                />
              ) : (
                <Input id="slotTime" placeholder="09:30" {...register("slotTime")} error={Boolean(errors.slotTime)} />
              )}
            </FormField>
            <FormField label="Chief complaint" htmlFor="chiefComplaint" error={errors.chiefComplaint?.message} className="md:col-span-2">
              <Input id="chiefComplaint" {...register("chiefComplaint")} placeholder="Brief reason for visit" error={Boolean(errors.chiefComplaint)} />
            </FormField>
          </div>
          {availabilityError && (
            <div className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
              Could not load availability. Pick a time from the doctor schedule or try another date.
            </div>
          )}
          <div className="flex justify-end">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Booking..." : "Book appointment"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
