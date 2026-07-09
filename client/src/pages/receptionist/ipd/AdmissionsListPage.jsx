import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { useGetAdmissionsQuery } from "@/api/ipd.api"
import { usePagination } from "@/hooks/usePagination"
import { RECEPTIONIST_ROUTES } from "@/constants/routes"
import DataTable from "@/components/data-display/DataTable"
import PageLoader from "@/components/feedback/PageLoader"
import ErrorState from "@/components/ui/ErrorState"
import Button from "@/components/ui/Button"
import Card from "@/components/ui/Card"
import Input from "@/components/ui/Input"
import Select from "@/components/ui/Select"
import StatusBadge from "@/components/data-display/StatusBadge"
import Pagination from "@/components/ui/Pagination"

export default function AdmissionsListPage() {
  const { page, limit, setPage } = usePagination({ page: 1, limit: 20 })
  const [ward, setWard] = useState("")
  const [status, setStatus] = useState("admitted")
  const { data, isLoading, error, refetch } = useGetAdmissionsQuery({
    page,
    limit,
    ward: ward || undefined,
    status: status || undefined
  })
  const admissions = data?.data?.admissions || []
  const pagination = data?.pagination
  const columns = useMemo(
    () => [
      {
        header: "Patient",
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-slate-900">{row.original.patient_name || "Patient"}</p>
            <p className="text-xs text-slate-600">MRN {row.original.patient_mrn || "-"}</p>
          </div>
        )
      },
      {
        header: "Ward / Room",
        cell: ({ row }) => (
          <p className="text-sm text-slate-800">
            {(row.original.ward || "-") + " • " + (row.original.room_number || "-")}
          </p>
        )
      },
      {
        header: "Admitted",
        cell: ({ row }) => (
          <p className="text-sm text-slate-800">
            {String(row.original.admission_date || "").replace("T", " ").slice(0, 16) || "-"}
          </p>
        )
      },
      {
        header: "Status",
        cell: ({ row }) => <StatusBadge status={row.original.status} />
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
          <h1 className="text-lg font-semibold text-slate-900">Admissions</h1>
          <p className="text-sm text-slate-600">All inpatient admissions.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" as={Link} to={RECEPTIONIST_ROUTES.IPD}>
            Rooms
          </Button>
          <Button as={Link} to={RECEPTIONIST_ROUTES.IPD_ADMISSION_CREATE}>
            Admit patient
          </Button>
        </div>
      </div>
      <Card className="p-4">
        <div className="grid gap-3 md:grid-cols-3">
          <div>
            <p className="mb-1 text-sm font-medium text-slate-700">Status</p>
            <Select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value)
                setPage(1)
              }}
              options={[
                { value: "admitted", label: "Admitted" },
                { value: "discharged", label: "Discharged" },
                { value: "transferred", label: "Transferred" },
                { value: "", label: "All" }
              ]}
            />
          </div>
          <div>
            <p className="mb-1 text-sm font-medium text-slate-700">Ward</p>
            <Input
              placeholder="e.g. General"
              value={ward}
              onChange={(e) => {
                setWard(e.target.value)
                setPage(1)
              }}
            />
          </div>
          <div className="flex items-end justify-end">
            <Button variant="secondary" onClick={refetch}>Refresh</Button>
          </div>
        </div>
      </Card>
      <DataTable
        columns={columns}
        data={admissions}
        emptyTitle="No admissions"
        emptyDescription="No admissions match the current filters."
      />
      <Pagination page={pagination?.page || page} totalPages={pagination?.totalPages} onPageChange={setPage} />
    </div>
  )
}
