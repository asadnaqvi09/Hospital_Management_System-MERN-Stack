import { cn } from "@/utils/cn"
const STYLE = {
  scheduled: "bg-slate-100 text-slate-800 border-slate-200",
  confirmed: "bg-blue-50 text-blue-800 border-blue-200",
  checked_in: "bg-amber-50 text-amber-900 border-amber-200",
  in_consultation: "bg-purple-50 text-purple-900 border-purple-200",
  completed: "bg-emerald-50 text-emerald-900 border-emerald-200",
  cancelled: "bg-red-50 text-red-800 border-red-200",
  no_show: "bg-red-50 text-red-800 border-red-200",
  pending: "bg-amber-50 text-amber-900 border-amber-200",
  partially_dispensed: "bg-orange-50 text-orange-900 border-orange-200",
  dispensed: "bg-emerald-50 text-emerald-900 border-emerald-200",
  ordered: "bg-blue-50 text-blue-800 border-blue-200",
  sample_collected: "bg-purple-50 text-purple-900 border-purple-200",
  processing: "bg-orange-50 text-orange-900 border-orange-200",
  routine: "bg-slate-100 text-slate-800 border-slate-200",
  urgent: "bg-amber-50 text-amber-900 border-amber-200",
  critical: "bg-red-50 text-red-800 border-red-200"
}
const LABEL = {
  scheduled: "Scheduled",
  confirmed: "Confirmed",
  checked_in: "Checked in",
  in_consultation: "In consultation",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show: "No show",
  pending: "Pending",
  partially_dispensed: "Partially dispensed",
  dispensed: "Dispensed",
  ordered: "Ordered",
  sample_collected: "Sample collected",
  processing: "Processing",
  routine: "Routine",
  urgent: "Urgent",
  critical: "Critical"
}
export function StatusBadge({ status, className }) {
  const key = String(status || "").toLowerCase()
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium", STYLE[key] || STYLE.scheduled, className)}>
      {LABEL[key] || status || "-"}
    </span>
  )
}
export default StatusBadge
