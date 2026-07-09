import { useMemo, useState } from "react"
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
import { useGetPrescriptionsQuery, useCreatePrescriptionMutation } from "@/api/prescriptions.api"
import { useGetLabOrdersQuery, useCreateLabOrderMutation } from "@/api/lab.api"
import PrescriptionItemsForm, { serializePrescriptionItems, EMPTY_PRESCRIPTION_ITEM } from "@/components/domain/PrescriptionItemsForm"
import LabTestPicker from "@/components/domain/LabTestPicker"
import PageLoader from "@/components/feedback/PageLoader"
import ErrorState from "@/components/ui/ErrorState"
import Card from "@/components/ui/Card"
import Button from "@/components/ui/Button"
import Input from "@/components/ui/Input"
import Select from "@/components/ui/Select"
import FormField from "@/components/forms/FormField"
import StatusBadge from "@/components/data-display/StatusBadge"
import { DOCTOR_ROUTES } from "@/constants/routes"
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

function formatDate(value) {
  return String(value || "").replace("T", " ").slice(0, 16) || "-"
}

export default function ConsultationEditorPage() {
  const { id } = useParams()
  const { data, isLoading, error, refetch } = useGetConsultationQuery(id, { skip: !id })
  const consultation = data?.data?.consultation

  const { data: rxData, refetch: refetchRx } = useGetPrescriptionsQuery(
    { consultationId: id, limit: 50 },
    { skip: !id }
  )
  const { data: labData, refetch: refetchLab } = useGetLabOrdersQuery(
    { consultationId: id, limit: 50 },
    { skip: !id }
  )

  const [updateConsultation, { isLoading: isSaving }] = useUpdateConsultationMutation()
  const [completeConsultation, { isLoading: isCompleting }] = useCompleteConsultationMutation()
  const [createPrescription, { isLoading: isCreatingRx }] = useCreatePrescriptionMutation()
  const [createLabOrder, { isLoading: isCreatingLab }] = useCreateLabOrderMutation()

  const [rxItems, setRxItems] = useState([{ ...EMPTY_PRESCRIPTION_ITEM }])
  const [rxNotes, setRxNotes] = useState("")
  const [rxError, setRxError] = useState("")
  const [selectedTestIds, setSelectedTestIds] = useState([])
  const [labPriority, setLabPriority] = useState("routine")
  const [labError, setLabError] = useState("")

  const prescriptions = rxData?.data?.prescriptions || []
  const labOrders = labData?.data?.orders || []

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
      setError("root", { message })
    }
  }

  const onComplete = async () => {
    if (!id) return
    try {
      const res = await completeConsultation(id).unwrap()
      toast.success(res?.message || "Completed")
      refetch()
    } catch (e) {
      toast.error(parseApiError(e?.data || e))
    }
  }

  const onCreatePrescription = async () => {
    if (!id || locked) return
    setRxError("")
    const serialized = serializePrescriptionItems(rxItems)
    if (serialized.length === 0) {
      setRxError("Add at least one medicine with a name.")
      return
    }
    try {
      const res = await createPrescription({
        consultationId: id,
        notes: rxNotes.trim() || undefined,
        items: serialized
      }).unwrap()
      const warnings = res?.data?.drugInteractionWarnings
      const warningCount = warnings?.warnings?.length || 0
      if (warningCount > 0 || warnings?.allergyAlerts?.length) {
        toast.warning("Drug interaction or allergy warnings recorded.")
      }
      toast.success(res?.message || "Prescription created")
      setRxItems([{ ...EMPTY_PRESCRIPTION_ITEM }])
      setRxNotes("")
      refetchRx()
    } catch (e) {
      setRxError(parseApiError(e?.data || e))
    }
  }

  const onCreateLabOrder = async () => {
    if (!id || locked) return
    setLabError("")
    if (selectedTestIds.length === 0) {
      setLabError("Select at least one lab test.")
      return
    }
    try {
      const res = await createLabOrder({
        consultationId: id,
        testIds: selectedTestIds,
        priority: labPriority
      }).unwrap()
      toast.success(res?.message || "Lab order created")
      setSelectedTestIds([])
      setLabPriority("routine")
      refetchLab()
    } catch (e) {
      setLabError(parseApiError(e?.data || e))
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
          <Button variant="secondary" as={Link} to={DOCTOR_ROUTES.CONSULTATIONS}>
            Back
          </Button>
          <Button variant="secondary" disabled={isCompleting || locked} onClick={onComplete}>
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
      <Card className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-slate-900">Prescriptions</h2>
          <Button variant="secondary" size="sm" as={Link} to={`${DOCTOR_ROUTES.PRESCRIPTIONS}/new?consultationId=${id}`}>
            Open full form
          </Button>
        </div>
        {prescriptions.length > 0 && (
          <div className="mt-4 space-y-2">
            {prescriptions.map((rx) => (
              <div key={rx.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-900">{formatDate(rx.created_at)}</p>
                  <StatusBadge status={rx.status} />
                </div>
                <Button variant="secondary" size="sm" as={Link} to={`${DOCTOR_ROUTES.PRESCRIPTIONS}/${rx.id}`}>
                  View
                </Button>
              </div>
            ))}
          </div>
        )}
        {!locked && (
          <div className="mt-4 space-y-4 border-t border-slate-100 pt-4">
            {rxError && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{rxError}</div>}
            <FormField label="Pharmacy notes" htmlFor="rxNotes">
              <Input id="rxNotes" value={rxNotes} onChange={(e) => setRxNotes(e.target.value)} placeholder="Optional" />
            </FormField>
            <PrescriptionItemsForm value={rxItems} onChange={setRxItems} disabled={locked} />
            <div className="flex justify-end">
              <Button onClick={onCreatePrescription} disabled={isCreatingRx}>
                {isCreatingRx ? "Creating..." : "Create prescription"}
              </Button>
            </div>
          </div>
        )}
      </Card>
      <Card className="p-6">
        <h2 className="text-sm font-semibold text-slate-900">Lab orders</h2>
        {labOrders.length > 0 && (
          <div className="mt-4 space-y-2">
            {labOrders.map((order) => (
              <div key={order.id} className="rounded-lg border border-slate-200 px-4 py-3">
                <p className="text-sm font-medium text-slate-900">{formatDate(order.ordered_at || order.created_at)}</p>
                <div className="mt-1 flex items-center gap-2">
                  <StatusBadge status={order.status} />
                  {order.priority && order.priority !== "routine" && (
                    <span className="text-xs capitalize text-slate-600">{order.priority}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        {!locked && (
          <div className="mt-4 space-y-4 border-t border-slate-100 pt-4">
            {labError && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{labError}</div>}
            <LabTestPicker
              selectedTestIds={selectedTestIds}
              onChange={setSelectedTestIds}
              priority={labPriority}
              onPriorityChange={setLabPriority}
              disabled={locked}
            />
            <div className="flex justify-end">
              <Button onClick={onCreateLabOrder} disabled={isCreatingLab}>
                {isCreatingLab ? "Ordering..." : "Order tests"}
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
