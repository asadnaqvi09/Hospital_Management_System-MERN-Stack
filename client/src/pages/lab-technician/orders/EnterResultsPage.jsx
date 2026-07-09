import { useEffect, useMemo, useState } from "react"
import { Link, useLocation, useNavigate, useParams } from "react-router-dom"
import { toast } from "sonner"
import { useGetLabOrderQuery, useSubmitLabResultsMutation } from "@/api/lab.api"
import { LAB_ORDER_STATUS } from "@/constants/statuses"
import PageLoader from "@/components/feedback/PageLoader"
import ErrorState from "@/components/ui/ErrorState"
import Button from "@/components/ui/Button"
import Card from "@/components/ui/Card"
import Input from "@/components/ui/Input"
import FormField from "@/components/forms/FormField"
import StatusBadge from "@/components/data-display/StatusBadge"
import { parseApiError } from "@/utils/parseApiError"
function formatDate(value) {
  return String(value || "").replace("T", " ").slice(0, 16) || "-"
}
function isItemPending(item) {
  return item.result_value == null && item.result_numeric == null
}
function canEnterResults(status) {
  return status === LAB_ORDER_STATUS.SAMPLE_COLLECTED || status === LAB_ORDER_STATUS.PROCESSING
}
function ResultItemForm({ item, values, onChange, onSave, saving, disabled }) {
  const pending = isItemPending(item)
  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-medium text-slate-900">{item.test_name}</p>
          <p className="mt-1 text-sm text-slate-700">
            {item.unit ? `Unit: ${item.unit}` : "No unit"}
            {item.normal_range ? ` • Range: ${item.normal_range}` : ""}
          </p>
        </div>
        {!pending && <span className="text-xs font-medium text-emerald-700">Saved</span>}
      </div>
      {pending && !disabled && (
        <div className="mt-4 space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            <FormField label="Result value" htmlFor={`value-${item.id}`}>
              <Input
                id={`value-${item.id}`}
                value={values.resultValue}
                onChange={(e) => onChange({ ...values, resultValue: e.target.value })}
                placeholder="e.g. Negative, Positive"
              />
            </FormField>
            <FormField label="Numeric result" htmlFor={`numeric-${item.id}`}>
              <Input
                id={`numeric-${item.id}`}
                inputMode="decimal"
                value={values.resultNumeric}
                onChange={(e) => onChange({ ...values, resultNumeric: e.target.value })}
                placeholder="e.g. 12.5"
              />
            </FormField>
          </div>
          <FormField label="Notes" htmlFor={`notes-${item.id}`}>
            <textarea
              id={`notes-${item.id}`}
              rows={2}
              value={values.notes}
              onChange={(e) => onChange({ ...values, notes: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
            />
          </FormField>
          <div className="flex justify-end">
            <Button size="sm" disabled={saving} onClick={onSave}>
              {saving ? "Saving..." : "Save result"}
            </Button>
          </div>
        </div>
      )}
      {!pending && (
        <div className="mt-3 border-t border-slate-100 pt-3 text-sm text-slate-800">
          <p>
            Result:{" "}
            <span className="font-medium text-slate-900">
              {item.result_value ?? item.result_numeric ?? "-"}
              {item.unit ? ` ${item.unit}` : ""}
            </span>
          </p>
          {item.is_critical && <p className="mt-1 text-xs font-medium text-red-700">Critical</p>}
          {item.is_abnormal && !item.is_critical && (
            <p className="mt-1 text-xs font-medium text-amber-700">Abnormal</p>
          )}
          {item.notes && <p className="mt-1 text-slate-600">Notes: {item.notes}</p>}
        </div>
      )}
    </Card>
  )
}
export default function EnterResultsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const listRow = location.state?.order
  const { data, isLoading, error, refetch } = useGetLabOrderQuery(id, { skip: !id })
  const [submitResult, { isLoading: isSubmitting }] = useSubmitLabResultsMutation()
  const [formState, setFormState] = useState({})
  const [savingItemId, setSavingItemId] = useState(null)
  const order = data?.data?.order
  const items = order?.items || []
  const pendingItems = useMemo(() => items.filter(isItemPending), [items])
  const eligible = order && canEnterResults(order.status)
  useEffect(() => {
    if (!items.length) return
    setFormState((prev) => {
      const updated = { ...prev }
      for (const item of items) {
        if (isItemPending(item) && !updated[item.id]) {
          updated[item.id] = { resultValue: "", resultNumeric: "", notes: "" }
        }
        if (!isItemPending(item)) {
          delete updated[item.id]
        }
      }
      return updated
    })
  }, [items])
  const buildPayload = (itemId) => {
    const values = formState[itemId] || {}
    const resultValue = values.resultValue?.trim()
    const numericRaw = values.resultNumeric?.trim()
    const resultNumeric = numericRaw === "" ? undefined : Number(numericRaw)
    if (!resultValue && (numericRaw === "" || Number.isNaN(resultNumeric))) {
      return null
    }
    return {
      resultValue: resultValue || undefined,
      resultNumeric: numericRaw === "" || Number.isNaN(resultNumeric) ? undefined : resultNumeric,
      notes: values.notes?.trim() || undefined
    }
  }
  const handleSaveItem = async (itemId) => {
    const payload = buildPayload(itemId)
    if (!payload) {
      toast.error("Enter a text or numeric result")
      return
    }
    setSavingItemId(itemId)
    try {
      const res = await submitResult({ orderId: id, itemId, ...payload }).unwrap()
      toast.success(res?.message || "Result saved")
      if (res?.data?.order?.status === LAB_ORDER_STATUS.COMPLETED) {
        navigate(`/lab/orders/${id}`, { state: { order: listRow }, replace: true })
      }
    } catch (err) {
      console.error("submitLabResults", { orderId: id, itemId, payload, error: err })
      toast.error(parseApiError(err?.data || err))
    } finally {
      setSavingItemId(null)
    }
  }
  const handleSaveAll = async () => {
    const toSave = pendingItems.filter((item) => buildPayload(item.id))
    if (toSave.length === 0) {
      toast.error("Enter a result for at least one pending item")
      return
    }
    for (const item of toSave) {
      const payload = buildPayload(item.id)
      if (!payload) continue
      setSavingItemId(item.id)
      try {
        const res = await submitResult({ orderId: id, itemId: item.id, ...payload }).unwrap()
        if (res?.data?.order?.status === LAB_ORDER_STATUS.COMPLETED) {
          toast.success(res?.message || "All results saved — order completed")
          navigate(`/lab/orders/${id}`, { state: { order: listRow }, replace: true })
          return
        }
      } catch (err) {
        console.error("submitLabResults", { orderId: id, itemId: item.id, payload, error: err })
        toast.error(parseApiError(err?.data || err))
        setSavingItemId(null)
        return
      }
    }
    setSavingItemId(null)
    toast.success("Results saved")
  }
  if (isLoading) return <PageLoader />
  if (error) return <ErrorState error={error?.data || error} onRetry={refetch} />
  if (!order) return <ErrorState error="Lab order not found" onRetry={refetch} />
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Enter results</h1>
          <p className="text-sm text-slate-600">Record test results for this lab order.</p>
        </div>
        <Button variant="secondary" as={Link} to={`/lab/orders/${id}`} state={{ order: listRow }}>
          Back
        </Button>
      </div>
      <Card className="p-4">
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Patient</p>
            <p className="mt-1 font-medium text-slate-900">{listRow?.patient_name || order.patient_id || "-"}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Ordered</p>
            <p className="mt-1 text-sm text-slate-900">{formatDate(order.ordered_at)}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Status</p>
            <div className="mt-1">
              <StatusBadge status={order.status} />
            </div>
          </div>
        </div>
      </Card>
      {!eligible && (
        <Card className="p-4">
          <p className="text-sm text-slate-600">
            Results can only be entered when the order status is sample collected or processing.
          </p>
        </Card>
      )}
      <div className="space-y-3">
        {items.map((item) => (
          <ResultItemForm
            key={item.id}
            item={item}
            values={formState[item.id] || { resultValue: "", resultNumeric: "", notes: "" }}
            onChange={(values) => setFormState((prev) => ({ ...prev, [item.id]: values }))}
            onSave={() => handleSaveItem(item.id)}
            saving={savingItemId === item.id}
            disabled={!eligible}
          />
        ))}
      </div>
      {eligible && pendingItems.length > 0 && (
        <Card className="p-4">
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="secondary" disabled={isSubmitting} onClick={handleSaveAll}>
              {isSubmitting ? "Saving..." : "Save all pending"}
            </Button>
          </div>
        </Card>
      )}
      {eligible && pendingItems.length === 0 && (
        <Card className="p-4">
          <p className="text-sm text-emerald-700">All results have been entered.</p>
          <div className="mt-3">
            <Button as={Link} to={`/lab/orders/${id}`} state={{ order: listRow }}>
              View order
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}
