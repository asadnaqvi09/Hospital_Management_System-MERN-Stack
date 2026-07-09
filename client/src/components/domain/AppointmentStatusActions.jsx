import { toast } from "sonner"
import Button from "@/components/ui/Button"
import { APPOINTMENT_STATUS_TRANSITIONS } from "@/constants/statuses"
import { useUpdateAppointmentStatusMutation } from "@/api/appointments.api"
import { parseApiError } from "@/utils/parseApiError"
const LABEL = {
  confirmed: "Confirm",
  checked_in: "Check-in",
  in_consultation: "Start consult",
  completed: "Complete",
  cancelled: "Cancel",
  no_show: "No show"
}
function toLabel(nextStatus) {
  return LABEL[nextStatus] || nextStatus
}
function variantFor(status) {
  if (status === "cancelled" || status === "no_show") return "danger"
  return "secondary"
}
export function AppointmentStatusActions({ appointmentId, currentStatus, size = "sm", className, onSuccess }) {
  const [updateStatus, { isLoading }] = useUpdateAppointmentStatusMutation()
  const allowed = APPOINTMENT_STATUS_TRANSITIONS[currentStatus] || []
  if (!appointmentId || !currentStatus || allowed.length === 0) return null
  const run = async (status) => {
    try {
      const res = await updateStatus({ id: appointmentId, status }).unwrap()
      toast.success(res?.message || "Status updated")
      onSuccess?.(res?.data?.appointment)
    } catch (error) {
      const message = parseApiError(error?.data || error)
      console.error("updateAppointmentStatus failed", { appointmentId, status, error })
      toast.error(message)
    }
  }
  return (
    <div className={className}>
      <div className="flex flex-wrap gap-2">
        {allowed.map((s) => (
          <Button key={s} variant={variantFor(s)} size={size} disabled={isLoading} onClick={() => run(s)}>
            {toLabel(s)}
          </Button>
        ))}
      </div>
    </div>
  )
}
export default AppointmentStatusActions
