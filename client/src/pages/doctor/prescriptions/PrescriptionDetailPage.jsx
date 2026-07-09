import { Link, useParams } from "react-router-dom"
import { useGetPrescriptionQuery } from "@/api/prescriptions.api"
import { DOCTOR_ROUTES } from "@/constants/routes"
import PageLoader from "@/components/feedback/PageLoader"
import ErrorState from "@/components/ui/ErrorState"
import Button from "@/components/ui/Button"
import Card from "@/components/ui/Card"
import StatusBadge from "@/components/data-display/StatusBadge"

function formatDate(value) {
  return String(value || "").replace("T", " ").slice(0, 16) || "-"
}

export default function PrescriptionDetailPage() {
  const { id } = useParams()
  const { data, isLoading, error, refetch } = useGetPrescriptionQuery(id, { skip: !id })
  const prescription = data?.data?.prescription
  const items = prescription?.items || []

  if (isLoading) return <PageLoader />
  if (error) return <ErrorState error={error?.data || error} onRetry={refetch} />
  if (!prescription) return <ErrorState title="Prescription not found" />

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Prescription</h1>
          <p className="text-sm text-slate-600">Read-only prescription details.</p>
        </div>
        <Button variant="secondary" as={Link} to={DOCTOR_ROUTES.PRESCRIPTIONS}>
          Back
        </Button>
      </div>
      <Card className="p-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Patient</p>
            <p className="mt-1 font-medium text-slate-900">{prescription.patient_name || "-"}</p>
            <p className="text-sm text-slate-600">MRN {prescription.patient_mrn || "-"}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Status</p>
            <div className="mt-1">
              <StatusBadge status={prescription.status} />
            </div>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Created</p>
            <p className="mt-1 text-sm text-slate-900">{formatDate(prescription.created_at)}</p>
          </div>
          {prescription.consultation_id && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Consultation</p>
              <Link
                className="mt-1 inline-block text-sm font-medium text-teal-700 hover:text-teal-800"
                to={`${DOCTOR_ROUTES.CONSULTATIONS}/${prescription.consultation_id}`}
              >
                View consultation
              </Link>
            </div>
          )}
        </div>
        {prescription.notes && (
          <p className="mt-4 text-sm text-slate-700">
            <span className="font-medium text-slate-900">Notes: </span>
            {prescription.notes}
          </p>
        )}
      </Card>
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-900">Items</h2>
        {items.length === 0 ? (
          <Card className="p-6 text-center text-sm text-slate-600">No items on this prescription.</Card>
        ) : (
          items.map((item) => (
            <Card key={item.id} className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-slate-900">{item.medicine_name}</p>
                  {item.generic_name && <p className="text-xs text-slate-600">{item.generic_name}</p>}
                  <p className="mt-1 text-sm text-slate-700">
                    {[item.dosage, item.frequency, item.duration].filter(Boolean).join(" • ") || "No dosage details"}
                  </p>
                  {item.instructions && <p className="mt-1 text-xs text-slate-600">{item.instructions}</p>}
                </div>
                <div className="text-right text-sm text-slate-700">
                  <p>Qty: {item.quantity ?? "-"}</p>
                  {item.dispensed_quantity != null && (
                    <p className="text-slate-600">Dispensed: {item.dispensed_quantity}</p>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
