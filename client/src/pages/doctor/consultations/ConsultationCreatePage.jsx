import { useMemo } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { useCreateConsultationMutation } from "@/api/consultations.api"
import Button from "@/components/ui/Button"
import Input from "@/components/ui/Input"
import FormField from "@/components/forms/FormField"
import { parseApiError } from "@/utils/parseApiError"

const schema = z.object({
  appointmentId: z.string().uuid("Appointment ID is required")
})

function useQueryParam(name) {
  const { search } = useLocation()
  return useMemo(() => new URLSearchParams(search).get(name), [search, name])
}

export default function ConsultationCreatePage() {
  const navigate = useNavigate()
  const presetAppointmentId = useQueryParam("appointmentId") || ""
  const [createConsultation, { isLoading }] = useCreateConsultationMutation()

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { appointmentId: presetAppointmentId }
  })

  const onSubmit = async (values) => {
    try {
      const res = await createConsultation({ appointmentId: values.appointmentId }).unwrap()
      const consultationId = res?.data?.consultation?.id
      toast.success(res?.message || "Consultation opened")
      navigate(consultationId ? `/doctor/consultations/${consultationId}` : "/doctor/consultations")
    } catch (e) {
      const message = parseApiError(e?.data || e)
      console.error("createConsultation failed", { appointmentId: values?.appointmentId, error: e })
      setError("root", { message })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-semibold text-slate-900">Open Consultation</h1>
        <Button variant="secondary" as={Link} to="/doctor/consultations">
          Back
        </Button>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {errors.root?.message && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{errors.root.message}</div>}
          <FormField label="Appointment ID" htmlFor="appointmentId" error={errors.appointmentId?.message}>
            <Input id="appointmentId" placeholder="UUID" {...register("appointmentId")} error={Boolean(errors.appointmentId)} />
          </FormField>
          <div className="flex justify-end">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Opening..." : "Open"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
