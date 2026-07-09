import { Plus, Trash2 } from "lucide-react"
import Button from "@/components/ui/Button"
import Input from "@/components/ui/Input"
import Select from "@/components/ui/Select"
import FormField from "@/components/forms/FormField"
import Table from "@/components/ui/Table"
import { formatCurrency } from "@/utils/formatCurrency"

export const EMPTY_INVOICE_ITEM = {
  description: "",
  category: "consultation",
  quantity: "1",
  unitPrice: ""
}

const CATEGORY_OPTIONS = [
  { value: "consultation", label: "Consultation" },
  { value: "medicine", label: "Medicine" },
  { value: "lab", label: "Lab" },
  { value: "room", label: "Room" },
  { value: "procedure", label: "Procedure" }
]

function lineTotal(quantity, unitPrice) {
  const qty = Number(quantity) || 0
  const price = Number(unitPrice) || 0
  return Math.round(qty * price * 100) / 100
}

function normalizeRow(row) {
  const qty = row?.quantity ?? 1
  const price = row?.unitPrice ?? row?.unit_price ?? ""
  return {
    description: row?.description || "",
    category: row?.category || "consultation",
    quantity: String(qty),
    unitPrice: price === "" || price == null ? "" : String(price)
  }
}

function toDisplayRow(row) {
  const normalized = normalizeRow(row)
  return {
    ...normalized,
    total: lineTotal(normalized.quantity, normalized.unitPrice)
  }
}

export function InvoiceItemsTable({ items = [], onChange, readOnly = false, errors = [] }) {
  const rows = items.length ? items.map(toDisplayRow) : readOnly ? [] : [toDisplayRow(EMPTY_INVOICE_ITEM)]
  const subtotal = rows.reduce((sum, row) => sum + row.total, 0)

  const emit = (nextRows) => {
    onChange?.(
      nextRows.map((row) => ({
        description: row.description,
        category: row.category,
        quantity: Number(row.quantity) || 1,
        unitPrice: Number(row.unitPrice) || 0
      }))
    )
  }

  const updateRow = (index, patch) => {
    const next = rows.map((row, i) => {
      if (i !== index) return row
      const merged = { ...row, ...patch }
      return { ...merged, total: lineTotal(merged.quantity, merged.unitPrice) }
    })
    emit(next)
  }

  const addRow = () => {
    emit([...rows, toDisplayRow(EMPTY_INVOICE_ITEM)])
  }

  const removeRow = (index) => {
    const next = rows.filter((_, i) => i !== index)
    emit(next.length ? next : [toDisplayRow(EMPTY_INVOICE_ITEM)])
  }

  if (readOnly && rows.length === 0) {
    return <p className="text-sm text-slate-600">No line items.</p>
  }

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <Table>
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-600">
            <tr>
              <th className="px-3 py-2 font-medium">Description</th>
              <th className="px-3 py-2 font-medium">Category</th>
              <th className="px-3 py-2 font-medium">Qty</th>
              <th className="px-3 py-2 font-medium">Unit price</th>
              <th className="px-3 py-2 font-medium text-right">Total</th>
              {!readOnly && <th className="px-3 py-2" />}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row, index) => (
              <tr key={index}>
                <td className="px-3 py-2 align-top">
                  {readOnly ? (
                    <span className="text-sm text-slate-900">{row.description || "—"}</span>
                  ) : (
                    <FormField error={errors[index]?.description}>
                      <Input
                        value={row.description}
                        onChange={(e) => updateRow(index, { description: e.target.value })}
                        placeholder="Service description"
                        error={Boolean(errors[index]?.description)}
                      />
                    </FormField>
                  )}
                </td>
                <td className="px-3 py-2 align-top">
                  {readOnly ? (
                    <span className="text-sm capitalize text-slate-800">{row.category || "—"}</span>
                  ) : (
                    <Select
                      value={row.category}
                      onChange={(e) => updateRow(index, { category: e.target.value })}
                      options={CATEGORY_OPTIONS}
                    />
                  )}
                </td>
                <td className="px-3 py-2 align-top">
                  {readOnly ? (
                    <span className="text-sm text-slate-800">{row.quantity}</span>
                  ) : (
                    <Input
                      inputMode="decimal"
                      min={0.01}
                      value={row.quantity}
                      onChange={(e) => updateRow(index, { quantity: e.target.value })}
                    />
                  )}
                </td>
                <td className="px-3 py-2 align-top">
                  {readOnly ? (
                    <span className="text-sm text-slate-800">{formatCurrency(row.unitPrice)}</span>
                  ) : (
                    <Input
                      inputMode="decimal"
                      min={0}
                      value={row.unitPrice}
                      onChange={(e) => updateRow(index, { unitPrice: e.target.value })}
                    />
                  )}
                </td>
                <td className="px-3 py-2 text-right align-top text-sm font-medium text-slate-900">
                  {formatCurrency(row.total)}
                </td>
                {!readOnly && (
                  <td className="px-3 py-2 align-top">
                    {rows.length > 1 && (
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeRow(index)} aria-label="Remove line">
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        {!readOnly && (
          <Button type="button" variant="secondary" size="sm" onClick={addRow}>
            <Plus className="mr-1 h-4 w-4" />
            Add line item
          </Button>
        )}
        <p className="ml-auto text-sm font-medium text-slate-900">Subtotal: {formatCurrency(subtotal)}</p>
      </div>
    </div>
  )
}

export function mapServerInvoiceItems(items = []) {
  return items.map((item) => ({
    description: item.description || "",
    category: item.category || "consultation",
    quantity: item.quantity ?? 1,
    unitPrice: item.unit_price ?? item.unitPrice ?? 0
  }))
}

export default InvoiceItemsTable
