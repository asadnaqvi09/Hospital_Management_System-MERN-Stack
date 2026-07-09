import { useMemo } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Link, useParams } from "react-router-dom"
import { toast } from "sonner"
import {
  useCompleteConsultationMutation,
  useGetConsultationQuery,
  useUpdateConsultationMutation
} from "@/api/consultations.api"
import PageLoader from "@/components/feedback/PageLoader"
import ErrorState from "@/components/ui/ErrorState"
import Card from "@/components/ui/Card"
import Button from "@/components/ui/Button"
import Input from "@/components/ui/Input"
import Select from "@/components/ui/Select"
import FormField from "@/components/forms/FormField"
import { parseApiError } from "@/utils/parseApiError"

const diagnosisSchema = z.object({
  icdCode: z.string().max(20).optional().or(z.literal("")),
  description: z.string().min(1, "Description is required"),
  type: z.enum(["primary", "secondary", "differential"]).optional().or(z.literal(""))
})

const schema = z.object({
  chiefComplaint: z.string().optional().or(z.literal("")),
  hopi: z.string().optional().or(z.literal("")),
  examination: z.string().optional().or(z.literal("")),
  diagnosisText: z.string().optional().or(z.literal("")),
  managementPlan: z.string().optional().or(z.literal("")),
  followUpDate: z.string().optional().or(z.literal("")).nullable(),
  diagnoses: z.array(diagnosisSchema).optional()
})

function normalize(payload) {
  const out = { ...payload }
  Object.keys(out).forEach((k) => {
    if (out[k] === "") out[k] = undefined
  })
  if (out.followUpDate === "") out.followUpDate = null
  if (Array.isArray(out.diagnoses)) {
    out.diagnoses = out.diagnoses
      .filter((d) => d && String(d.description || "").trim())
      .map((d) => ({
        icdCode: d.icdCode || undefined,
        description: d.description,
        type: d.type || undefined
      }))
  }
  return out
}

export default function ConsultationEditorPage() {
  const { id } = useParams()
  const { data, isLoading, error, refetch } = useGetConsultationQuery(id, { skip: !id })
  const consultation = data?.data?.consultation

  const [updateConsultation, { isLoading: isSaving }] = useUpdateConsultationMutation()
  const [completeConsultation, { isLoading: isCompleting }] = useCompleteConsultationMutation()

  const defaultValues = useMemo(() => {
    const c = consultation || {}
    return {
      chiefComplaint: c.chief_complaint || "",
      hopi: c.hopi || "",
      examination: c.examination || "",
      diagnosisText: c.diagnosis_text || "",
      managementPlan: c.management_plan || "",
      followUpDate: c.follow_up_date ?? "",
      diagnoses: (c.diagnoses || []).map((d) => ({
        icdCode: d.icd_code || "",
        description: d.description || "",
        type: d.type || "primary"
      }))
    }
  }, [consultation])

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    reset,
    setError
  } = useForm({
    resolver: zodResolver(schema),
    values: defaultValues
  })

  const { fields, append, remove } = useFieldArray({ control, name: "diagnoses" })

  const locked = Boolean(consultation?.is_locked)

  const onSubmit = async (values) => {
    if (!id) return
    try {
      const payload = normalize(values)
      const res = await updateConsultation({ id, ...payload }).unwrap()
      toast.success(res?.message || "Saved")
      const updated = res?.data?.consultation
      if (updated) {
        reset({
          chiefComplaint: updated.chief_complaint || "",
          hopi: updated.hopi || "",
          examination: updated.examination || "",
          diagnosisText: updated.diagnosis_text || "",
          managementPlan: updated.management_plan || "",
          followUpDate: updated.follow_up_date ?? "",
          diagnoses: (updated.diagnoses || []).map((d) => ({
            icdCode: d.icd_code || "",
            description: d.description || "",
            type: d.type || "primary"
          }))
        })
      }
    } catch (e) {
      const message = parseApiError(e?.data || e)
      console.error("updateConsultation failed", { consultationId: id, error: e })
      setError("root", { message })
    }
  }

  const onComplete = async () => {
    if (!id) return
    try {
      const res = await completeConsultation(id).unwrap()
      toast.success(res?.message || "Completed")
    } catch (e) {
      const message = parseApiError(e?.data || e)
      console.error("completeConsultation failed", { consultationId: id, error: e })
      toast.error(message)
    }
  }

  if (isLoading) return <PageLoader />
  if (error) return <ErrorState error={error?.data || error} onRetry={refetch} />
  if (!consultation) return <ErrorState title="Consultation not found" />

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Consultation</h1>
          <p className="text-sm text-slate-600">
            {consultation.patient_name || "Patient"} • MRN {consultation.patient_mrn || "-"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" as={Link} to="/doctor/consultations">
            Back
          </Button>
          <Button variant="secondary" disabled={isCompleting} onClick={onComplete}>
            {isCompleting ? "Completing..." : "Complete"}
          </Button>
        </div>
      </div>

      {locked && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          This consultation is locked and cannot be modified.
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {errors.root?.message && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{errors.root.message}</div>}
        <Card className="p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Chief complaint" htmlFor="chiefComplaint" className="md:col-span-2">
              <Input id="chiefComplaint" {...register("chiefComplaint")} disabled={locked} />
            </FormField>
            <FormField label="HOPI" htmlFor="hopi" className="md:col-span-2">
              <Input id="hopi" {...register("hopi")} disabled={locked} />
            </FormField>
            <FormField label="Examination" htmlFor="examination" className="md:col-span-2">
              <Input id="examination" {...register("examination")} disabled={locked} />
            </FormField>
            <FormField label="Diagnosis text" htmlFor="diagnosisText" className="md:col-span-2">
              <Input id="diagnosisText" {...register("diagnosisText")} disabled={locked} />
            </FormField>
            <FormField label="Management plan" htmlFor="managementPlan" className="md:col-span-2">
              <Input id="managementPlan" {...register("managementPlan")} disabled={locked} />
            </FormField>
            <FormField label="Follow-up date" htmlFor="followUpDate">
              <Input id="followUpDate" type="date" {...register("followUpDate")} disabled={locked} />
            </FormField>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-slate-900">Diagnoses</h2>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={locked}
              onClick={() => append({ icdCode: "", description: "", type: "primary" })}
            >
              Add
            </Button>
          </div>
          <div className="mt-4 space-y-3">
            {fields.length === 0 ? (
              <p className="text-sm text-slate-600">No diagnoses</p>
            ) : (
              fields.map((f, idx) => (
                <div key={f.id} className="rounded-lg border border-slate-200 bg-white p-4">
                  <div className="grid gap-3 md:grid-cols-6">
                    <FormField label="Type" htmlFor={`diagnoses.${idx}.type`} error={errors?.diagnoses?.[idx]?.type?.message}>
                      <Select
                        id={`diagnoses.${idx}.type`}
                        {...register(`diagnoses.${idx}.type`)}
                        options={[
                          { value: "primary", label: "Primary" },
                          { value: "secondary", label: "Secondary" },
                          { value: "differential", label: "Differential" }
                        ]}
                        disabled={locked}
                      />
                    </FormField>
                    <FormField label="ICD code" htmlFor={`diagnoses.${idx}.icdCode`} className="md:col-span-2" error={errors?.diagnoses?.[idx]?.icdCode?.message}>
                      <Input id={`diagnoses.${idx}.icdCode`} {...register(`diagnoses.${idx}.icdCode`)} disabled={locked} />
                    </FormField>
                    <FormField
                      label="Description"
                      htmlFor={`diagnoses.${idx}.description`}
                      className="md:col-span-3"
                      error={errors?.diagnoses?.[idx]?.description?.message}
                    >
                      <Input id={`diagnoses.${idx}.description`} {...register(`diagnoses.${idx}.description`)} disabled={locked} />
                    </FormField>
                  </div>
                  <div className="mt-3 flex justify-end">
                    <Button type="button" variant="danger" size="sm" disabled={locked} onClick={() => remove(idx)}>
                      Remove
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={locked || isSaving}>
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      </form>
    </div>
  )
}
