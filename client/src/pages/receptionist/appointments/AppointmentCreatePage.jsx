import { useEffect, useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { useCreateAppointmentMutation } from "@/api/appointments.api"
import { useGetDoctorsQuery, useGetDoctorAvailabilityQuery } from "@/api/doctors.api"
import { useGetPatientsQuery } from "@/api/patients.api"
import Button from "@/components/ui/Button"
import Input from "@/components/ui/Input"
import Select from "@/components/ui/Select"
import FormField from "@/components/forms/FormField"
import { parseApiError } from "@/utils/parseApiError"
export default function AppointmentCreatePage() {
  return <CreateAppointment />
}
const schema = z.object({
  patientId: z.string().uuid("Select a patient"),
  doctorId: z.string().uuid("Select a doctor"),
  appointmentDate: z.string().min(1, "Select a date"),
  slotTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/, "Time must be HH:MM or HH:MM:SS"),
  type: z.enum(["booked", "walk_in", "follow_up", "emergency"]).optional().or(z.literal("")),
  chiefComplaint: z.string().optional().or(z.literal(""))
})
function useQueryParam(name) {
  const { search } = useLocation()
  return useMemo(() => new URLSearchParams(search).get(name), [search, name])
}
function toPatientLabel(p) {
  const name = p?.full_name || p?.fullName || "Patient"
  const mrn = p?.mrn ? ` • MRN ${p.mrn}` : ""
  return `${name}${mrn}`
}
function toDoctorLabel(d) {
  return d?.full_name || d?.fullName || d?.email || "Doctor"
}
function CreateAppointment() {
  const navigate = useNavigate()
  const presetPatientId = useQueryParam("patientId") || ""
  const [patientSearch, setPatientSearch] = useState("")
  const { data: patientsData } = useGetPatientsQuery({ search: patientSearch || undefined, page: 1, limit: 20 })
  const patients = patientsData?.data?.patients || []
  const { data: doctorsData } = useGetDoctorsQuery({})
  const doctors = doctorsData?.data?.doctors || []
  const [createAppointment, { isLoading }] = useCreateAppointmentMutation()
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    setError
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      patientId: presetPatientId,
      doctorId: "",
      appointmentDate: new Date().toISOString().slice(0, 10),
      slotTime: "",
      type: "booked",
      chiefComplaint: ""
    }
  })
  const doctorId = watch("doctorId")
  const appointmentDate = watch("appointmentDate")
  const type = watch("type")
  const needsAvailability = doctorId && appointmentDate && !["walk_in", "emergency"].includes(type)
  const { data: availabilityData, isFetching: isFetchingAvailability, error: availabilityError } = useGetDoctorAvailabilityQuery(
    { doctorId, date: appointmentDate },
    { skip: !needsAvailability }
  )
  const availableSlots = availabilityData?.data?.availableSlots || []
  useEffect(() => {
    if (presetPatientId) setValue("patientId", presetPatientId)
  }, [presetPatientId, setValue])
  const onSubmit = async (values) => {
    try {
      const payload = {
        patientId: values.patientId,
        doctorId: values.doctorId,
        appointmentDate: values.appointmentDate,
        slotTime: values.slotTime,
        type: values.type || undefined,
        chiefComplaint: values.chiefComplaint || undefined
      }
      const res = await createAppointment(payload).unwrap()
      toast.success(res?.message || "Appointment booked")
      const id = res?.data?.appointment?.id
      navigate(id ? `/reception/appointments/${id}` : "/reception/appointments")
    } catch (error) {
      const message = parseApiError(error?.data || error)
      console.error("createAppointment failed", { error })
      setError("root", { message })
    }
  }
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-semibold text-slate-900">Book Appointment</h1>
        <Button variant="secondary" as={Link} to="/reception/appointments">
          Back
        </Button>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {errors.root?.message && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{errors.root.message}</div>}
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Patient search" htmlFor="patientSearch" hint="Type a name/MRN to filter the list">
              <Input
                id="patientSearch"
                value={patientSearch}
                onChange={(e) => setPatientSearch(e.target.value)}
                placeholder="Search patients..."
              />
            </FormField>
            <FormField label="Patient" htmlFor="patientId" error={errors.patientId?.message}>
              <Select
                id="patientId"
                {...register("patientId")}
                error={Boolean(errors.patientId)}
                options={[{ value: "", label: "Select..." }, ...patients.map((p) => ({ value: p.id, label: toPatientLabel(p) }))]}
              />
            </FormField>
            <FormField label="Doctor" htmlFor="doctorId" error={errors.doctorId?.message}>
              <Select
                id="doctorId"
                {...register("doctorId")}
                error={Boolean(errors.doctorId)}
                options={[{ value: "", label: "Select..." }, ...doctors.map((d) => ({ value: d.id, label: toDoctorLabel(d) }))]}
              />
            </FormField>
            <FormField label="Type" htmlFor="type" error={errors.type?.message}>
              <Select
                id="type"
                {...register("type")}
                error={Boolean(errors.type)}
                options={[
                  { value: "booked", label: "Booked" },
                  { value: "follow_up", label: "Follow-up" },
                  { value: "walk_in", label: "Walk-in" },
                  { value: "emergency", label: "Emergency" }
                ]}
              />
            </FormField>
            <FormField label="Date" htmlFor="appointmentDate" error={errors.appointmentDate?.message}>
              <Input id="appointmentDate" type="date" {...register("appointmentDate")} error={Boolean(errors.appointmentDate)} />
            </FormField>
            <FormField
              label="Slot time"
              htmlFor="slotTime"
              error={errors.slotTime?.message}
              hint={needsAvailability ? (isFetchingAvailability ? "Loading availability..." : `${availableSlots.length} slots available`) : "Enter time in HH:MM"}
            >
              {needsAvailability && availableSlots.length > 0 ? (
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
            <FormField label="Chief complaint (optional)" htmlFor="chiefComplaint" error={errors.chiefComplaint?.message} className="md:col-span-2">
              <Input id="chiefComplaint" {...register("chiefComplaint")} error={Boolean(errors.chiefComplaint)} />
            </FormField>
          </div>
          {availabilityError && (
            <div className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
              Could not load availability. You can still enter a time manually.
            </div>
          )}
          <div className="flex justify-end">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Booking..." : "Book appointment"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
