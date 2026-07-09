import { useState } from "react"
import { Link } from "react-router-dom"
import { z } from "zod"
import { toast } from "sonner"
import {
  useGetMyDoctorProfileQuery,
  useGetDoctorLeavesQuery,
  useAddDoctorLeaveMutation,
  useRemoveDoctorLeaveMutation
} from "@/api/doctors.api"
import PageLoader from "@/components/feedback/PageLoader"
import ErrorState from "@/components/ui/ErrorState"
import Button from "@/components/ui/Button"
import Input from "@/components/ui/Input"
import Card from "@/components/ui/Card"
import FormField from "@/components/forms/FormField"
import { Modal } from "@/components/ui/Modal"
import { DOCTOR_ROUTES } from "@/constants/routes"
import { parseApiError } from "@/utils/parseApiError"

const leaveSchema = z.object({
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  reason: z.string().optional()
})

function formatDate(value) {
  return String(value || "").slice(0, 10) || "-"
}

export default function MyLeavesPage() {
  const { data: profileData, isLoading: profileLoading, error: profileError, refetch: refetchProfile } = useGetMyDoctorProfileQuery()
  const doctorId = profileData?.data?.doctor?.id
  const { data, isLoading, error, refetch } = useGetDoctorLeavesQuery(doctorId, { skip: !doctorId })
  const [addLeave, { isLoading: isAdding }] = useAddDoctorLeaveMutation()
  const [removeLeave, { isLoading: isRemoving }] = useRemoveDoctorLeaveMutation()
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [reason, setReason] = useState("")
  const [formError, setFormError] = useState("")
  const [deleteTarget, setDeleteTarget] = useState(null)

  const leaves = data?.data?.leaves || []

  const onSubmit = async (e) => {
    e.preventDefault()
    if (!doctorId) return
    setFormError("")
    const parsed = leaveSchema.safeParse({ startDate, endDate, reason: reason || undefined })
    if (!parsed.success) {
      setFormError(parsed.error.errors[0]?.message || "Invalid leave details")
      return
    }
    if (parsed.data.endDate < parsed.data.startDate) {
      setFormError("End date cannot be before start date.")
      return
    }
    try {
      const res = await addLeave({ doctorId, ...parsed.data }).unwrap()
      toast.success(res?.message || "Leave added")
      setStartDate("")
      setEndDate("")
      setReason("")
    } catch (err) {
      toast.error(parseApiError(err?.data || err))
    }
  }

  const onConfirmDelete = async () => {
    if (!doctorId || !deleteTarget) return
    try {
      const res = await removeLeave({ doctorId, leaveId: deleteTarget.id }).unwrap()
      toast.success(res?.message || "Leave removed")
      setDeleteTarget(null)
    } catch (err) {
      toast.error(parseApiError(err?.data || err))
    }
  }

  if (profileLoading) return <PageLoader />
  if (profileError) return <ErrorState error={profileError?.data || profileError} onRetry={refetchProfile} />
  if (!doctorId) return <ErrorState title="Doctor profile not found" description="Your account is not linked to a doctor profile." />
  if (isLoading) return <PageLoader />
  if (error) return <ErrorState error={error?.data || error} onRetry={refetch} />

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">My leaves</h1>
          <p className="text-sm text-slate-600">Block dates when you are unavailable for appointments.</p>
        </div>
        <Button variant="secondary" as={Link} to={DOCTOR_ROUTES.SCHEDULE}>
          Back to schedule
        </Button>
      </div>
      <Card className="p-6">
        <h2 className="text-sm font-semibold text-slate-900">Add leave</h2>
        <form onSubmit={onSubmit} className="mt-4 space-y-4">
          {formError && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</div>}
          <div className="grid gap-4 md:grid-cols-3">
            <FormField label="Start date" htmlFor="startDate">
              <Input id="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
            </FormField>
            <FormField label="End date" htmlFor="endDate">
              <Input id="endDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
            </FormField>
            <FormField label="Reason" htmlFor="reason">
              <Input id="reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Optional" />
            </FormField>
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={isAdding}>{isAdding ? "Adding..." : "Add leave"}</Button>
          </div>
        </form>
      </Card>
      <Card className="overflow-hidden">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-sm font-semibold text-slate-900">Scheduled leaves</h2>
        </div>
        {leaves.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-600">No leaves scheduled.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {leaves.map((leave) => (
              <div key={leave.id} className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
                <div>
                  <p className="font-medium text-slate-900">
                    {formatDate(leave.start_date)} — {formatDate(leave.end_date)}
                  </p>
                  {leave.reason && <p className="mt-0.5 text-sm text-slate-600">{leave.reason}</p>}
                </div>
                <Button variant="danger" size="sm" onClick={() => setDeleteTarget(leave)} disabled={isRemoving}>
                  Remove
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>
      <Modal open={Boolean(deleteTarget)} title="Remove leave" onClose={() => setDeleteTarget(null)}>
        <p className="text-sm text-slate-700">
          Remove leave from {formatDate(deleteTarget?.start_date)} to {formatDate(deleteTarget?.end_date)}?
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="danger" onClick={onConfirmDelete} disabled={isRemoving}>
            {isRemoving ? "Removing..." : "Remove"}
          </Button>
        </div>
      </Modal>
    </div>
  )
}
