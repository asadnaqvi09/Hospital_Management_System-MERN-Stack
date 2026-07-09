import { useMemo } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { useGetPatientQuery, useRecordPatientVitalsMutation } from "@/api/patients.api"
import PageLoader from "@/components/feedback/PageLoader"
import ErrorState from "@/components/ui/ErrorState"
import Card from "@/components/ui/Card"
import Button from "@/components/ui/Button"
import Input from "@/components/ui/Input"
import FormField from "@/components/forms/FormField"
import { parseApiError } from "@/utils/parseApiError"

function useQueryParam(name) {
  const { search } = useLocation()
  return useMemo(() => new URLSearchParams(search).get(name), [search, name])
}

const schema = z.object({
  appointmentId: z.string().uuid().optional().or(z.literal("")),
  bpSystolic: z.coerce.number().int().min(0).max(400).optional(),
  bpDiastolic: z.coerce.number().int().min(0).max(300).optional(),
  heartRate: z.coerce.number().int().min(0).max(400).optional(),
  temperature: z.coerce.number().min(20).max(45).optional(),
  weightKg: z.coerce.number().min(0).max(500).optional(),
  heightCm: z.coerce.number().min(0).max(300).optional(),
  spo2: z.coerce.number().int().min(0).max(100).optional(),
  notes: z.string().optional().or(z.literal(""))
})

export default function RecordVitalsPage() {
  const navigate = useNavigate()
  const patientId = useQueryParam("patientId") || ""
  const appointmentId = useQueryParam("appointmentId") || ""

  const { data, isLoading, error, refetch } = useGetPatientQuery(patientId, { skip: !patientId })
  const patient = data?.data?.patient

  const [recordVitals, { isLoading: isSaving }] = useRecordPatientVitalsMutation()

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      appointmentId,
      bpSystolic: "",
      bpDiastolic: "",
      heartRate: "",
      temperature: "",
      weightKg: "",
      heightCm: "",
      spo2: "",
      notes: ""
    }
  })

  const onSubmit = async (values) => {
    if (!patientId) return
    try {
      const payload = {
        patientId,
        appointmentId: values.appointmentId || undefined,
        bpSystolic: values.bpSystolic,
        bpDiastolic: values.bpDiastolic,
        heartRate: values.heartRate,
        temperature: values.temperature,
        weightKg: values.weightKg,
        heightCm: values.heightCm,
        spo2: values.spo2,
        notes: values.notes || undefined
      }
      const res = await recordVitals(payload).unwrap()
      toast.success(res?.message || "Vitals recorded")
      navigate(`/nurse/vitals/history?patientId=${patientId}`)
    } catch (e) {
      const message = parseApiError(e?.data || e)
      console.error("recordPatientVitals failed", { patientId, error: e })
      setError("root", { message })
    }
  }

  if (!patientId) return <ErrorState title="Patient is required" description="Open this page from the queue or patient profile." />
  if (isLoading) return <PageLoader />
  if (error) return <ErrorState error={error?.data || error} onRetry={refetch} />

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Record Vitals</h1>
          <p className="text-sm text-slate-600">
            {patient?.full_name || patient?.fullName || "Patient"} • MRN {patient?.mrn || "-"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" as={Link} to="/nurse/queue">
            Back
          </Button>
          <Button variant="secondary" as={Link} to={`/nurse/vitals/history?patientId=${patientId}`}>
            History
          </Button>
        </div>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {errors.root?.message && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{errors.root.message}</div>}
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Appointment ID (optional)" htmlFor="appointmentId" error={errors.appointmentId?.message}>
              <Input id="appointmentId" {...register("appointmentId")} error={Boolean(errors.appointmentId)} />
            </FormField>
            <div />
            <FormField label="BP systolic" htmlFor="bpSystolic" error={errors.bpSystolic?.message}>
              <Input id="bpSystolic" inputMode="numeric" {...register("bpSystolic")} error={Boolean(errors.bpSystolic)} />
            </FormField>
            <FormField label="BP diastolic" htmlFor="bpDiastolic" error={errors.bpDiastolic?.message}>
              <Input id="bpDiastolic" inputMode="numeric" {...register("bpDiastolic")} error={Boolean(errors.bpDiastolic)} />
            </FormField>
            <FormField label="Heart rate" htmlFor="heartRate" error={errors.heartRate?.message}>
              <Input id="heartRate" inputMode="numeric" {...register("heartRate")} error={Boolean(errors.heartRate)} />
            </FormField>
            <FormField label="SpO2" htmlFor="spo2" error={errors.spo2?.message}>
              <Input id="spo2" inputMode="numeric" {...register("spo2")} error={Boolean(errors.spo2)} />
            </FormField>
            <FormField label="Temperature (°C)" htmlFor="temperature" error={errors.temperature?.message}>
              <Input id="temperature" inputMode="decimal" {...register("temperature")} error={Boolean(errors.temperature)} />
            </FormField>
            <FormField label="Weight (kg)" htmlFor="weightKg" error={errors.weightKg?.message}>
              <Input id="weightKg" inputMode="decimal" {...register("weightKg")} error={Boolean(errors.weightKg)} />
            </FormField>
            <FormField label="Height (cm)" htmlFor="heightCm" error={errors.heightCm?.message}>
              <Input id="heightCm" inputMode="decimal" {...register("heightCm")} error={Boolean(errors.heightCm)} />
            </FormField>
            <FormField label="Notes" htmlFor="notes" className="md:col-span-2" error={errors.notes?.message}>
              <Input id="notes" {...register("notes")} error={Boolean(errors.notes)} />
            </FormField>
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
