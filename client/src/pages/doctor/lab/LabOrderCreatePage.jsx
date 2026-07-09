import { useMemo, useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { z } from "zod"
import { toast } from "sonner"
import { useCreateLabOrderMutation } from "@/api/lab.api"
import { useGetConsultationsQuery } from "@/api/consultations.api"
import LabTestPicker from "@/components/domain/LabTestPicker"
import PageLoader from "@/components/feedback/PageLoader"
import ErrorState from "@/components/ui/ErrorState"
import Button from "@/components/ui/Button"
import Card from "@/components/ui/Card"
import Select from "@/components/ui/Select"
import FormField from "@/components/forms/FormField"
import { DOCTOR_ROUTES } from "@/constants/routes"
import { parseApiError } from "@/utils/parseApiError"

function useQueryParam(name) {
  const { search } = useLocation()
  return useMemo(() => new URLSearchParams(search).get(name), [search, name])
}

function formatConsultationLabel(c) {
  const patient = c.patient_name || "Patient"
  const mrn = c.patient_mrn ? ` • MRN ${c.patient_mrn}` : ""
  const date = c.created_at ? String(c.created_at).slice(0, 10) : ""
  return `${patient}${mrn}${date ? ` • ${date}` : ""}`
}

export default function LabOrderCreatePage() {
  const navigate = useNavigate()
  const presetConsultationId = useQueryParam("consultationId") || ""
  const [consultationId, setConsultationId] = useState(presetConsultationId)
  const [selectedTestIds, setSelectedTestIds] = useState([])
  const [priority, setPriority] = useState("routine")
  const [formError, setFormError] = useState("")
  const [createLabOrder, { isLoading }] = useCreateLabOrderMutation()
  const { data, isLoading: isLoadingConsultations, error } = useGetConsultationsQuery({ page: 1, limit: 50 })
  const consultations = data?.data?.consultations || []
  const consultationOptions = useMemo(
    () => [
      { value: "", label: "Select consultation" },
      ...consultations.map((c) => ({ value: c.id, label: formatConsultationLabel(c) }))
    ],
    [consultations]
  )

  const onSubmit = async (e) => {
    e.preventDefault()
    setFormError("")
    if (!z.string().uuid().safeParse(consultationId).success) {
      setFormError("Select a valid consultation.")
      return
    }
    if (selectedTestIds.length === 0) {
      setFormError("Select at least one lab test.")
      return
    }
    try {
      const res = await createLabOrder({ consultationId, testIds: selectedTestIds, priority }).unwrap()
      toast.success(res?.message || "Lab order created")
      navigate(DOCTOR_ROUTES.LAB)
    } catch (err) {
      setFormError(parseApiError(err?.data || err))
    }
  }

  if (isLoadingConsultations) return <PageLoader />
  if (error) return <ErrorState error={error?.data || error} />

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">New lab order</h1>
          <p className="text-sm text-slate-600">Order tests for a consultation.</p>
        </div>
        <Button variant="secondary" as={Link} to={DOCTOR_ROUTES.LAB}>
          Back
        </Button>
      </div>
      <form onSubmit={onSubmit} className="space-y-4">
        {formError && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</div>}
        <Card className="p-6">
          <FormField label="Consultation" htmlFor="consultationId">
            <Select
              id="consultationId"
              value={consultationId}
              onChange={(e) => setConsultationId(e.target.value)}
              options={consultationOptions}
            />
          </FormField>
        </Card>
        <Card className="p-6">
          <LabTestPicker
            selectedTestIds={selectedTestIds}
            onChange={setSelectedTestIds}
            priority={priority}
            onPriorityChange={setPriority}
          />
        </Card>
        <div className="flex justify-end">
          <Button type="submit" disabled={isLoading}>{isLoading ? "Ordering..." : "Order tests"}</Button>
        </div>
      </form>
    </div>
  )
}
