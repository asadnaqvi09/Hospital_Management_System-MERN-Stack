import { Link, useParams } from "react-router-dom"
import { useGetPatientQuery } from "@/api/patients.api"
import PageLoader from "@/components/feedback/PageLoader"
import ErrorState from "@/components/ui/ErrorState"
import Card from "@/components/ui/Card"
import Button from "@/components/ui/Button"
import { useCurrentRole } from "@/hooks/useRoleAccess"
import { ROLES } from "@/constants/roles"

function roleBasePath(role) {
  if (role === ROLES.DOCTOR) return "/doctor"
  if (role === ROLES.NURSE) return "/nurse"
  if (role === ROLES.ADMIN) return "/admin"
  return "/reception"
}
export default function PatientDetailPage() {
  const { id } = useParams()
  const { data, isLoading, error, refetch } = useGetPatientQuery(id, { skip: !id })
  const patient = data?.data?.patient
  const role = useCurrentRole()
  const basePath = roleBasePath(role)
  const canBook = role === ROLES.RECEPTIONIST || role === ROLES.ADMIN
  if (isLoading) return <PageLoader />
  if (error) return <ErrorState error={error?.data || error} onRetry={refetch} />
  if (!patient) return <ErrorState title="Patient not found" />
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">{patient.full_name || patient.fullName || "Patient"}</h1>
          <p className="text-sm text-slate-600">MRN {patient.mrn || "-"}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" as={Link} to={`${basePath}/patients/${patient.id}/emr`}>
            View EMR
          </Button>
          <Button variant="secondary" as={Link} to={`${basePath}/patients`}>
            Back
          </Button>
          {canBook && (
            <Button as={Link} to={`/reception/appointments/new?patientId=${patient.id}`}>
              Book appointment
            </Button>
          )}
        </div>
      </div>
      <Card className="p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Phone</p>
            <p className="mt-1 text-sm text-slate-900">{patient.phone || "-"}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">CNIC</p>
            <p className="mt-1 text-sm text-slate-900">{patient.cnic || "-"}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Gender</p>
            <p className="mt-1 text-sm text-slate-900">{patient.gender || "-"}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Date of birth</p>
            <p className="mt-1 text-sm text-slate-900">{patient.date_of_birth || patient.dateOfBirth || "-"}</p>
          </div>
          <div className="md:col-span-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Address</p>
            <p className="mt-1 text-sm text-slate-900">{patient.address || "-"}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Emergency contact</p>
            <p className="mt-1 text-sm text-slate-900">{patient.emergency_contact_name || patient.emergencyContactName || "-"}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Emergency phone</p>
            <p className="mt-1 text-sm text-slate-900">{patient.emergency_contact_phone || patient.emergencyContactPhone || "-"}</p>
          </div>
        </div>
      </Card>
    </div>
  )
}
