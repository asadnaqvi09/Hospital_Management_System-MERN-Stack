import { useMemo, useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { z } from "zod"
import { toast } from "sonner"
import { useCreatePrescriptionMutation } from "@/api/prescriptions.api"
import PrescriptionItemsForm, { serializePrescriptionItems, EMPTY_PRESCRIPTION_ITEM } from "@/components/domain/PrescriptionItemsForm"
import Button from "@/components/ui/Button"
import Input from "@/components/ui/Input"
import Card from "@/components/ui/Card"
import FormField from "@/components/forms/FormField"
import { DOCTOR_ROUTES } from "@/constants/routes"
import { parseApiError } from "@/utils/parseApiError"

const schema = z.object({
  consultationId: z.string().uuid("Consultation ID is required")
})

function useQueryParam(name) {
  const { search } = useLocation()
  return useMemo(() => new URLSearchParams(search).get(name), [search, name])
}

export default function PrescriptionCreatePage() {
  const navigate = useNavigate()
  const presetConsultationId = useQueryParam("consultationId") || ""
  const [consultationId, setConsultationId] = useState(presetConsultationId)
  const [notes, setNotes] = useState("")
  const [items, setItems] = useState([{ ...EMPTY_PRESCRIPTION_ITEM }])
  const [formError, setFormError] = useState("")
  const [createPrescription, { isLoading }] = useCreatePrescriptionMutation()

  const onSubmit = async (e) => {
    e.preventDefault()
    setFormError("")
    const idCheck = schema.safeParse({ consultationId })
    if (!idCheck.success) {
      setFormError(idCheck.error.errors[0]?.message || "Invalid consultation")
      return
    }
    const serialized = serializePrescriptionItems(items)
    if (serialized.length === 0) {
      setFormError("Add at least one medicine with a name.")
      return
    }
    try {
      const res = await createPrescription({
        consultationId,
        notes: notes.trim() || undefined,
        items: serialized
      }).unwrap()
      const warnings = res?.data?.drugInteractionWarnings
      const warningCount = warnings?.warnings?.length || 0
      if (warningCount > 0 || warnings?.allergyAlerts?.length) {
        toast.warning("Drug interaction or allergy warnings recorded — review before dispensing.")
      }
      toast.success(res?.message || "Prescription created")
      const prescriptionId = res?.data?.prescription?.id
      navigate(prescriptionId ? `${DOCTOR_ROUTES.PRESCRIPTIONS}/${prescriptionId}` : DOCTOR_ROUTES.PRESCRIPTIONS)
    } catch (err) {
      setFormError(parseApiError(err?.data || err))
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">New prescription</h1>
          <p className="text-sm text-slate-600">Issue medicines for a consultation.</p>
        </div>
        <Button variant="secondary" as={Link} to={DOCTOR_ROUTES.PRESCRIPTIONS}>
          Back
        </Button>
      </div>
      <form onSubmit={onSubmit} className="space-y-4">
        {formError && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</div>}
        <Card className="p-6 space-y-4">
          <FormField label="Consultation ID" htmlFor="consultationId">
            <Input
              id="consultationId"
              value={consultationId}
              onChange={(e) => setConsultationId(e.target.value)}
              placeholder="UUID from consultation"
              required
            />
          </FormField>
          <FormField label="Notes" htmlFor="notes">
            <textarea
              id="notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
              placeholder="Optional instructions for pharmacy"
            />
          </FormField>
        </Card>
        <Card className="p-6">
          <h2 className="mb-4 text-sm font-semibold text-slate-900">Medicines</h2>
          <PrescriptionItemsForm value={items} onChange={setItems} />
        </Card>
        <div className="flex justify-end">
          <Button type="submit" disabled={isLoading}>{isLoading ? "Creating..." : "Create prescription"}</Button>
        </div>
      </form>
    </div>
  )
}
