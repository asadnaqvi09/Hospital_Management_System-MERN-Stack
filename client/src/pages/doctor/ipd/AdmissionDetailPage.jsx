import { useMemo, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { toast } from "sonner"
import {
  useDischargeAdmissionMutation,
  useGetAdmissionNotesQuery,
  useGetAdmissionQuery
} from "@/api/ipd.api"
import { ADMISSION_STATUS } from "@/constants/statuses"
import { DOCTOR_ROUTES } from "@/constants/routes"
import PageLoader from "@/components/feedback/PageLoader"
import ErrorState from "@/components/ui/ErrorState"
import EmptyState from "@/components/ui/EmptyState"
import Card from "@/components/ui/Card"
import Button from "@/components/ui/Button"
import FormField from "@/components/forms/FormField"
import StatusBadge from "@/components/data-display/StatusBadge"
import { parseApiError } from "@/utils/parseApiError"

function formatDate(value) {
  return String(value || "").replace("T", " ").slice(0, 16) || "-"
}

export default function AdmissionDetailPage() {
  const { id } = useParams()
  const admissionId = id || ""
  const { data: admissionRes, isLoading, error, refetch } = useGetAdmissionQuery(admissionId, { skip: !admissionId })
  const { data: notesRes, isLoading: notesLoading, error: notesError, refetch: refetchNotes } = useGetAdmissionNotesQuery(admissionId, { skip: !admissionId })
  const [discharge, { isLoading: isDischarging }] = useDischargeAdmissionMutation()
  const [dischargeSummary, setDischargeSummary] = useState("")
  const [dischargeMeds, setDischargeMeds] = useState("")
  const [followUpNotes, setFollowUpNotes] = useState("")
  const [dischargeError, setDischargeError] = useState("")

  const admission = admissionRes?.data?.admission
  const notes = notesRes?.data?.notes || []
  const isAdmitted = admission?.status === ADMISSION_STATUS.ADMITTED

  const header = useMemo(() => ({
    patientName: admission?.patient_name || "Patient",
    patientMrn: admission?.patient_mrn || "-",
    ward: admission?.ward || "-",
    room: admission?.room_number || "-",
    doctorName: admission?.doctor_name || "-"
  }), [admission])

  const onDischarge = async (e) => {
    e.preventDefault()
    if (!admissionId || !isAdmitted) return
    setDischargeError("")
    try {
      const res = await discharge({
        id: admissionId,
        dischargeSummary: dischargeSummary.trim() || undefined,
        dischargeMeds: dischargeMeds.trim() || undefined,
        followUpNotes: followUpNotes.trim() || undefined
      }).unwrap()
      toast.success(res?.message || "Patient discharged")
      refetch()
      refetchNotes()
    } catch (err) {
      setDischargeError(parseApiError(err?.data || err))
    }
  }

  if (!admissionId) return <ErrorState title="Admission is required" />
  if (isLoading || notesLoading) return <PageLoader />
  if (error) return <ErrorState error={error?.data || error} onRetry={refetch} />
  if (notesError) return <ErrorState error={notesError?.data || notesError} onRetry={refetchNotes} />
  if (!admission) return <ErrorState title="Admission not found" />

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Admission</h1>
          <p className="text-sm text-slate-600">
            {header.patientName} • MRN {header.patientMrn} • {header.ward} • Room {header.room}
          </p>
        </div>
        <Button variant="secondary" as={Link} to={DOCTOR_ROUTES.IPD}>
          Back
        </Button>
      </div>
      <Card className="p-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Admitting doctor</p>
            <p className="mt-1 text-sm text-slate-900">{header.doctorName}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Status</p>
            <div className="mt-1"><StatusBadge status={admission.status} /></div>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Admitted</p>
            <p className="mt-1 text-sm text-slate-900">{formatDate(admission.admission_date)}</p>
          </div>
          {admission.discharge_date && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Discharged</p>
              <p className="mt-1 text-sm text-slate-900">{formatDate(admission.discharge_date)}</p>
            </div>
          )}
        </div>
        {admission.admission_reason && (
          <p className="mt-4 text-sm text-slate-700">
            <span className="font-medium text-slate-900">Reason: </span>
            {admission.admission_reason}
          </p>
        )}
        {admission.discharge_summary && (
          <p className="mt-4 text-sm text-slate-700">
            <span className="font-medium text-slate-900">Discharge summary: </span>
            {admission.discharge_summary}
          </p>
        )}
      </Card>
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-900">Nursing notes</h2>
        {notes.length === 0 ? (
          <EmptyState title="No notes" description="No nursing notes recorded for this admission." />
        ) : (
          notes.map((n) => (
            <Card key={n.id} className="p-4">
              <p className="text-sm font-semibold text-slate-900">{n.nurse_name || "Nurse"}</p>
              <p className="text-xs text-slate-600">
                {formatDate(n.recorded_at)} • {String(n.shift || "").toUpperCase()}
              </p>
              <p className="mt-2 whitespace-pre-wrap text-sm text-slate-800">{n.note || "-"}</p>
            </Card>
          ))
        )}
      </div>
      {isAdmitted && (
        <Card className="p-6">
          <h2 className="text-sm font-semibold text-slate-900">Discharge patient</h2>
          <form onSubmit={onDischarge} className="mt-4 space-y-4">
            {dischargeError && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{dischargeError}</div>}
            <FormField label="Discharge summary" htmlFor="dischargeSummary">
              <textarea
                id="dischargeSummary"
                rows={3}
                value={dischargeSummary}
                onChange={(e) => setDischargeSummary(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
              />
            </FormField>
            <FormField label="Discharge medications" htmlFor="dischargeMeds">
              <textarea
                id="dischargeMeds"
                rows={2}
                value={dischargeMeds}
                onChange={(e) => setDischargeMeds(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
              />
            </FormField>
            <FormField label="Follow-up notes" htmlFor="followUpNotes">
              <textarea
                id="followUpNotes"
                rows={2}
                value={followUpNotes}
                onChange={(e) => setFollowUpNotes(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
              />
            </FormField>
            <div className="flex justify-end">
              <Button type="submit" variant="danger" disabled={isDischarging}>
                {isDischarging ? "Discharging..." : "Discharge patient"}
              </Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  )
}
