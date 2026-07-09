import { useMemo } from "react"
import { Link, useParams } from "react-router-dom"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { useAddNursingNoteMutation, useGetAdmissionNotesQuery, useGetAdmissionQuery } from "@/api/ipd.api"
import PageLoader from "@/components/feedback/PageLoader"
import ErrorState from "@/components/ui/ErrorState"
import Card from "@/components/ui/Card"
import Button from "@/components/ui/Button"
import FormField from "@/components/forms/FormField"
import Select from "@/components/ui/Select"
import { parseApiError } from "@/utils/parseApiError"
import EmptyState from "@/components/ui/EmptyState"

const schema = z.object({
  shift: z.enum(["morning", "afternoon", "night"]),
  note: z.string().min(1, "Note is required")
})

export default function AdmissionNotesPage() {
  const { id } = useParams()
  const admissionId = id || ""

  const { data: admissionRes, isLoading: isAdmissionLoading, error: admissionError, refetch: refetchAdmission } = useGetAdmissionQuery(admissionId, { skip: !admissionId })
  const admission = admissionRes?.data?.admission

  const { data: notesRes, isLoading: isNotesLoading, error: notesError, refetch: refetchNotes } = useGetAdmissionNotesQuery(admissionId, { skip: !admissionId })
  const notes = notesRes?.data?.notes || []

  const [addNote, { isLoading: isSaving }] = useAddNursingNoteMutation()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { shift: "morning", note: "" }
  })

  const onSubmit = async (values) => {
    if (!admissionId) return
    const payload = { admissionId, shift: values.shift, note: values.note }
    try {
      const res = await addNote(payload).unwrap()
      toast.success(res?.message || "Note added")
      reset({ shift: values.shift, note: "" })
    } catch (e) {
      toast.error(parseApiError(e?.data || e))
      console.error("addNursingNote failed", { admissionId, payload, error: e })
    }
  }

  const header = useMemo(() => {
    const patientName = admission?.patient_name || "Patient"
    const patientMrn = admission?.patient_mrn || "-"
    const ward = admission?.ward || "-"
    const room = admission?.room_number || "-"
    return { patientName, patientMrn, ward, room }
  }, [admission])

  if (!admissionId) return <ErrorState title="Admission is required" description="Open this page from the admissions list." />
  if (isAdmissionLoading || isNotesLoading) return <PageLoader />
  if (admissionError) return <ErrorState error={admissionError?.data || admissionError} onRetry={refetchAdmission} />
  if (notesError) return <ErrorState error={notesError?.data || notesError} onRetry={refetchNotes} />

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Nursing Notes</h1>
          <p className="text-sm text-slate-600">
            {header.patientName} • MRN {header.patientMrn} • {header.ward} • Room {header.room}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" as={Link} to="/nurse/ipd">
            Back
          </Button>
          <Button variant="secondary" onClick={() => { refetchAdmission(); refetchNotes() }}>
            Refresh
          </Button>
        </div>
      </div>

      <Card className="p-6">
        <h2 className="text-sm font-semibold text-slate-900">Add note</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <FormField label="Shift" htmlFor="shift" error={errors.shift?.message}>
              <Select
                id="shift"
                {...register("shift")}
                error={Boolean(errors.shift)}
                options={[
                  { value: "morning", label: "Morning" },
                  { value: "afternoon", label: "Afternoon" },
                  { value: "night", label: "Night" }
                ]}
              />
            </FormField>
            <div className="md:col-span-2" />
          </div>
          <FormField label="Note" htmlFor="note" error={errors.note?.message}>
            <textarea
              id="note"
              rows={4}
              className={
                "w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-1 " +
                (errors.note ? "border-red-300 focus:border-red-500 focus:ring-red-500" : "border-slate-300 focus:border-teal-500 focus:ring-teal-500")
              }
              placeholder="Write nursing note..."
              {...register("note")}
            />
          </FormField>
          <div className="flex justify-end">
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : "Save note"}
            </Button>
          </div>
        </form>
      </Card>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-900">Notes</h2>
        {notes.length === 0 ? (
          <EmptyState title="No notes" description="No nursing notes recorded for this admission yet." />
        ) : (
          notes.map((n) => (
            <Card key={n.id} className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{n.nurse_name || "Nurse"}</p>
                  <p className="text-xs text-slate-600">
                    {String(n.recorded_at || "").replace("T", " ").slice(0, 16) || "-"} • {String(n.shift || "").toUpperCase()}
                  </p>
                </div>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm text-slate-800">{n.note || "-"}</p>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
