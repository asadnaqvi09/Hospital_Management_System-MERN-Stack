import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { toast } from "sonner"
import { useGetPrescriptionQuery, useDispensePrescriptionMutation } from "@/api/prescriptions.api"
import { useGetMedicinesQuery } from "@/api/medicines.api"
import { PRESCRIPTION_STATUS } from "@/constants/statuses"
import PageLoader from "@/components/feedback/PageLoader"
import ErrorState from "@/components/ui/ErrorState"
import Button from "@/components/ui/Button"
import Card from "@/components/ui/Card"
import Input from "@/components/ui/Input"
import Select from "@/components/ui/Select"
import FormField from "@/components/forms/FormField"
import StatusBadge from "@/components/data-display/StatusBadge"
import { parseApiError } from "@/utils/parseApiError"
function formatDate(value) {
  return String(value || "").replace("T", " ").slice(0, 16) || "-"
}
function getRemaining(item) {
  const ordered = item.quantity ?? 0
  const dispensed = item.dispensed_quantity ?? 0
  return Math.max(ordered - dispensed, 0)
}
function DispenseItemRow({ item, quantity, medicineId, onQuantityChange, onMedicineChange, disabled }) {
  const remaining = getRemaining(item)
  const { data } = useGetMedicinesQuery(
    { search: item.medicine_name, limit: 20 },
    { skip: !item.medicine_name }
  )
  const medicines = data?.data?.medicines || []
  const medicineOptions = useMemo(
    () => [
      { value: "", label: "Auto-match inventory" },
      ...medicines.map((m) => ({
        value: m.id,
        label: `${m.name}${m.generic_name ? ` (${m.generic_name})` : ""} — stock ${m.stock_quantity ?? 0}`
      }))
    ],
    [medicines]
  )
  return (
    <div className="rounded-lg border border-slate-200 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-medium text-slate-900">{item.medicine_name}</p>
          {item.generic_name && <p className="text-xs text-slate-600">{item.generic_name}</p>}
          <p className="mt-1 text-sm text-slate-700">
            {[item.dosage, item.frequency, item.duration].filter(Boolean).join(" • ") || "No dosage details"}
          </p>
          {item.instructions && <p className="mt-1 text-xs text-slate-600">{item.instructions}</p>}
        </div>
        <div className="text-right text-sm text-slate-700">
          <p>Ordered: {item.quantity ?? "-"}</p>
          <p>Dispensed: {item.dispensed_quantity ?? 0}</p>
          <p className="font-medium text-slate-900">Remaining: {remaining}</p>
        </div>
      </div>
      {remaining > 0 && !disabled && (
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <FormField label="Dispense quantity" htmlFor={`qty-${item.id}`}>
            <Input
              id={`qty-${item.id}`}
              inputMode="numeric"
              min={0}
              max={remaining}
              value={quantity}
              onChange={(e) => onQuantityChange(e.target.value)}
            />
          </FormField>
          <FormField label="Inventory medicine" htmlFor={`med-${item.id}`} hint="Override if auto-match is ambiguous">
            <Select
              id={`med-${item.id}`}
              value={medicineId}
              onChange={(e) => onMedicineChange(e.target.value)}
              options={medicineOptions}
            />
          </FormField>
        </div>
      )}
      {remaining === 0 && (
        <p className="mt-3 text-sm text-emerald-700">Fully dispensed</p>
      )}
    </div>
  )
}
export default function DispensePrescriptionPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data, isLoading, error, refetch } = useGetPrescriptionQuery(id, { skip: !id })
  const [dispense, { isLoading: isDispensing }] = useDispensePrescriptionMutation()
  const [quantities, setQuantities] = useState({})
  const [medicineIds, setMedicineIds] = useState({})
  const [notes, setNotes] = useState("")
  const prescription = data?.data?.prescription
  const items = prescription?.items || []
  const canDispense =
    prescription?.status === PRESCRIPTION_STATUS.PENDING ||
    prescription?.status === PRESCRIPTION_STATUS.PARTIALLY_DISPENSED
  useEffect(() => {
    if (!prescription?.items?.length) return
    const nextQty = {}
    const nextMed = {}
    for (const item of prescription.items) {
      nextQty[item.id] = String(getRemaining(item))
      nextMed[item.id] = item.medicine_id || ""
    }
    setQuantities(nextQty)
    setMedicineIds(nextMed)
  }, [prescription])
  const buildItems = () => {
    return items
      .map((item) => {
        const qty = Number(quantities[item.id] || 0)
        if (qty <= 0) return null
        const entry = { prescriptionItemId: item.id, quantity: qty }
        const medId = medicineIds[item.id]
        if (medId) entry.medicineId = medId
        return entry
      })
      .filter(Boolean)
  }
  const handleDispense = async (dispenseAll) => {
    try {
      const payload = dispenseAll
        ? { id, notes: notes || undefined }
        : { id, notes: notes || undefined, items: buildItems() }
      if (!dispenseAll && (!payload.items || payload.items.length === 0)) {
        toast.error("Enter a quantity for at least one item")
        return
      }
      const res = await dispense(payload).unwrap()
      toast.success(res?.message || "Prescription dispensed")
      navigate("/pharmacy/pending")
    } catch (err) {
      console.error("dispensePrescription", { id, error: err })
      toast.error(parseApiError(err?.data || err))
    }
  }
  if (isLoading) return <PageLoader />
  if (error) return <ErrorState error={error?.data || error} onRetry={refetch} />
  if (!prescription) return <ErrorState error="Prescription not found" onRetry={refetch} />
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Dispense prescription</h1>
          <p className="text-sm text-slate-600">Review items and record dispensing.</p>
        </div>
        <Button variant="secondary" as={Link} to="/pharmacy/pending">
          Back
        </Button>
      </div>
      <Card className="p-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Patient</p>
            <p className="mt-1 font-medium text-slate-900">{prescription.patient_name || "-"}</p>
            <p className="text-sm text-slate-600">MRN {prescription.patient_mrn || "-"}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Doctor</p>
            <p className="mt-1 text-sm text-slate-900">{prescription.doctor_name || "-"}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Created</p>
            <p className="mt-1 text-sm text-slate-900">{formatDate(prescription.created_at)}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Status</p>
            <div className="mt-1">
              <StatusBadge status={prescription.status} />
            </div>
          </div>
        </div>
        {prescription.notes && (
          <p className="mt-4 text-sm text-slate-700">
            <span className="font-medium text-slate-900">Notes: </span>
            {prescription.notes}
          </p>
        )}
      </Card>
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-900">Items</h2>
        {items.map((item) => (
          <DispenseItemRow
            key={item.id}
            item={item}
            quantity={quantities[item.id] ?? ""}
            medicineId={medicineIds[item.id] ?? ""}
            disabled={!canDispense}
            onQuantityChange={(value) => setQuantities((prev) => ({ ...prev, [item.id]: value }))}
            onMedicineChange={(value) => setMedicineIds((prev) => ({ ...prev, [item.id]: value }))}
          />
        ))}
      </div>
      {canDispense && (
        <Card className="p-4">
          <FormField label="Dispensing notes" htmlFor="notes">
            <textarea
              id="notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
            />
          </FormField>
          <div className="mt-4 flex flex-wrap justify-end gap-2">
            <Button variant="secondary" disabled={isDispensing} onClick={() => handleDispense(false)}>
              {isDispensing ? "Dispensing..." : "Dispense selected"}
            </Button>
            <Button disabled={isDispensing} onClick={() => handleDispense(true)}>
              {isDispensing ? "Dispensing..." : "Dispense all remaining"}
            </Button>
          </div>
        </Card>
      )}
      {!canDispense && (
        <Card className="p-4">
          <p className="text-sm text-slate-600">This prescription is not eligible for dispensing.</p>
        </Card>
      )}
    </div>
  )
}
