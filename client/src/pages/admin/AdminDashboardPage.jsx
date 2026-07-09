import { Link } from "react-router-dom"
import { Users, Stethoscope, Pill, FlaskConical, Bed, Calendar, DollarSign } from "lucide-react"
import { useGetUsersQuery } from "@/api/users.api"
import { useGetDoctorsQuery } from "@/api/doctors.api"
import { useGetMedicinesQuery } from "@/api/medicines.api"
import { useGetLabTestsQuery } from "@/api/lab.api"
import {
  useGetBedOccupancyReportQuery,
  useGetAppointmentAnalyticsQuery,
  useGetRevenueReportQuery,
  useGetDoctorPerformanceReportQuery
} from "@/api/reports.api"
import { ADMIN_ROUTES } from "@/constants/routes"
import PageLoader from "@/components/feedback/PageLoader"
import ErrorState from "@/components/ui/ErrorState"
import StatCard from "@/components/data-display/StatCard"
import Card from "@/components/ui/Card"
import Button from "@/components/ui/Button"
import { formatCurrency } from "@/utils/formatCurrency"

export default function AdminDashboardPage() {
  const users = useGetUsersQuery({ page: 1, limit: 1 })
  const doctors = useGetDoctorsQuery()
  const medicines = useGetMedicinesQuery({ page: 1, limit: 1 })
  const labTests = useGetLabTestsQuery()
  const bedOccupancy = useGetBedOccupancyReportQuery({})
  const appointments = useGetAppointmentAnalyticsQuery({})
  const revenue = useGetRevenueReportQuery({})
  const doctorPerformance = useGetDoctorPerformanceReportQuery({})
  const queries = [users, doctors, medicines, labTests, bedOccupancy, appointments, revenue, doctorPerformance]
  const isLoading = queries.some((q) => q.isLoading)
  const error = queries.find((q) => q.error)?.error
  const refetchAll = () => queries.forEach((q) => q.refetch())
  if (isLoading) return <PageLoader />
  if (error) return <ErrorState error={error?.data || error} onRetry={refetchAll} />
  const totalUsers = users.data?.pagination?.total ?? 0
  const totalDoctors = doctors.data?.data?.doctors?.length ?? 0
  const totalMedicines = medicines.data?.pagination?.total ?? 0
  const totalLabTests = labTests.data?.data?.tests?.length ?? 0
  const occupancy = bedOccupancy.data?.data?.summary || {}
  const apptSummary = appointments.data?.data?.summary || {}
  const revenueSummary = revenue.data?.data?.summary || {}
  const topDoctors = (doctorPerformance.data?.data?.rows || []).slice(0, 5)
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Admin dashboard</h1>
          <p className="mt-1 text-sm text-slate-600">System overview and operational KPIs.</p>
        </div>
        <Button variant="secondary" as={Link} to={ADMIN_ROUTES.REPORTS}>
          Reports hub
        </Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Users" value={totalUsers} icon={Users} />
        <StatCard label="Doctors" value={totalDoctors} icon={Stethoscope} />
        <StatCard label="Medicines" value={totalMedicines} icon={Pill} />
        <StatCard label="Lab tests" value={totalLabTests} icon={FlaskConical} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Bed occupancy"
          value={`${occupancy.overall_occupancy_rate ?? 0}%`}
          icon={Bed}
          trend={`${occupancy.occupied_beds ?? 0} / ${occupancy.total_beds ?? 0} beds`}
        />
        <StatCard label="Appointments (period)" value={apptSummary.total_appointments ?? 0} icon={Calendar} />
        <StatCard label="Completed visits" value={apptSummary.completed ?? 0} icon={Calendar} trend={`${apptSummary.cancelled ?? 0} cancelled`} />
        <StatCard
          label="Revenue (period)"
          value={formatCurrency(revenueSummary.total_revenue || 0)}
          icon={DollarSign}
          trend={`${revenueSummary.total_payments ?? 0} payments`}
        />
      </div>
      <Card className="p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-slate-900">Top doctors by completed visits</h2>
          <Button variant="secondary" size="sm" as={Link} to={`${ADMIN_ROUTES.REPORTS}/doctor-performance`}>
            Full report
          </Button>
        </div>
        {topDoctors.length === 0 ? (
          <p className="mt-4 text-sm text-slate-600">No performance data yet.</p>
        ) : (
          <div className="mt-4 divide-y divide-slate-100">
            {topDoctors.map((row) => (
              <div key={row.doctor_id} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                <div>
                  <p className="font-medium text-slate-900">{row.doctor_name || "Doctor"}</p>
                  <p className="text-sm text-slate-600">{row.department || "General"}</p>
                </div>
                <p className="text-sm font-medium text-slate-800">{row.completed_appointments ?? 0} completed</p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
