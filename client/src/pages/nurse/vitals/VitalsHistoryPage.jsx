import { useMemo } from "react"
import { Link, useLocation } from "react-router-dom"
import { useGetPatientQuery, useGetPatientVitalsQuery } from "@/api/patients.api"
import DataTable from "@/components/data-display/DataTable"
import PageLoader from "@/components/feedback/PageLoader"
import ErrorState from "@/components/ui/ErrorState"
import Button from "@/components/ui/Button"

function useQueryParam(name) {
  const { search } = useLocation()
  return useMemo(() => new URLSearchParams(search).get(name), [search, name])
}

export default function VitalsHistoryPage() {
  const patientId = useQueryParam("patientId") || ""
  const { data: patientRes } = useGetPatientQuery(patientId, { skip: !patientId })
  const patient = patientRes?.data?.patient
  const { data, isLoading, error, refetch } = useGetPatientVitalsQuery(patientId, { skip: !patientId })
  const vitals = data?.data?.vitals || []

  const columns = useMemo(
    () => [
      { header: "Recorded", cell: ({ row }) => String(row.original.recorded_at || "").replace("T", " ").slice(0, 16) || "-" },
      { header: "BP", cell: ({ row }) => row.original.bp_systolic ? `${row.original.bp_systolic}/${row.original.bp_diastolic || "-"}` : "-" },
      { header: "HR", cell: ({ row }) => row.original.heart_rate ?? "-" },
      { header: "SpO2", cell: ({ row }) => row.original.spo2 ?? "-" },
      { header: "Temp", cell: ({ row }) => row.original.temperature ?? "-" },
      { header: "Weight", cell: ({ row }) => row.original.weight_kg ?? "-" }
    ],
    []
  )

  if (!patientId) return <ErrorState title="Patient is required" description="Open this page from the vitals form." />
  if (isLoading) return <PageLoader />
  if (error) return <ErrorState error={error?.data || error} onRetry={refetch} />

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Vitals History</h1>
          <p className="text-sm text-slate-600">
            {patient?.full_name || patient?.fullName || "Patient"} • MRN {patient?.mrn || "-"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" as={Link} to="/nurse/queue">
            Back
          </Button>
          <Button as={Link} to={`/nurse/vitals?patientId=${patientId}`}>
            Record
          </Button>
        </div>
      </div>
      <DataTable columns={columns} data={vitals} emptyTitle="No vitals" emptyDescription="No vitals recorded for this patient." />
    </div>
  )
}
