import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { useGetPrescriptionsQuery } from "@/api/prescriptions.api"
import { usePatientScope } from "@/hooks/usePatientScope"
import { usePagination } from "@/hooks/usePagination"
import { PRESCRIPTION_STATUS } from "@/constants/statuses"
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
  return String(value || "").replace("T", " ").slice(0, 16) || "-"
}

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: PRESCRIPTION_STATUS.PENDING, label: "Pending" },
  { value: PRESCRIPTION_STATUS.PARTIALLY_DISPENSED, label: "Partially dispensed" },
  { value: PRESCRIPTION_STATUS.DISPENSED, label: "Dispensed" },
  { value: PRESCRIPTION_STATUS.CANCELLED, label: "Cancelled" }
]

export default function MyPrescriptionsPage() {
  const { patientId, isLoading: profileLoading, error: profileError, refetch: refetchProfile } = usePatientScope()
  const { page, limit, setPage } = usePagination({ page: 1, limit: 20 })
  const [status, setStatus] = useState("")
  const { data, isLoading, error, refetch } = useGetPrescriptionsQuery(
    { page, limit, status: status || undefined },
    { skip: !patientId }
  )
  const prescriptions = data?.data?.prescriptions || []
  const pagination = data?.pagination
  const columns = useMemo(
    () => [
      { header: "Doctor", cell: ({ row }) => <span className="font-medium text-slate-900">{row.original.doctor_name || "-"}</span> },
      { header: "Created", cell: ({ row }) => <span className="text-sm text-slate-800">{formatDate(row.original.created_at)}</span> },
      { header: "Status", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
      {
        header: "",
        cell: ({ row }) => (
          <div className="flex justify-end">
            <Button variant="secondary" size="sm" as={Link} to={`${PATIENT_ROUTES.PRESCRIPTIONS}/${row.original.id}`}>
              View
            </Button>
          </div>
        )
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
      <div>
        <h1 className="text-lg font-semibold text-slate-900">My prescriptions</h1>
        <p className="text-sm text-slate-600">Medicines prescribed during your visits.</p>
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
      <DataTable columns={columns} data={prescriptions} emptyTitle="No prescriptions" emptyDescription="You have no prescriptions on record." />
      <Pagination page={pagination?.page || page} totalPages={pagination?.totalPages} onPageChange={setPage} />
    </div>
  )
}
