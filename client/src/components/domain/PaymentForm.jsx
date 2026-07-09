import { useEffect, useMemo } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import Button from "@/components/ui/Button"
import Input from "@/components/ui/Input"
import Select from "@/components/ui/Select"
import FormField from "@/components/forms/FormField"
import Card from "@/components/ui/Card"
import { formatCurrency } from "@/utils/formatCurrency"
import { parseApiError } from "@/utils/parseApiError"

const PAYMENT_METHODS = [
  { value: "cash", label: "Cash" },
  { value: "card", label: "Card" },
  { value: "bank_transfer", label: "Bank transfer" },
  { value: "insurance", label: "Insurance" }
]

function buildSchema(outstanding) {
  return z.object({
    amount: z
      .string()
      .min(1, "Amount is required")
      .refine((val) => Number(val) > 0, "Amount must be greater than zero")
      .refine((val) => Number(val) <= outstanding + 0.001, `Amount cannot exceed ${formatCurrency(outstanding)}`),
    method: z.enum(["cash", "card", "bank_transfer", "insurance"]),
    reference: z.string().max(120).optional().or(z.literal(""))
  })
}

export function PaymentForm({
  invoiceTotal = 0,
  paidAmount = 0,
  onSubmit,
  isLoading = false,
  disabled = false
}) {
  const outstanding = useMemo(() => {
    const due = Number(invoiceTotal) - Number(paidAmount)
    return due > 0 ? Math.round(due * 100) / 100 : 0
  }, [invoiceTotal, paidAmount])

  const schema = useMemo(() => buildSchema(outstanding), [outstanding])

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      amount: outstanding > 0 ? String(outstanding) : "",
      method: "cash",
      reference: ""
    }
  })

  useEffect(() => {
    reset({
      amount: outstanding > 0 ? String(outstanding) : "",
      method: "cash",
      reference: ""
    })
  }, [outstanding, reset])

  const submit = async (values) => {
    try {
      await onSubmit?.({
        amount: Number(values.amount),
        method: values.method,
        reference: values.reference?.trim() || undefined
      })
      reset({
        amount: "",
        method: "cash",
        reference: ""
      })
    } catch (error) {
      setError("root", { message: parseApiError(error?.data || error) })
    }
  }

  if (outstanding <= 0) {
    return (
      <Card className="p-4">
        <p className="text-sm font-medium text-emerald-700">This invoice is fully paid.</p>
      </Card>
    )
  }

  return (
    <Card className="p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Record payment</h3>
          <p className="mt-0.5 text-xs text-slate-600">Payments are recorded manually at the counter.</p>
        </div>
        <p className="text-sm font-medium text-slate-900">Outstanding: {formatCurrency(outstanding)}</p>
      </div>
      <form onSubmit={handleSubmit(submit)} className="grid gap-3 md:grid-cols-3">
        <FormField label="Amount" htmlFor="payment-amount" error={errors.amount?.message}>
          <Input
            id="payment-amount"
            inputMode="decimal"
            disabled={disabled || isLoading}
            error={Boolean(errors.amount)}
            {...register("amount")}
          />
        </FormField>
        <FormField label="Method" htmlFor="payment-method" error={errors.method?.message}>
          <Select
            id="payment-method"
            options={PAYMENT_METHODS}
            disabled={disabled || isLoading}
            error={Boolean(errors.method)}
            {...register("method")}
          />
        </FormField>
        <FormField label="Reference" htmlFor="payment-reference" hint="Receipt or POS reference (optional)">
          <Input id="payment-reference" disabled={disabled || isLoading} {...register("reference")} />
        </FormField>
        {errors.root?.message && <p className="md:col-span-3 text-xs text-red-600">{errors.root.message}</p>}
        <div className="md:col-span-3">
          <Button type="submit" disabled={disabled || isLoading}>
            {isLoading ? "Recording…" : "Record payment"}
          </Button>
        </div>
      </form>
    </Card>
  )
}

export default PaymentForm
