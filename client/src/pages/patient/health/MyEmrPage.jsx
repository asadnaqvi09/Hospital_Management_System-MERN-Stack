import { useMemo } from "react"
import { Link } from "react-router-dom"
import { useGetPatientEmrQuery } from "@/api/patients.api"
import { usePatientScope } from "@/hooks/usePatientScope"
import { PATIENT_ROUTES } from "@/constants/routes"
import PageLoader from "@/components/feedback/PageLoader"
import ErrorState from "@/components/ui/ErrorState"
import Card from "@/components/ui/Card"
import Button from "@/components/ui/Button"
import DataTable from "@/components/data-display/DataTable"

export default function MyEmrPage() {
  const { patient, patientId, isLoading: profileLoading, error: profileError, refetch: refetchProfile } = usePatientScope()
  const { data, isLoading, error, refetch } = useGetPatientEmrQuery(patientId, { skip: !patientId })
  const payload = data?.data
  const vitals = payload?.vitals || []
  const consultations = payload?.consultations || []
  const conditions = payload?.conditions || []
  const appointments = payload?.appointments || []
  const vitalsColumns = useMemo(
    () => [
      { header: "Recorded", cell: ({ row }) => String(row.original.recorded_at || "").replace("T", " ").slice(0, 16) || "-" },
      { header: "BP", cell: ({ row }) => (row.original.bp_systolic ? `${row.original.bp_systolic}/${row.original.bp_diastolic || "-"}` : "-") },
      { header: "HR", cell: ({ row }) => row.original.heart_rate ?? "-" },
      { header: "SpO2", cell: ({ row }) => row.original.spo2 ?? "-" },
      { header: "Temp", cell: ({ row }) => row.original.temperature ?? "-" }
    ],
    []
  )
  const consultColumns = useMemo(
    () => [
      { header: "Date", cell: ({ row }) => String(row.original.created_at || "").slice(0, 10) || "-" },
      { header: "Diagnosis", cell: ({ row }) => row.original.diagnosis_text || "-" },
      { header: "Follow-up", cell: ({ row }) => row.original.follow_up_date || "-" }
    ],
    []
  )
  const conditionColumns = useMemo(
    () => [
      { header: "Condition", cell: ({ row }) => row.original.condition_name || "-" },
      { header: "ICD", cell: ({ row }) => row.original.icd_code || "-" },
      { header: "Status", cell: ({ row }) => row.original.status || "-" },
      { header: "Diagnosed", cell: ({ row }) => row.original.diagnosed_date || "-" }
    ],
    []
  )
  const apptColumns = useMemo(
    () => [
      { header: "Date", cell: ({ row }) => row.original.appointment_date || "-" },
      { header: "Time", cell: ({ row }) => String(row.original.slot_time || "").slice(0, 5) || "-" },
      { header: "Status", cell: ({ row }) => row.original.status || "-" },
      { header: "Chief complaint", cell: ({ row }) => row.original.chief_complaint || "-" }
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
          <h1 className="text-lg font-semibold text-slate-900">My health record</h1>
          <p className="text-sm text-slate-600">
            {patient?.full_name || patient?.fullName || "Patient"} • MRN {patient?.mrn || "-"}
          </p>
        </div>
        <Button variant="secondary" as={Link} to={PATIENT_ROUTES.DASHBOARD}>
          Back
        </Button>
      </div>
      <Card className="p-6">
        <h2 className="text-sm font-semibold text-slate-900">Conditions</h2>
        <div className="mt-3">
          <DataTable columns={conditionColumns} data={conditions} emptyTitle="No conditions" emptyDescription="No chronic conditions on file." />
        </div>
      </Card>
      <Card className="p-6">
        <h2 className="text-sm font-semibold text-slate-900">Vitals</h2>
        <div className="mt-3">
          <DataTable columns={vitalsColumns} data={vitals} emptyTitle="No vitals" emptyDescription="No vitals recorded yet." />
        </div>
      </Card>
      <Card className="p-6">
        <h2 className="text-sm font-semibold text-slate-900">Consultations</h2>
        <div className="mt-3">
          <DataTable columns={consultColumns} data={consultations} emptyTitle="No consultations" emptyDescription="No consultation history yet." />
        </div>
      </Card>
      <Card className="p-6">
        <h2 className="text-sm font-semibold text-slate-900">Appointments</h2>
        <div className="mt-3">
          <DataTable columns={apptColumns} data={appointments} emptyTitle="No appointments" emptyDescription="No appointment history yet." />
        </div>
      </Card>
    </div>
  )
}
