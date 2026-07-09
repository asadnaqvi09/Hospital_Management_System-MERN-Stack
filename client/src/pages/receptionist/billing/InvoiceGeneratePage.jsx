import { useEffect, useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Link, useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { useGenerateInvoiceMutation } from "@/api/billing.api"
import { useGetAdmissionsQuery } from "@/api/ipd.api"
import { useGetConsultationsQuery } from "@/api/consultations.api"
import { useGetPatientsQuery } from "@/api/patients.api"
import { RECEPTIONIST_ROUTES } from "@/constants/routes"
import Button from "@/components/ui/Button"
import Input from "@/components/ui/Input"
import Select from "@/components/ui/Select"
import FormField from "@/components/forms/FormField"
import Card from "@/components/ui/Card"
import { parseApiError } from "@/utils/parseApiError"

const schema = z
  .object({
    patientId: z.string().uuid("Select a patient"),
    consultationId: z.string().optional().or(z.literal("")),
    admissionId: z.string().optional().or(z.literal("")),
    discountAmount: z.coerce.number().min(0).optional(),
    discountReason: z.string().optional().or(z.literal("")),
    taxAmount: z.coerce.number().min(0).optional(),
    insuranceProvider: z.string().optional().or(z.literal("")),
    insurancePolicy: z.string().optional().or(z.literal("")),
    insuranceCovered: z.coerce.number().min(0).optional()
  })
  .refine((data) => data.consultationId || data.admissionId, {
    message: "Select a consultation or admission to bill",
    path: ["consultationId"]
  })

function toPatientLabel(p) {
  const name = p?.full_name || p?.fullName || "Patient"
  const mrn = p?.mrn ? ` • MRN ${p.mrn}` : ""
  return `${name}${mrn}`
}

function formatContextDate(value) {
  return value ? String(value).slice(0, 10) : ""
}

export default function InvoiceGeneratePage() {
  const navigate = useNavigate()
  const [patientSearch, setPatientSearch] = useState("")
  const [generateInvoice, { isLoading }] = useGenerateInvoiceMutation()
  const { data: patientsData } = useGetPatientsQuery({ search: patientSearch || undefined, page: 1, limit: 20 })
  const patients = patientsData?.data?.patients || []
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    setError
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      patientId: "",
      consultationId: "",
      admissionId: "",
      discountAmount: 0,
      discountReason: "",
      taxAmount: 0,
      insuranceProvider: "",
      insurancePolicy: "",
      insuranceCovered: 0
    }
  })
  const patientId = watch("patientId")
  const { data: consultationsData } = useGetConsultationsQuery(
    { patientId, page: 1, limit: 50 },
    { skip: !patientId }
  )
  const { data: admissionsData } = useGetAdmissionsQuery(
    { patientId, page: 1, limit: 50 },
    { skip: !patientId }
  )
  const consultations = consultationsData?.data?.consultations || []
  const admissions = admissionsData?.data?.admissions || []
  const consultationOptions = useMemo(
    () => [
      { value: "", label: "None" },
      ...consultations.map((c) => ({
        value: c.id,
        label: `Consultation • ${formatContextDate(c.created_at)} • ${c.chief_complaint || "No complaint"}`
      }))
    ],
    [consultations]
  )
  const admissionOptions = useMemo(
    () => [
      { value: "", label: "None" },
      ...admissions.map((a) => ({
        value: a.id,
        label: `Admission • ${a.ward || "-"} Room ${a.room_number || "-"} • ${a.status}`
      }))
    ],
    [admissions]
  )

  useEffect(() => {
    setValue("consultationId", "")
    setValue("admissionId", "")
  }, [patientId, setValue])

  const onSubmit = async (values) => {
    try {
      const payload = {
        patientId: values.patientId,
        consultationId: values.consultationId || undefined,
        admissionId: values.admissionId || undefined,
        discountAmount: values.discountAmount || undefined,
        discountReason: values.discountReason?.trim() || undefined,
        taxAmount: values.taxAmount || undefined,
        insuranceProvider: values.insuranceProvider?.trim() || undefined,
        insurancePolicy: values.insurancePolicy?.trim() || undefined,
        insuranceCovered: values.insuranceCovered || undefined
      }
      const res = await generateInvoice(payload).unwrap()
      toast.success(res?.message || "Invoice generated")
      const invoiceId = res?.data?.invoice?.id
      navigate(invoiceId ? `${RECEPTIONIST_ROUTES.BILLING}/${invoiceId}` : RECEPTIONIST_ROUTES.BILLING)
    } catch (e) {
      setError("root", { message: parseApiError(e?.data || e) })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Generate invoice</h1>
          <p className="text-sm text-slate-600">Auto-build line items from consultation, lab, pharmacy, and IPD charges.</p>
        </div>
        <Button variant="secondary" as={Link} to={RECEPTIONIST_ROUTES.BILLING}>
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
            <FormField label="Consultation" htmlFor="consultationId" error={errors.consultationId?.message}>
              <Select
                id="consultationId"
                {...register("consultationId")}
                options={consultationOptions}
                disabled={!patientId}
              />
            </FormField>
            <FormField label="Admission" htmlFor="admissionId">
              <Select
                id="admissionId"
                {...register("admissionId")}
                options={admissionOptions}
                disabled={!patientId}
              />
            </FormField>
            <FormField label="Discount amount" htmlFor="discountAmount">
              <Input id="discountAmount" type="number" min={0} step="0.01" {...register("discountAmount")} />
            </FormField>
            <FormField label="Discount reason" htmlFor="discountReason">
              <Input id="discountReason" {...register("discountReason")} />
            </FormField>
            <FormField label="Tax amount" htmlFor="taxAmount">
              <Input id="taxAmount" type="number" min={0} step="0.01" {...register("taxAmount")} />
            </FormField>
            <FormField label="Insurance covered" htmlFor="insuranceCovered">
              <Input id="insuranceCovered" type="number" min={0} step="0.01" {...register("insuranceCovered")} />
            </FormField>
            <FormField label="Insurance provider" htmlFor="insuranceProvider">
              <Input id="insuranceProvider" {...register("insuranceProvider")} />
            </FormField>
            <FormField label="Insurance policy" htmlFor="insurancePolicy">
              <Input id="insurancePolicy" {...register("insurancePolicy")} />
            </FormField>
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={isLoading}>{isLoading ? "Generating..." : "Generate invoice"}</Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
