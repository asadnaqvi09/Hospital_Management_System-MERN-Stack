import { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { toast } from "sonner"
import {
  useCancelInvoiceMutation,
  useFinalizeInvoiceMutation,
  useGetInvoiceQuery,
  useRecordPaymentMutation,
  useUpdateInvoiceMutation
} from "@/api/billing.api"
import InvoiceItemsTable, { mapServerInvoiceItems } from "@/components/domain/InvoiceItemsTable"
import PaymentForm from "@/components/domain/PaymentForm"
import { INVOICE_STATUS } from "@/constants/statuses"
import { RECEPTIONIST_ROUTES } from "@/constants/routes"
import PageLoader from "@/components/feedback/PageLoader"
import ErrorState from "@/components/ui/ErrorState"
import Button from "@/components/ui/Button"
import Card from "@/components/ui/Card"
import Input from "@/components/ui/Input"
import FormField from "@/components/forms/FormField"
import StatusBadge from "@/components/data-display/StatusBadge"
import { formatCurrency } from "@/utils/formatCurrency"
import { parseApiError } from "@/utils/parseApiError"

function formatDate(value) {
  return String(value || "").replace("T", " ").slice(0, 16) || "-"
}

const METHOD_LABELS = {
  cash: "Cash",
  card: "Card",
  bank_transfer: "Bank transfer",
  insurance: "Insurance"
}

export default function InvoiceDetailPage() {
  const { id } = useParams()
  const { data, isLoading, error, refetch } = useGetInvoiceQuery(id, { skip: !id })
  const [updateInvoice, { isLoading: isSaving }] = useUpdateInvoiceMutation()
  const [finalizeInvoice, { isLoading: isFinalizing }] = useFinalizeInvoiceMutation()
  const [cancelInvoice, { isLoading: isCancelling }] = useCancelInvoiceMutation()
  const [recordPayment, { isLoading: isPaying }] = useRecordPaymentMutation()

  const invoice = data?.data?.invoice
  const payments = data?.data?.payments || []
  const isDraft = invoice?.status === INVOICE_STATUS.DRAFT
  const canPay =
    invoice?.status === INVOICE_STATUS.FINALIZED || invoice?.status === INVOICE_STATUS.PARTIALLY_PAID
  const canCancel =
    invoice?.status !== INVOICE_STATUS.FULLY_PAID && invoice?.status !== INVOICE_STATUS.CANCELLED

  const [items, setItems] = useState([])
  const [discountAmount, setDiscountAmount] = useState("")
  const [discountReason, setDiscountReason] = useState("")
  const [taxAmount, setTaxAmount] = useState("")

  useEffect(() => {
    if (!invoice) return
    setItems(mapServerInvoiceItems(invoice.items || []))
    setDiscountAmount(String(invoice.discount_amount ?? ""))
    setDiscountReason(invoice.discount_reason || "")
    setTaxAmount(String(invoice.tax_amount ?? ""))
  }, [invoice])

  const onSaveDraft = async () => {
    if (!id) return
    try {
      const res = await updateInvoice({
        id,
        items,
        discountAmount: discountAmount === "" ? undefined : Number(discountAmount),
        discountReason: discountReason.trim() || undefined,
        taxAmount: taxAmount === "" ? undefined : Number(taxAmount)
      }).unwrap()
      toast.success(res?.message || "Invoice updated")
      refetch()
    } catch (e) {
      toast.error(parseApiError(e?.data || e))
    }
  }

  const onFinalize = async () => {
    if (!id) return
    try {
      const res = await finalizeInvoice(id).unwrap()
      toast.success(res?.message || "Invoice finalized")
      refetch()
    } catch (e) {
      toast.error(parseApiError(e?.data || e))
    }
  }

  const onCancel = async () => {
    if (!id) return
    try {
      const res = await cancelInvoice(id).unwrap()
      toast.success(res?.message || "Invoice cancelled")
      refetch()
    } catch (e) {
      toast.error(parseApiError(e?.data || e))
    }
  }

  const onPayment = async (payload) => {
    if (!id) return
    const res = await recordPayment({ id, ...payload }).unwrap()
    toast.success(res?.message || "Payment recorded")
    refetch()
  }

  if (isLoading) return <PageLoader />
  if (error) return <ErrorState error={error?.data || error} onRetry={refetch} />
  if (!invoice) return <ErrorState title="Invoice not found" />

  const outstanding = Math.max(Number(invoice.total) - Number(invoice.paid_amount || 0), 0)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Invoice</h1>
          <p className="text-sm text-slate-600">
            {invoice.patient_name || "Patient"} • MRN {invoice.patient_mrn || "-"}
          </p>
        </div>
        <Button variant="secondary" as={Link} to={RECEPTIONIST_ROUTES.BILLING}>
          Back
        </Button>
      </div>
      <Card className="p-4">
        <div className="grid gap-4 md:grid-cols-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Status</p>
            <div className="mt-1"><StatusBadge status={invoice.status} /></div>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Total</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">{formatCurrency(invoice.total)}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Paid</p>
            <p className="mt-1 text-sm text-slate-900">{formatCurrency(invoice.paid_amount)}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Outstanding</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">{formatCurrency(outstanding)}</p>
          </div>
        </div>
        <p className="mt-3 text-xs text-slate-600">Created {formatDate(invoice.created_at)}</p>
      </Card>
      <Card className="p-6">
        <h2 className="text-sm font-semibold text-slate-900">Line items</h2>
        <div className="mt-4">
          <InvoiceItemsTable
            items={items}
            onChange={isDraft ? setItems : undefined}
            readOnly={!isDraft}
          />
        </div>
        {isDraft && (
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <FormField label="Discount amount" htmlFor="discountAmount">
              <Input id="discountAmount" type="number" min={0} step="0.01" value={discountAmount} onChange={(e) => setDiscountAmount(e.target.value)} />
            </FormField>
            <FormField label="Tax amount" htmlFor="taxAmount">
              <Input id="taxAmount" type="number" min={0} step="0.01" value={taxAmount} onChange={(e) => setTaxAmount(e.target.value)} />
            </FormField>
            <FormField label="Discount reason" htmlFor="discountReason">
              <Input id="discountReason" value={discountReason} onChange={(e) => setDiscountReason(e.target.value)} />
            </FormField>
          </div>
        )}
        {!isDraft && (invoice.discount_amount > 0 || invoice.tax_amount > 0) && (
          <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-700">
            {invoice.discount_amount > 0 && <span>Discount: {formatCurrency(invoice.discount_amount)}</span>}
            {invoice.tax_amount > 0 && <span>Tax: {formatCurrency(invoice.tax_amount)}</span>}
          </div>
        )}
      </Card>
      <div className="flex flex-wrap justify-end gap-2">
        {isDraft && (
          <>
            <Button variant="secondary" disabled={isSaving} onClick={onSaveDraft}>
              {isSaving ? "Saving..." : "Save draft"}
            </Button>
            <Button disabled={isFinalizing} onClick={onFinalize}>
              {isFinalizing ? "Finalizing..." : "Finalize"}
            </Button>
          </>
        )}
        {canCancel && (
          <Button variant="danger" disabled={isCancelling} onClick={onCancel}>
            {isCancelling ? "Cancelling..." : "Cancel invoice"}
          </Button>
        )}
      </div>
      {payments.length > 0 && (
        <Card className="p-6">
          <h2 className="text-sm font-semibold text-slate-900">Payment history</h2>
          <div className="mt-4 divide-y divide-slate-100">
            {payments.map((p) => (
              <div key={p.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-900">{formatCurrency(p.amount)}</p>
                  <p className="text-xs text-slate-600">
                    {METHOD_LABELS[p.method] || p.method} • {formatDate(p.paid_at || p.created_at)}
                    {p.reference ? ` • Ref ${p.reference}` : ""}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
      {canPay && (
        <PaymentForm
          invoiceTotal={invoice.total}
          paidAmount={invoice.paid_amount}
          onSubmit={onPayment}
          isLoading={isPaying}
        />
      )}
    </div>
  )
}
