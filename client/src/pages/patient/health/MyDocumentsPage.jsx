import { Link } from "react-router-dom"
import { ExternalLink } from "lucide-react"
import { useGetPatientDocumentsQuery } from "@/api/patients.api"
import { usePatientScope } from "@/hooks/usePatientScope"
import { PATIENT_ROUTES } from "@/constants/routes"
import PageLoader from "@/components/feedback/PageLoader"
import ErrorState from "@/components/ui/ErrorState"
import Button from "@/components/ui/Button"
import Card from "@/components/ui/Card"

function formatDate(value) {
  return String(value || "").replace("T", " ").slice(0, 16) || "-"
}

function formatSize(bytes) {
  const size = Number(bytes)
  if (!size || Number.isNaN(size)) return "-"
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

export default function MyDocumentsPage() {
  const { patient, patientId, isLoading: profileLoading, error: profileError, refetch: refetchProfile } = usePatientScope()
  const { data, isLoading, error, refetch } = useGetPatientDocumentsQuery(patientId, { skip: !patientId })
  const documents = data?.data?.documents || []
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
          <h1 className="text-lg font-semibold text-slate-900">My documents</h1>
          <p className="text-sm text-slate-600">Files uploaded to your medical record.</p>
        </div>
        <Button variant="secondary" as={Link} to={PATIENT_ROUTES.DASHBOARD}>
          Back
        </Button>
      </div>
      {documents.length === 0 ? (
        <Card className="p-8 text-center text-sm text-slate-600">No documents on file.</Card>
      ) : (
        <div className="space-y-3">
          {documents.map((doc) => (
            <Card key={doc.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <p className="font-medium text-slate-900">{doc.title || "Untitled document"}</p>
                <p className="mt-0.5 text-sm text-slate-600">
                  {formatDate(doc.created_at)} • {formatSize(doc.size_bytes)}
                </p>
              </div>
              {doc.file_url ? (
                <Button variant="secondary" size="sm" as="a" href={doc.file_url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-1.5 h-4 w-4" />
                  Open
                </Button>
              ) : (
                <span className="text-sm text-slate-500">Unavailable</span>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
