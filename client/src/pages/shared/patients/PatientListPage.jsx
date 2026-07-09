import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { useGetPatientsQuery } from "@/api/patients.api"
import DataTable from "@/components/data-display/DataTable"
import PageLoader from "@/components/feedback/PageLoader"
import ErrorState from "@/components/ui/ErrorState"
import Button from "@/components/ui/Button"
import SearchInput from "@/components/forms/SearchInput"
import Pagination from "@/components/ui/Pagination"
import { usePagination } from "@/hooks/usePagination"
import { useCurrentRole } from "@/hooks/useRoleAccess"
import { ROLES } from "@/constants/roles"
export default function PatientListPage() {
  return <PatientsList />
}
function roleBasePath(role) {
  if (role === ROLES.DOCTOR) return "/doctor"
  if (role === ROLES.NURSE) return "/nurse"
  return "/reception"
}
function PatientsList() {
  const role = useCurrentRole()
  const basePath = roleBasePath(role)
  const canCreate = role === ROLES.RECEPTIONIST || role === ROLES.ADMIN
  const [search, setSearch] = useState("")
  const { page, limit, setPage } = usePagination({ page: 1, limit: 20 })
  const { data, isLoading, error, refetch } = useGetPatientsQuery({
    search: search || undefined,
    page,
    limit
  })
  const patients = data?.data?.patients || []
  const pagination = data?.pagination
  const columns = useMemo(
    () => [
      {
        header: "Patient",
        cell: ({ row }) => (
          <Link to={`${basePath}/patients/${row.original.id}`} className="font-medium text-teal-700 hover:text-teal-800">
            {row.original.full_name || row.original.fullName || "Patient"}
          </Link>
        )
      },
      { header: "MRN", cell: ({ row }) => row.original.mrn || "-" },
      { header: "Phone", cell: ({ row }) => row.original.phone || "-" },
      { header: "Gender", cell: ({ row }) => row.original.gender || "-" },
      {
        header: "",
        cell: ({ row }) => (
          <div className="flex justify-end">
            <Button variant="secondary" size="sm" as={Link} to={`${basePath}/patients/${row.original.id}`}>
              View
            </Button>
          </div>
        )
      }
    ],
    [basePath]
  )
  if (isLoading) return <PageLoader />
  if (error) return <ErrorState error={error?.data || error} onRetry={refetch} />
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-semibold text-slate-900">Patients</h1>
        <div className="flex items-center gap-2">
          <SearchInput placeholder="Search patients..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} className="w-[260px]" />
          {canCreate && (
            <Button as={Link} to="/reception/patients/new">
              New patient
            </Button>
          )}
        </div>
      </div>
      <DataTable columns={columns} data={patients} emptyTitle="No patients" emptyDescription="No patients found." />
      <Pagination page={pagination?.page || page} totalPages={pagination?.totalPages} onPageChange={setPage} />
    </div>
  )
}
