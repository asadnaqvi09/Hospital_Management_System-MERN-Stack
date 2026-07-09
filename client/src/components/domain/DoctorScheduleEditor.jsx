import { useEffect, useState } from "react"
import { z } from "zod"
import { toast } from "sonner"
import { useGetDoctorScheduleQuery, useSetDoctorScheduleMutation } from "@/api/doctors.api"
import PageLoader from "@/components/feedback/PageLoader"
import ErrorState from "@/components/ui/ErrorState"
import Button from "@/components/ui/Button"
import Input from "@/components/ui/Input"
import FormField from "@/components/forms/FormField"
import { parseApiError } from "@/utils/parseApiError"

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

function normalizeRow(row) {
  const start = row.start_time ?? row.startTime ?? ""
  const end = row.end_time ?? row.endTime ?? ""
  return {
    dayOfWeek: row.day_of_week ?? row.dayOfWeek ?? 1,
    startTime: String(start).slice(0, 5),
    endTime: String(end).slice(0, 5),
    slotDuration: row.slot_duration ?? row.slotDuration ?? 15,
    maxPatients: row.max_patients ?? row.maxPatients ?? 20
  }
}

export default function DoctorScheduleEditor({ doctorId, title = "Weekly schedule", description = "Manage your availability by day." }) {
  const { data, isLoading, error, refetch } = useGetDoctorScheduleQuery(doctorId, { skip: !doctorId })
  const [save, { isLoading: isSaving }] = useSetDoctorScheduleMutation()
  const [schedule, setSchedule] = useState([])
  const [formError, setFormError] = useState("")
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    if (!data?.data) return
    setSchedule((data.data.schedule || []).map(normalizeRow))
    setInitialized(true)
  }, [data])

  const addRow = () =>
    setSchedule((s) => [...s, { dayOfWeek: 1, startTime: "09:00", endTime: "17:00", slotDuration: 15, maxPatients: 20 }])
  const removeRow = (idx) => setSchedule((s) => s.filter((_, i) => i !== idx))
  const updateRow = (idx, patch) => setSchedule((s) => s.map((row, i) => (i === idx ? { ...row, ...patch } : row)))

  const onSubmit = async () => {
    if (!doctorId) return
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
      setFormError("Please fix schedule entries before saving.")
      return
    }
    try {
      const res = await save({ doctorId, schedule: parsed.data.schedule }).unwrap()
      toast.success(res?.message || "Schedule updated")
    } catch (err) {
      toast.error(parseApiError(err?.data || err))
    }
  }

  if (!doctorId) return <ErrorState title="Doctor profile not found" description="Your account is not linked to a doctor profile." />
  if (isLoading || !initialized) return <PageLoader />
  if (error) return <ErrorState error={error?.data || error} onRetry={refetch} />

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
          <p className="mt-1 text-sm text-slate-600">{description}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={addRow}>Add slot</Button>
          <Button onClick={onSubmit} disabled={isSaving}>{isSaving ? "Saving..." : "Save"}</Button>
        </div>
      </div>
      {formError && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</div>}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-600">
              <th className="px-4 py-3">Day</th>
              <th className="px-4 py-3">Start</th>
              <th className="px-4 py-3">End</th>
              <th className="px-4 py-3">Slot (min)</th>
              <th className="px-4 py-3">Max patients</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {schedule.map((row, idx) => (
              <tr key={idx} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-3">
                  <select
                    className="w-full min-w-[5rem] rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                    value={row.dayOfWeek}
                    onChange={(e) => updateRow(idx, { dayOfWeek: Number(e.target.value) })}
                  >
                    {DAYS.map((d, i) => (
                      <option key={d} value={i}>{d}</option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <Input value={row.startTime || ""} onChange={(e) => updateRow(idx, { startTime: e.target.value })} />
                </td>
                <td className="px-4 py-3">
                  <Input value={row.endTime || ""} onChange={(e) => updateRow(idx, { endTime: e.target.value })} />
                </td>
                <td className="px-4 py-3">
                  <Input inputMode="numeric" value={row.slotDuration ?? ""} onChange={(e) => updateRow(idx, { slotDuration: e.target.value })} />
                </td>
                <td className="px-4 py-3">
                  <Input inputMode="numeric" value={row.maxPatients ?? ""} onChange={(e) => updateRow(idx, { maxPatients: e.target.value })} />
                </td>
                <td className="px-4 py-3 text-right">
                  <Button variant="danger" size="sm" onClick={() => removeRow(idx)}>Remove</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {schedule.length === 0 && (
          <div className="p-8 text-center text-sm text-slate-600">No schedule entries. Add a slot to begin.</div>
        )}
      </div>
    </div>
  )
}
