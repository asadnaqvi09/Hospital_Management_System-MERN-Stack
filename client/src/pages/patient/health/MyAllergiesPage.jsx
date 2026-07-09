import { useMemo } from "react"
import { Link } from "react-router-dom"
import { useGetPatientAllergiesQuery } from "@/api/patients.api"
import { usePatientScope } from "@/hooks/usePatientScope"
import { PATIENT_ROUTES } from "@/constants/routes"
import DataTable from "@/components/data-display/DataTable"
import PageLoader from "@/components/feedback/PageLoader"
import ErrorState from "@/components/ui/ErrorState"
import Button from "@/components/ui/Button"
import Card from "@/components/ui/Card"

export default function MyAllergiesPage() {
  const { patient, patientId, isLoading: profileLoading, error: profileError, refetch: refetchProfile } = usePatientScope()
  const { data, isLoading, error, refetch } = useGetPatientAllergiesQuery(patientId, { skip: !patientId })
  const allergies = data?.data?.allergies || []
  const columns = useMemo(
    () => [
      { header: "Allergen", cell: ({ row }) => <span className="font-medium text-slate-900">{row.original.allergen || "-"}</span> },
      { header: "Reaction", cell: ({ row }) => row.original.reaction || "-" },
      { header: "Severity", cell: ({ row }) => row.original.severity || "-" },
      { header: "Recorded", cell: ({ row }) => String(row.original.created_at || "").slice(0, 10) || "-" }
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
          <h1 className="text-lg font-semibold text-slate-900">My allergies</h1>
          <p className="text-sm text-slate-600">Read-only list recorded by your care team.</p>
        </div>
        <Button variant="secondary" as={Link} to={PATIENT_ROUTES.DASHBOARD}>
          Back
        </Button>
      </div>
      <Card className="p-4">
        <p className="text-sm text-slate-600">
          {patient?.full_name || patient?.fullName || "Patient"} • MRN {patient?.mrn || "-"}
        </p>
      </Card>
      <DataTable columns={columns} data={allergies} emptyTitle="No allergies" emptyDescription="No allergies are recorded on your profile." />
    </div>
  )
}
