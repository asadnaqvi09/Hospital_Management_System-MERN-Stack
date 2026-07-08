import { Link, useParams } from "react-router-dom"
import { useGetDoctorQuery } from "@/api/doctors.api"
import PageLoader from "@/components/feedback/PageLoader"
import ErrorState from "@/components/ui/ErrorState"
import Button from "@/components/ui/Button"
export default function DoctorDetailPage() {
  return <DoctorDetail />
}

function DoctorDetail() {
  const { id } = useParams()
  const { data, isLoading, error, refetch } = useGetDoctorQuery(id)
  if (isLoading) return <PageLoader />
  if (error) return <ErrorState error={error?.data || error} onRetry={refetch} />
  const doctor = data?.data?.doctor || data?.doctor || data
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">{doctor?.full_name || doctor?.fullName || "Doctor"}</h1>
          <p className="mt-1 text-sm text-slate-600">{doctor?.specialization || "-"}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" as={Link} to={`/admin/doctors/${doctor.id}/schedule`}>
            Manage schedule
          </Button>
          <Button variant="secondary" as={Link} to="/admin/doctors">
            Back
          </Button>
        </div>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Department</p>
            <p className="mt-1 text-sm font-medium text-slate-900">{doctor?.department || "-"}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Fee</p>
            <p className="mt-1 text-sm font-medium text-slate-900">{doctor?.consultation_fee ?? doctor?.consultationFee ?? "-"}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Experience</p>
            <p className="mt-1 text-sm font-medium text-slate-900">{doctor?.experience_years ?? doctor?.experienceYears ?? "-"}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">License</p>
            <p className="mt-1 text-sm font-medium text-slate-900">{doctor?.license_number ?? doctor?.licenseNumber ?? "-"}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
