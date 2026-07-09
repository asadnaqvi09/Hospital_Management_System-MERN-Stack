import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { useGetExpiryAlertsQuery } from "@/api/medicines.api"
import DataTable from "@/components/data-display/DataTable"
import PageLoader from "@/components/feedback/PageLoader"
import ErrorState from "@/components/ui/ErrorState"
import Button from "@/components/ui/Button"
import Card from "@/components/ui/Card"
import Input from "@/components/ui/Input"
import FormField from "@/components/forms/FormField"
function formatDate(value) {
  if (!value) return "-"
  return String(value).slice(0, 10)
}
export default function ExpiryAlertsPage() {
  const [days, setDays] = useState("30")
  const daysNum = Number(days) || 30
  const { data, isLoading, error, refetch } = useGetExpiryAlertsQuery({ days: daysNum })
  const batches = data?.data?.batches || []
  const activeDays = data?.data?.days ?? daysNum
  const columns = useMemo(
    () => [
      {
        header: "Medicine",
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-slate-900">{row.original.medicine_name || "-"}</p>
            {row.original.generic_name && <p className="text-xs text-slate-600">{row.original.generic_name}</p>}
          </div>
        )
      },
      { header: "Batch", cell: ({ row }) => row.original.batch_number || "-" },
      { header: "Quantity", cell: ({ row }) => row.original.quantity ?? "-" },
      {
        header: "Expiry",
        cell: ({ row }) => <span className="font-medium text-orange-700">{formatDate(row.original.expiry_date)}</span>
      },
      {
        header: "",
        cell: ({ row }) => (
          <div className="flex justify-end">
            <Button variant="secondary" size="sm" as={Link} to={`/pharmacy/inventory/${row.original.medicine_id}`}>
              View medicine
            </Button>
          </div>
        )
      }
    ],
    []
  )
  if (isLoading) return <PageLoader />
  if (error) return <ErrorState error={error?.data || error} onRetry={refetch} />
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Expiry alerts</h1>
          <p className="text-sm text-slate-600">Batches expiring within {activeDays} days.</p>
        </div>
        <Button variant="secondary" as={Link} to="/pharmacy">
          Back
        </Button>
      </div>
      <Card className="p-4">
        <div className="flex flex-wrap items-end gap-3">
          <FormField label="Days ahead" htmlFor="days" className="w-40">
            <Input
              id="days"
              inputMode="numeric"
              min={1}
              max={365}
              value={days}
              onChange={(e) => setDays(e.target.value)}
            />
          </FormField>
          <Button variant="secondary" onClick={refetch}>
            Refresh
          </Button>
        </div>
      </Card>
      <DataTable
        columns={columns}
        data={batches}
        emptyTitle="No expiry alerts"
        emptyDescription={`No batches expiring within ${activeDays} days.`}
      />
    </div>
  )
}
