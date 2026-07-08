import { useMemo, useState } from "react"
import { useParams } from "react-router-dom"
import { z } from "zod"
import { toast } from "sonner"
import { useGetDoctorScheduleQuery, useSetDoctorScheduleMutation } from "@/api/doctors.api"
import PageLoader from "@/components/feedback/PageLoader"
import ErrorState from "@/components/ui/ErrorState"
import Button from "@/components/ui/Button"
import Input from "@/components/ui/Input"
import FormField from "@/components/forms/FormField"
import { parseApiError } from "@/utils/parseApiError"
export default function DoctorSchedulePage() {
  return <DoctorSchedule />
}

const timePattern = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/
const schema = z.object({
  schedule: z
    .array(
      z.object({
        dayOfWeek: z.number().int().min(0).max(6),
        startTime: z.string().regex(timePattern),
        endTime: z.string().regex(timePattern),
        slotDuration: z.number().int().min(5).max(120).optional(),
        maxPatients: z.number().int().min(1).max(200).optional()
      })
    )
    .min(1)
})

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

function DoctorSchedule() {
  const { id } = useParams()
  const { data, isLoading, error, refetch } = useGetDoctorScheduleQuery(id)
  const [save, { isLoading: isSaving }] = useSetDoctorScheduleMutation()
  const initial = useMemo(() => data?.data?.schedule || [], [data])
  const [schedule, setSchedule] = useState(initial)
  const [formError, setFormError] = useState("")

  if (isLoading) return <PageLoader />
  if (error) return <ErrorState error={error?.data || error} onRetry={refetch} />

  const addRow = () => setSchedule((s) => [...s, { dayOfWeek: 1, startTime: "09:00", endTime: "17:00", slotDuration: 15, maxPatients: 20 }])
  const removeRow = (idx) => setSchedule((s) => s.filter((_, i) => i !== idx))
  const updateRow = (idx, patch) => setSchedule((s) => s.map((row, i) => (i === idx ? { ...row, ...patch } : row)))

  const onSubmit = async () => {
    setFormError("")
    const parsed = schema.safeParse({
      schedule: schedule.map((r) => ({
        ...r,
        dayOfWeek: Number(r.dayOfWeek),
        slotDuration: r.slotDuration === "" || r.slotDuration === undefined ? undefined : Number(r.slotDuration),
        maxPatients: r.maxPatients === "" || r.maxPatients === undefined ? undefined : Number(r.maxPatients)
      }))
    })
    if (!parsed.success) {
      setFormError("Please fix schedule entries")
      return
    }
    try {
      const res = await save({ doctorId: id, schedule: parsed.data.schedule }).unwrap()
      toast.success(res?.message || "Schedule updated")
    } catch (err) {
      toast.error(parseApiError(err?.data || err))
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Doctor Schedule</h1>
          <p className="mt-1 text-sm text-slate-600">Weekly schedule entries</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={addRow}>Add</Button>
          <Button onClick={onSubmit} disabled={isSaving}>{isSaving ? "Saving..." : "Save"}</Button>
        </div>
      </div>
      {formError && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</div>}
      <div className="space-y-3">
        {schedule.map((row, idx) => (
          <div key={idx} className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="grid gap-3 md:grid-cols-5">
              <FormField label="Day" htmlFor={`day-${idx}`}>
                <select
                  id={`day-${idx}`}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                  value={row.dayOfWeek}
                  onChange={(e) => updateRow(idx, { dayOfWeek: Number(e.target.value) })}
                >
                  {DAYS.map((d, i) => (
                    <option key={d} value={i}>
                      {d}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField label="Start" htmlFor={`start-${idx}`}>
                <Input id={`start-${idx}`} value={row.startTime || ""} onChange={(e) => updateRow(idx, { startTime: e.target.value })} />
              </FormField>
              <FormField label="End" htmlFor={`end-${idx}`}>
                <Input id={`end-${idx}`} value={row.endTime || ""} onChange={(e) => updateRow(idx, { endTime: e.target.value })} />
              </FormField>
              <FormField label="Slot (min)" htmlFor={`slot-${idx}`}>
                <Input id={`slot-${idx}`} inputMode="numeric" value={row.slotDuration ?? ""} onChange={(e) => updateRow(idx, { slotDuration: e.target.value })} />
              </FormField>
              <FormField label="Max patients" htmlFor={`max-${idx}`}>
                <Input id={`max-${idx}`} inputMode="numeric" value={row.maxPatients ?? ""} onChange={(e) => updateRow(idx, { maxPatients: e.target.value })} />
              </FormField>
            </div>
            <div className="mt-4 flex justify-end">
              <Button variant="danger" size="sm" onClick={() => removeRow(idx)}>
                Remove
              </Button>
            </div>
          </div>
        ))}
        {schedule.length === 0 && (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-600">
            No schedule entries. Add one to begin.
          </div>
        )}
      </div>
    </div>
  )
}
