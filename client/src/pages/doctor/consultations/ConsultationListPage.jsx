import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { useGetConsultationsQuery } from "@/api/consultations.api"
import DataTable from "@/components/data-display/DataTable"
import PageLoader from "@/components/feedback/PageLoader"
import ErrorState from "@/components/ui/ErrorState"
import Button from "@/components/ui/Button"
import Input from "@/components/ui/Input"
import FormField from "@/components/forms/FormField"
import Pagination from "@/components/ui/Pagination"
import { usePagination } from "@/hooks/usePagination"

export default function ConsultationListPage() {
  return <ConsultationsList />
}

function ConsultationsList() {
  const { page, limit, setPage } = usePagination({ page: 1, limit: 20 })
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")

  const { data, isLoading, error, refetch } = useGetConsultationsQuery({
    page,
    limit,
    fromDate: fromDate || undefined,
    toDate: toDate || undefined
  })

  const consultations = data?.data?.consultations || []
  const pagination = data?.pagination

  const columns = useMemo(
    () => [
      {
        header: "Patient",
        cell: ({ row }) => (
          <div className="space-y-0.5">
            <div className="font-medium text-slate-900">{row.original.patient_name || "-"}</div>
            <div className="text-xs text-slate-500">MRN {row.original.patient_mrn || "-"}</div>
          </div>
        )
      },
      { header: "Doctor", cell: ({ row }) => row.original.doctor_name || "-" },
      { header: "Date", cell: ({ row }) => String(row.original.created_at || "").slice(0, 10) || "-" },
      {
        header: "",
        cell: ({ row }) => (
          <div className="flex justify-end">
            <Button variant="secondary" size="sm" as={Link} to={`/doctor/consultations/${row.original.id}`}>
              Open
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
        <h1 className="text-lg font-semibold text-slate-900">Consultations</h1>
        <Button as={Link} to="/doctor/consultations/new">
          New
        </Button>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="grid gap-3 md:grid-cols-2">
          <FormField label="From" htmlFor="fromDate">
            <Input
              id="fromDate"
              type="date"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value)
                setPage(1)
              }}
            />
          </FormField>
          <FormField label="To" htmlFor="toDate">
            <Input
              id="toDate"
              type="date"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value)
                setPage(1)
              }}
            />
          </FormField>
        </div>
      </div>
      <DataTable columns={columns} data={consultations} emptyTitle="No consultations" emptyDescription="No consultations found for these filters." />
      <Pagination page={pagination?.page || page} totalPages={pagination?.totalPages} onPageChange={setPage} />
    </div>
  )
}
