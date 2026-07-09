import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { useGetMedicinesQuery } from "@/api/medicines.api"
import { usePagination } from "@/hooks/usePagination"
import DataTable from "@/components/data-display/DataTable"
import PageLoader from "@/components/feedback/PageLoader"
import ErrorState from "@/components/ui/ErrorState"
import Button from "@/components/ui/Button"
import Card from "@/components/ui/Card"
import Pagination from "@/components/ui/Pagination"
import SearchInput from "@/components/forms/SearchInput"
export default function MedicinesListPage() {
  const { page, limit, setPage } = usePagination({ page: 1, limit: 20 })
  const [search, setSearch] = useState("")
  const [lowStockOnly, setLowStockOnly] = useState(false)
  const { data, isLoading, error, refetch } = useGetMedicinesQuery({
    page,
    limit,
    search: search || undefined,
    lowStockOnly: lowStockOnly || undefined
  })
  const medicines = data?.data?.medicines || []
  const pagination = data?.pagination
  const columns = useMemo(
    () => [
      {
        header: "Name",
        cell: ({ row }) => <span className="font-medium text-slate-900">{row.original.name}</span>
      },
      {
        header: "Generic",
        cell: ({ row }) => row.original.generic_name || "-"
      },
      {
        header: "Category",
        cell: ({ row }) => row.original.category || "-"
      },
      {
        header: "Unit",
        cell: ({ row }) => row.original.unit || "-"
      },
      {
        header: "Stock",
        cell: ({ row }) => {
          const stock = row.original.stock_quantity ?? 0
          const reorder = row.original.reorder_level ?? 0
          const low = stock <= reorder
          return <span className={low ? "font-medium text-orange-700" : "text-slate-800"}>{stock}</span>
        }
      },
      {
        header: "Reorder",
        cell: ({ row }) => row.original.reorder_level ?? "-"
      },
      {
        header: "",
        cell: ({ row }) => (
          <div className="flex justify-end">
            <Button variant="secondary" size="sm" as={Link} to={`/pharmacy/inventory/${row.original.id}`}>
              View
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
          <h1 className="text-lg font-semibold text-slate-900">Inventory</h1>
          <p className="text-sm text-slate-600">Medicine stock levels and batch details.</p>
        </div>
        <div className="flex gap-2">
          <Button as={Link} to="/pharmacy/inventory/receive">
            Receive batch
          </Button>
          <Button variant="secondary" as={Link} to="/pharmacy">
            Back
          </Button>
        </div>
      </div>
      <Card className="p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[260px] flex-1">
            <p className="mb-1 text-sm font-medium text-slate-700">Search</p>
            <SearchInput
              placeholder="Search medicines..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={lowStockOnly}
              onChange={(e) => {
                setLowStockOnly(e.target.checked)
                setPage(1)
              }}
              className="rounded border-slate-300"
            />
            Low stock only
          </label>
          <Button variant="secondary" onClick={refetch}>
            Refresh
          </Button>
        </div>
      </Card>
      <DataTable
        columns={columns}
        data={medicines}
        emptyTitle="No medicines"
        emptyDescription="No medicines match the current filters."
      />
      <Pagination page={pagination?.page || page} totalPages={pagination?.totalPages} onPageChange={setPage} />
    </div>
  )
}
