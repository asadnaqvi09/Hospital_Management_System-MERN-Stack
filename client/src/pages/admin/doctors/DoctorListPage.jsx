import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { useGetDoctorsQuery } from "@/api/doctors.api"
import DataTable from "@/components/data-display/DataTable"
import PageLoader from "@/components/feedback/PageLoader"
import ErrorState from "@/components/ui/ErrorState"
import Button from "@/components/ui/Button"
import SearchInput from "@/components/forms/SearchInput"
export default function DoctorListPage() {
  return <DoctorsList />
}

function DoctorsList() {
  const [search, setSearch] = useState("")
  const { data, isLoading, error, refetch } = useGetDoctorsQuery({ search: search || undefined })
  const doctors = data?.data?.doctors || []

  const columns = useMemo(
    () => [
      {
        header: "Doctor",
        cell: ({ row }) => (
          <Link to={`/admin/doctors/${row.original.id}`} className="font-medium text-teal-700 hover:text-teal-800">
            {row.original.full_name || row.original.fullName || row.original.email || "Doctor"}
          </Link>
        )
      },
      { header: "Specialization", cell: ({ row }) => row.original.specialization || "-" },
      { header: "Department", cell: ({ row }) => row.original.department || "-" },
      { header: "Fee", cell: ({ row }) => (row.original.consultation_fee ?? row.original.consultationFee ?? "-") },
      {
        header: "",
        cell: ({ row }) => (
          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="sm" as={Link} to={`/admin/doctors/${row.original.id}`}>
              View
            </Button>
            <Button variant="secondary" size="sm" as={Link} to={`/admin/doctors/${row.original.id}/schedule`}>
              Schedule
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
        <h1 className="text-lg font-semibold text-slate-900">Doctors</h1>
        <div className="flex items-center gap-2">
          <SearchInput placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-[260px]" />
          <Button as={Link} to="/admin/doctors/new">
            New doctor
          </Button>
        </div>
      </div>
      <DataTable columns={columns} data={doctors} emptyTitle="No doctors" emptyDescription="No doctors found." />
    </div>
  )
}
