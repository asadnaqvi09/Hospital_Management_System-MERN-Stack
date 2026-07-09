import { useMemo } from "react"
import { Link } from "react-router-dom"
import { useGetReorderAlertsQuery } from "@/api/medicines.api"
import DataTable from "@/components/data-display/DataTable"
import PageLoader from "@/components/feedback/PageLoader"
import ErrorState from "@/components/ui/ErrorState"
import Button from "@/components/ui/Button"
export default function ReorderAlertsPage() {
  const { data, isLoading, error, refetch } = useGetReorderAlertsQuery()
  const medicines = data?.data?.medicines || []
  const columns = useMemo(
    () => [
      {
        header: "Medicine",
        cell: ({ row }) => <span className="font-medium text-slate-900">{row.original.name}</span>
      },
      {
        header: "Generic",
        cell: ({ row }) => row.original.generic_name || "-"
      },
      {
        header: "Stock",
        cell: ({ row }) => <span className="font-medium text-orange-700">{row.original.stock_quantity ?? 0}</span>
      },
      {
        header: "Reorder level",
        cell: ({ row }) => row.original.reorder_level ?? "-"
      },
      {
        header: "Unit",
        cell: ({ row }) => row.original.unit || "-"
      },
      {
        header: "",
        cell: ({ row }) => (
          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="sm" as={Link} to={`/pharmacy/inventory/${row.original.id}`}>
              View
            </Button>
            <Button size="sm" as={Link} to={`/pharmacy/inventory/receive?medicineId=${row.original.id}`}>
              Receive
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
          <h1 className="text-lg font-semibold text-slate-900">Reorder alerts</h1>
          <p className="text-sm text-slate-600">Medicines at or below reorder level.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={refetch}>
            Refresh
          </Button>
          <Button variant="secondary" as={Link} to="/pharmacy">
            Back
          </Button>
        </div>
      </div>
      <DataTable
        columns={columns}
        data={medicines}
        emptyTitle="No reorder alerts"
        emptyDescription="All medicines are above reorder level."
      />
    </div>
  )
}
