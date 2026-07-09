import { useMemo } from "react"
import { Plus, Trash2 } from "lucide-react"
import { useGetMedicinesQuery } from "@/api/medicines.api"
import Button from "@/components/ui/Button"
import Input from "@/components/ui/Input"
import FormField from "@/components/forms/FormField"
import SearchInput from "@/components/forms/SearchInput"

export const EMPTY_PRESCRIPTION_ITEM = {
  medicineName: "",
  genericName: "",
  dosage: "",
  frequency: "",
  duration: "",
  instructions: "",
  quantity: ""
}

function normalizeItem(item) {
  return {
    medicineName: item?.medicineName || "",
    genericName: item?.genericName || "",
    dosage: item?.dosage || "",
    frequency: item?.frequency || "",
    duration: item?.duration || "",
    instructions: item?.instructions || "",
    quantity: item?.quantity ?? ""
  }
}

function PrescriptionItemRow({ index, item, onChange, onRemove, onSelectMedicine, disabled, canRemove, error }) {
  const searchTerm = item.medicineName || ""
  const { data, isFetching } = useGetMedicinesQuery(
    { search: searchTerm.trim() || undefined, limit: 10 },
    { skip: !searchTerm.trim() || disabled }
  )
  const medicines = data?.data?.medicines || []
  const showSuggestions = searchTerm.trim().length > 0 && medicines.length > 0 && !disabled

  const update = (field, value) => {
    onChange(index, { ...item, [field]: value })
  }

  return (
    <div className="rounded-lg border border-slate-200 p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-slate-900">Medicine {index + 1}</p>
        {canRemove && !disabled && (
          <Button type="button" variant="ghost" size="sm" onClick={() => onRemove(index)} aria-label="Remove medicine">
            <Trash2 className="h-4 w-4 text-red-600" />
          </Button>
        )}
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <FormField label="Medicine name" htmlFor={`rx-name-${index}`} error={error?.medicineName}>
          <div className="relative">
            <SearchInput
              id={`rx-name-${index}`}
              value={item.medicineName}
              onChange={(e) => update("medicineName", e.target.value)}
              placeholder="Search brand or generic name"
              disabled={disabled}
            />
            {isFetching && <p className="mt-1 text-xs text-slate-500">Searching inventory…</p>}
            {showSuggestions && (
              <ul className="absolute z-10 mt-1 max-h-40 w-full overflow-auto rounded-lg border border-slate-200 bg-white shadow-sm">
                {medicines.map((med) => (
                  <li key={med.id}>
                    <button
                      type="button"
                      className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50"
                      onClick={() => onSelectMedicine(index, med)}
                    >
                      <span className="font-medium text-slate-900">{med.name}</span>
                      {med.generic_name && <span className="text-slate-600"> — {med.generic_name}</span>}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </FormField>
        <FormField label="Generic name" htmlFor={`rx-generic-${index}`}>
          <Input
            id={`rx-generic-${index}`}
            value={item.genericName}
            onChange={(e) => update("genericName", e.target.value)}
            disabled={disabled}
          />
        </FormField>
        <FormField label="Dosage" htmlFor={`rx-dosage-${index}`}>
          <Input
            id={`rx-dosage-${index}`}
            value={item.dosage}
            onChange={(e) => update("dosage", e.target.value)}
            placeholder="e.g. 500mg"
            disabled={disabled}
          />
        </FormField>
        <FormField label="Frequency" htmlFor={`rx-frequency-${index}`}>
          <Input
            id={`rx-frequency-${index}`}
            value={item.frequency}
            onChange={(e) => update("frequency", e.target.value)}
            placeholder="e.g. Twice daily"
            disabled={disabled}
          />
        </FormField>
        <FormField label="Duration" htmlFor={`rx-duration-${index}`}>
          <Input
            id={`rx-duration-${index}`}
            value={item.duration}
            onChange={(e) => update("duration", e.target.value)}
            placeholder="e.g. 7 days"
            disabled={disabled}
          />
        </FormField>
        <FormField label="Quantity" htmlFor={`rx-qty-${index}`} error={error?.quantity}>
          <Input
            id={`rx-qty-${index}`}
            inputMode="numeric"
            min={1}
            value={item.quantity}
            onChange={(e) => update("quantity", e.target.value)}
            disabled={disabled}
          />
        </FormField>
        <FormField label="Instructions" htmlFor={`rx-instructions-${index}`} className="md:col-span-2">
          <Input
            id={`rx-instructions-${index}`}
            value={item.instructions}
            onChange={(e) => update("instructions", e.target.value)}
            placeholder="e.g. After meals"
            disabled={disabled}
          />
        </FormField>
      </div>
    </div>
  )
}

export function PrescriptionItemsForm({ value = [], onChange, errors = [], disabled = false }) {
  const items = useMemo(() => (value.length ? value.map(normalizeItem) : [normalizeItem(EMPTY_PRESCRIPTION_ITEM)]), [value])

  const emit = (next) => {
    onChange?.(next)
  }

  const handleChange = (index, nextItem) => {
    const next = items.map((row, i) => (i === index ? nextItem : row))
    emit(next)
  }

  const handleRemove = (index) => {
    const next = items.filter((_, i) => i !== index)
    emit(next.length ? next : [normalizeItem(EMPTY_PRESCRIPTION_ITEM)])
  }

  const handleAdd = () => {
    emit([...items, normalizeItem(EMPTY_PRESCRIPTION_ITEM)])
  }

  const handleSelectMedicine = (index, med) => {
    handleChange(index, {
      ...items[index],
      medicineName: med.name || "",
      genericName: med.generic_name || ""
    })
  }

  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <PrescriptionItemRow
          key={index}
          index={index}
          item={item}
          onChange={handleChange}
          onRemove={handleRemove}
          onSelectMedicine={handleSelectMedicine}
          disabled={disabled}
          canRemove={items.length > 1}
          error={errors[index]}
        />
      ))}
      {!disabled && (
        <Button type="button" variant="secondary" size="sm" onClick={handleAdd}>
          <Plus className="mr-1 h-4 w-4" />
          Add medicine
        </Button>
      )}
    </div>
  )
}

export function serializePrescriptionItems(items) {
  return items
    .map((item) => ({
      medicineName: String(item.medicineName || "").trim(),
      genericName: String(item.genericName || "").trim() || undefined,
      dosage: String(item.dosage || "").trim() || undefined,
      frequency: String(item.frequency || "").trim() || undefined,
      duration: String(item.duration || "").trim() || undefined,
      instructions: String(item.instructions || "").trim() || undefined,
      quantity: item.quantity === "" || item.quantity == null ? undefined : Number(item.quantity)
    }))
    .filter((item) => item.medicineName)
}

export default PrescriptionItemsForm
