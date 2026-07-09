import { Link, useParams } from "react-router-dom"
import { useGetPatientEmrQuery } from "@/api/patients.api"
import PageLoader from "@/components/feedback/PageLoader"
import ErrorState from "@/components/ui/ErrorState"
import Card from "@/components/ui/Card"
import Button from "@/components/ui/Button"
import DataTable from "@/components/data-display/DataTable"
import { useMemo } from "react"
import PatientHealthRecordsPanel from "@/components/domain/PatientHealthRecordsPanel"
import { useCurrentRole } from "@/hooks/useRoleAccess"
import { ROLES } from "@/constants/roles"
import { getRolePatientBase } from "@/utils/patientPaths"

function roleBasePath(role) {
  return getRolePatientBase(role)
}

const PATIENT_DETAIL_ROLES = new Set([ROLES.RECEPTIONIST, ROLES.DOCTOR, ROLES.NURSE])

export default function PatientEmrPage() {
  const { id } = useParams()
  const role = useCurrentRole()
  const basePath = roleBasePath(role)

  const { data, isLoading, error, refetch } = useGetPatientEmrQuery(id, { skip: !id })
  const payload = data?.data
  const patient = payload?.patient

  const vitals = payload?.vitals || []
  const consultations = payload?.consultations || []
  const appointments = payload?.appointments || []

  const vitalsColumns = useMemo(
    () => [
      { header: "Recorded", cell: ({ row }) => String(row.original.recorded_at || "").replace("T", " ").slice(0, 16) || "-" },
      { header: "BP", cell: ({ row }) => row.original.bp_systolic ? `${row.original.bp_systolic}/${row.original.bp_diastolic || "-"}` : "-" },
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

  const apptColumns = useMemo(
    () => [
      { header: "Date", cell: ({ row }) => row.original.appointment_date || "-" },
      { header: "Time", cell: ({ row }) => String(row.original.slot_time || "").slice(0, 5) || "-" },
      { header: "Status", cell: ({ row }) => row.original.status || "-" },
      { header: "Chief complaint", cell: ({ row }) => row.original.chief_complaint || "-" }
    ],
    []
  )

  if (isLoading) return <PageLoader />
  if (error) return <ErrorState error={error?.data || error} onRetry={refetch} />
  if (!patient) return <ErrorState title="Patient not found" />

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Patient EMR</h1>
          <p className="text-sm text-slate-600">
            {patient.full_name || patient.fullName || "Patient"} • MRN {patient.mrn || "-"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            as={Link}
            to={PATIENT_DETAIL_ROLES.has(role) ? `${basePath}/patients/${patient.id}` : basePath}
          >
            Back
          </Button>
        </div>
      </div>

      <Card className="p-6">
        <h2 className="text-sm font-semibold text-slate-900">Vitals</h2>
        <div className="mt-3">
          <DataTable columns={vitalsColumns} data={vitals} emptyTitle="No vitals" emptyDescription="No vitals recorded." />
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-sm font-semibold text-slate-900">Consultations</h2>
        <div className="mt-3">
          <DataTable columns={consultColumns} data={consultations} emptyTitle="No consultations" emptyDescription="No consultations found." />
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-sm font-semibold text-slate-900">Appointments</h2>
        <div className="mt-3">
          <DataTable columns={apptColumns} data={appointments} emptyTitle="No appointments" emptyDescription="No appointments found." />
        </div>
      </Card>

      <PatientHealthRecordsPanel patientId={patient.id} role={role} />
    </div>
  )
}
