import { cn } from "@/utils/cn"
export function EmptyState({ title = "No data", description, action, className }) {
  return (
    <div className={cn("rounded-xl border border-slate-200 bg-white p-8 text-center", className)}>
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  )
}
export default EmptyState
