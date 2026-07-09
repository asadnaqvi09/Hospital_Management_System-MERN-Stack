import { useMemo } from "react"
import { Link } from "react-router-dom"
import { useGetPatientVitalsQuery } from "@/api/patients.api"
import { usePatientScope } from "@/hooks/usePatientScope"
import { PATIENT_ROUTES } from "@/constants/routes"
import DataTable from "@/components/data-display/DataTable"
import PageLoader from "@/components/feedback/PageLoader"
import ErrorState from "@/components/ui/ErrorState"
import Button from "@/components/ui/Button"

export default function MyVitalsPage() {
  const { patient, patientId, isLoading: profileLoading, error: profileError, refetch: refetchProfile } = usePatientScope()
  const { data, isLoading, error, refetch } = useGetPatientVitalsQuery(patientId, { skip: !patientId })
  const vitals = data?.data?.vitals || []
  const columns = useMemo(
    () => [
      { header: "Recorded", cell: ({ row }) => String(row.original.recorded_at || "").replace("T", " ").slice(0, 16) || "-" },
      { header: "BP", cell: ({ row }) => (row.original.bp_systolic ? `${row.original.bp_systolic}/${row.original.bp_diastolic || "-"}` : "-") },
      { header: "HR", cell: ({ row }) => row.original.heart_rate ?? "-" },
      { header: "SpO2", cell: ({ row }) => row.original.spo2 ?? "-" },
      { header: "Temp", cell: ({ row }) => row.original.temperature ?? "-" },
      { header: "Weight", cell: ({ row }) => row.original.weight_kg ?? "-" }
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
          <h1 className="text-lg font-semibold text-slate-900">My vitals</h1>
          <p className="text-sm text-slate-600">
            {patient?.full_name || patient?.fullName || "Patient"} • MRN {patient?.mrn || "-"}
          </p>
        </div>
        <Button variant="secondary" as={Link} to={PATIENT_ROUTES.DASHBOARD}>
          Back
        </Button>
      </div>
      <DataTable columns={columns} data={vitals} emptyTitle="No vitals" emptyDescription="No vitals have been recorded for you yet." />
    </div>
  )
}
