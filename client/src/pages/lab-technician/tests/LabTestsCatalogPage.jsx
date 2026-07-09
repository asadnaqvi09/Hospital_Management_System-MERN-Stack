import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { useGetLabTestsQuery } from "@/api/lab.api"
import DataTable from "@/components/data-display/DataTable"
import PageLoader from "@/components/feedback/PageLoader"
import ErrorState from "@/components/ui/ErrorState"
import Button from "@/components/ui/Button"
import Card from "@/components/ui/Card"
import Input from "@/components/ui/Input"
import SearchInput from "@/components/forms/SearchInput"
export default function LabTestsCatalogPage() {
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("")
  const { data, isLoading, error, refetch } = useGetLabTestsQuery({
    search: search || undefined,
    category: category || undefined
  })
  const tests = data?.data?.tests || []
  const columns = useMemo(
    () => [
      {
        header: "Name",
        cell: ({ row }) => <span className="font-medium text-slate-900">{row.original.name}</span>
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
        header: "Normal range",
        cell: ({ row }) => row.original.normal_range || "-"
      },
      {
        header: "Price",
        cell: ({ row }) => (row.original.price != null ? row.original.price : "-")
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
          <h1 className="text-lg font-semibold text-slate-900">Test catalog</h1>
          <p className="text-sm text-slate-600">Browse available lab tests and reference ranges.</p>
        </div>
        <Button variant="secondary" as={Link} to="/lab">
          Back
        </Button>
      </div>
      <Card className="p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[260px] flex-1">
            <p className="mb-1 text-sm font-medium text-slate-700">Search</p>
            <SearchInput
              placeholder="Search tests..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="min-w-[200px]">
            <p className="mb-1 text-sm font-medium text-slate-700">Category</p>
            <Input
              placeholder="e.g. Hematology"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
          </div>
          <Button variant="secondary" onClick={refetch}>
            Refresh
          </Button>
        </div>
      </Card>
      <DataTable
        columns={columns}
        data={tests}
        emptyTitle="No lab tests"
        emptyDescription="No tests match the current filters."
      />
    </div>
  )
}
