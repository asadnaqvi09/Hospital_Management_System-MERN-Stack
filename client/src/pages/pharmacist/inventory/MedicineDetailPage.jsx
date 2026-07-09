import { useMemo } from "react"
import { Link, useParams } from "react-router-dom"
import { useGetMedicineQuery } from "@/api/medicines.api"
import DataTable from "@/components/data-display/DataTable"
import PageLoader from "@/components/feedback/PageLoader"
import ErrorState from "@/components/ui/ErrorState"
import Button from "@/components/ui/Button"
import Card from "@/components/ui/Card"
function formatDate(value) {
  if (!value) return "-"
  return String(value).slice(0, 10)
}
export default function MedicineDetailPage() {
  const { id } = useParams()
  const { data, isLoading, error, refetch } = useGetMedicineQuery(id, { skip: !id })
  const medicine = data?.data?.medicine
  const batches = data?.data?.batches || []
  const columns = useMemo(
    () => [
      { header: "Batch", cell: ({ row }) => row.original.batch_number || "-" },
      { header: "Quantity", cell: ({ row }) => row.original.quantity ?? "-" },
      { header: "Expiry", cell: ({ row }) => formatDate(row.original.expiry_date) },
      {
        header: "Received",
        cell: ({ row }) => String(row.original.received_at || "").replace("T", " ").slice(0, 16) || "-"
      }
    ],
    []
  )
  if (isLoading) return <PageLoader />
  if (error) return <ErrorState error={error?.data || error} onRetry={refetch} />
  if (!medicine) return <ErrorState error="Medicine not found" onRetry={refetch} />
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">{medicine.name}</h1>
          <p className="text-sm text-slate-600">{medicine.generic_name || "No generic name"}</p>
        </div>
        <div className="flex gap-2">
          <Button as={Link} to={`/pharmacy/inventory/receive?medicineId=${medicine.id}`}>
            Receive batch
          </Button>
          <Button variant="secondary" as={Link} to="/pharmacy/inventory">
            Back
          </Button>
        </div>
      </div>
      <Card className="p-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Category</p>
            <p className="mt-1 text-sm text-slate-900">{medicine.category || "-"}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Unit</p>
            <p className="mt-1 text-sm text-slate-900">{medicine.unit || "-"}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Stock</p>
            <p className="mt-1 text-sm font-medium text-slate-900">{medicine.stock_quantity ?? 0}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Reorder level</p>
            <p className="mt-1 text-sm text-slate-900">{medicine.reorder_level ?? "-"}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Purchase price</p>
            <p className="mt-1 text-sm text-slate-900">{medicine.purchase_price ?? "-"}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Sale price</p>
            <p className="mt-1 text-sm text-slate-900">{medicine.sale_price ?? "-"}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Supplier</p>
            <p className="mt-1 text-sm text-slate-900">{medicine.supplier || "-"}</p>
          </div>
        </div>
      </Card>
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-900">Batches</h2>
        <DataTable
          columns={columns}
          data={batches}
          emptyTitle="No batches"
          emptyDescription="No batches recorded for this medicine."
        />
      </div>
    </div>
  )
}
