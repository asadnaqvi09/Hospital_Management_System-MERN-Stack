import { cn } from "@/utils/cn"
export function StatCard({ label, value, icon: Icon, trend, className }) {
  return (
    <div className={cn("rounded-xl border border-slate-200 bg-white p-5", className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
        </div>
        {Icon && (
          <div className="rounded-lg bg-teal-50 p-2 text-teal-700">
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
      {trend && <p className="mt-3 text-sm text-slate-600">{trend}</p>}
    </div>
  )
}
export default StatCard
