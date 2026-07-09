import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { useGetAdmissionsQuery } from "@/api/ipd.api"
import { usePatientScope } from "@/hooks/usePatientScope"
import { usePagination } from "@/hooks/usePagination"
import { PATIENT_ROUTES } from "@/constants/routes"
import DataTable from "@/components/data-display/DataTable"
import PageLoader from "@/components/feedback/PageLoader"
import ErrorState from "@/components/ui/ErrorState"
import Button from "@/components/ui/Button"
import Card from "@/components/ui/Card"
import Select from "@/components/ui/Select"
import Pagination from "@/components/ui/Pagination"
import StatusBadge from "@/components/data-display/StatusBadge"

function formatDate(value) {
  return String(value || "").replace("T", " ").slice(0, 10) || "-"
}

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "admitted", label: "Admitted" },
  { value: "discharged", label: "Discharged" }
]

export default function MyAdmissionsPage() {
  const { patientId, isLoading: profileLoading, error: profileError, refetch: refetchProfile } = usePatientScope()
  const { page, limit, setPage } = usePagination({ page: 1, limit: 20 })
  const [status, setStatus] = useState("")
  const { data, isLoading, error, refetch } = useGetAdmissionsQuery(
    { page, limit, status: status || undefined },
    { skip: !patientId }
  )
  const admissions = data?.data?.admissions || []
  const pagination = data?.pagination
  const columns = useMemo(
    () => [
      {
        header: "Ward / Room",
        cell: ({ row }) => (
          <span className="text-sm text-slate-800">
            {(row.original.ward || "-") + " • " + (row.original.room_number || "-")}
          </span>
        )
      },
      { header: "Admitted", cell: ({ row }) => formatDate(row.original.admitted_at) },
      { header: "Discharged", cell: ({ row }) => formatDate(row.original.discharged_at) },
      { header: "Status", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
      {
        header: "Reason",
        cell: ({ row }) => <span className="text-sm text-slate-700">{row.original.admission_reason || "-"}</span>
      }
    ],
    []
  )
  if (profileLoading) return <PageLoader />
  if (profileError) return <ErrorState error={profileError?.data || profileError} onRetry={refetchProfile} />
  if (!patientId) {
    return <ErrorState title="Patient profile not found" description="Your account is not linked to a patient profile." />
  }
  if (isLoading) return <PageLoader />
  if (error) return <ErrorState error={error?.data || error} onRetry={refetch} />
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">My admissions</h1>
          <p className="text-sm text-slate-600">Inpatient stays linked to your profile.</p>
        </div>
        <Button variant="secondary" as={Link} to={PATIENT_ROUTES.DASHBOARD}>
          Back
        </Button>
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
              options={STATUS_OPTIONS}
            />
          </div>
        </div>
      </Card>
      <DataTable columns={columns} data={admissions} emptyTitle="No admissions" emptyDescription="You have no inpatient admissions on record." />
      <Pagination page={pagination?.page || page} totalPages={pagination?.totalPages} onPageChange={setPage} />
    </div>
  )
}
