import { useEffect, useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { useCreateAdmissionMutation, useGetRoomsQuery } from "@/api/ipd.api"
import { useGetDoctorsQuery } from "@/api/doctors.api"
import { useGetPatientsQuery } from "@/api/patients.api"
import { RECEPTIONIST_ROUTES } from "@/constants/routes"
import Button from "@/components/ui/Button"
import Input from "@/components/ui/Input"
import Select from "@/components/ui/Select"
import FormField from "@/components/forms/FormField"
import Card from "@/components/ui/Card"
import { parseApiError } from "@/utils/parseApiError"

const schema = z.object({
  patientId: z.string().uuid("Select a patient"),
  roomId: z.string().uuid("Select a room"),
  admittingDoctorId: z.string().uuid("Select a doctor"),
  expectedDays: z.coerce.number().int().min(1).max(365).optional(),
  admissionReason: z.string().optional().or(z.literal(""))
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

export default function AdmissionCreatePage() {
  const navigate = useNavigate()
  const presetPatientId = useQueryParam("patientId") || ""
  const [patientSearch, setPatientSearch] = useState("")
  const { data: patientsData } = useGetPatientsQuery({ search: patientSearch || undefined, page: 1, limit: 20 })
  const patients = patientsData?.data?.patients || []
  const { data: doctorsData } = useGetDoctorsQuery({})
  const doctors = doctorsData?.data?.doctors || []
  const { data: roomsData } = useGetRoomsQuery({ status: "available" })
  const rooms = (roomsData?.data?.rooms || []).filter((r) => (r.available_beds ?? 0) > 0)
  const [createAdmission, { isLoading }] = useCreateAdmissionMutation()
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
      roomId: "",
      admittingDoctorId: "",
      expectedDays: 1,
      admissionReason: ""
    }
  })
  const selectedRoomId = watch("roomId")
  const selectedRoom = rooms.find((r) => r.id === selectedRoomId)

  useEffect(() => {
    if (presetPatientId) setValue("patientId", presetPatientId)
  }, [presetPatientId, setValue])

  const onSubmit = async (values) => {
    const room = rooms.find((r) => r.id === values.roomId)
    if (!room) {
      setError("roomId", { message: "Selected room is no longer available" })
      return
    }
    try {
      const res = await createAdmission({
        patientId: values.patientId,
        roomId: values.roomId,
        roomVersion: room.version ?? 0,
        admittingDoctorId: values.admittingDoctorId,
        expectedDays: values.expectedDays || undefined,
        admissionReason: values.admissionReason?.trim() || undefined
      }).unwrap()
      toast.success(res?.message || "Patient admitted")
      navigate(RECEPTIONIST_ROUTES.IPD_ADMISSIONS)
    } catch (e) {
      const message = parseApiError(e?.data || e)
      setError("root", { message })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Admit patient</h1>
          <p className="text-sm text-slate-600">Assign a patient to an available bed.</p>
        </div>
        <Button variant="secondary" as={Link} to={RECEPTIONIST_ROUTES.IPD_ADMISSIONS}>
          Back
        </Button>
      </div>
      <Card className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {errors.root?.message && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{errors.root.message}</div>}
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Search patient" htmlFor="patientSearch">
              <Input
                id="patientSearch"
                value={patientSearch}
                onChange={(e) => setPatientSearch(e.target.value)}
                placeholder="Name or MRN"
              />
            </FormField>
            <FormField label="Patient" htmlFor="patientId" error={errors.patientId?.message}>
              <Select
                id="patientId"
                {...register("patientId")}
                error={Boolean(errors.patientId)}
                options={[
                  { value: "", label: "Select patient" },
                  ...patients.map((p) => ({ value: p.id, label: toPatientLabel(p) }))
                ]}
              />
            </FormField>
            <FormField label="Admitting doctor" htmlFor="admittingDoctorId" error={errors.admittingDoctorId?.message}>
              <Select
                id="admittingDoctorId"
                {...register("admittingDoctorId")}
                error={Boolean(errors.admittingDoctorId)}
                options={[
                  { value: "", label: "Select doctor" },
                  ...doctors.map((d) => ({ value: d.id, label: toDoctorLabel(d) }))
                ]}
              />
            </FormField>
            <FormField label="Room" htmlFor="roomId" error={errors.roomId?.message}>
              <Select
                id="roomId"
                {...register("roomId")}
                error={Boolean(errors.roomId)}
                options={[
                  { value: "", label: "Select room" },
                  ...rooms.map((r) => ({
                    value: r.id,
                    label: `${r.ward} • Room ${r.room_number} (${r.available_beds} bed(s) free)`
                  }))
                ]}
              />
            </FormField>
            <FormField label="Expected days" htmlFor="expectedDays" error={errors.expectedDays?.message}>
              <Input id="expectedDays" type="number" min={1} {...register("expectedDays")} />
            </FormField>
            <FormField label="Admission reason" htmlFor="admissionReason" className="md:col-span-2">
              <Input id="admissionReason" {...register("admissionReason")} placeholder="Optional" />
            </FormField>
          </div>
          {selectedRoom && (
            <p className="text-xs text-slate-600">
              Room version {selectedRoom.version} — if admission fails due to a bed conflict, refresh and try again.
            </p>
          )}
          <div className="flex justify-end">
            <Button type="submit" disabled={isLoading}>{isLoading ? "Admitting..." : "Admit patient"}</Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
