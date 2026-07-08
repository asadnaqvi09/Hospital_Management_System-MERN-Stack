import { Users, Stethoscope, Pill, FlaskConical } from "lucide-react"
import { useGetUsersQuery } from "@/api/users.api"
import { useGetDoctorsQuery } from "@/api/doctors.api"
import { useGetMedicinesQuery } from "@/api/medicines.api"
import { useGetLabTestsQuery } from "@/api/lab.api"
import PageLoader from "@/components/feedback/PageLoader"
import ErrorState from "@/components/ui/ErrorState"
import StatCard from "@/components/data-display/StatCard"
export default function AdminDashboardPage() {
  const users = useGetUsersQuery({ page: 1, limit: 1 })
  const doctors = useGetDoctorsQuery()
  const medicines = useGetMedicinesQuery({ page: 1, limit: 1 })
  const labTests = useGetLabTestsQuery()

  const isLoading = users.isLoading || doctors.isLoading || medicines.isLoading || labTests.isLoading
  const error = users.error || doctors.error || medicines.error || labTests.error

  if (isLoading) return <PageLoader />
  if (error) return <ErrorState error={error?.data || error} onRetry={() => { users.refetch(); doctors.refetch(); medicines.refetch(); labTests.refetch() }} />

  const totalUsers = users.data?.pagination?.total ?? users.data?.data?.users?.length ?? 0
  const totalDoctors = doctors.data?.data?.doctors?.length ?? 0
  const totalMedicines = medicines.data?.pagination?.total ?? medicines.data?.data?.medicines?.length ?? 0
  const totalLabTests = labTests.data?.data?.tests?.length ?? 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-slate-600">System overview</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Users" value={totalUsers} icon={Users} />
        <StatCard label="Doctors" value={totalDoctors} icon={Stethoscope} />
        <StatCard label="Medicines" value={totalMedicines} icon={Pill} />
        <StatCard label="Lab Tests" value={totalLabTests} icon={FlaskConical} />
      </div>
    </div>
  )
}
