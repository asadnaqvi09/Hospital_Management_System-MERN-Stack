import { cn } from "@/utils/cn"
export function ChartCard({ title, subtitle, right, children, className }) {
  return (
    <div className={cn("rounded-xl border border-slate-200 bg-white", className)}>
      <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
        <div>
          <p className="text-sm font-semibold text-slate-900">{title}</p>
          {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
        </div>
        {right}
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}
export default ChartCard
