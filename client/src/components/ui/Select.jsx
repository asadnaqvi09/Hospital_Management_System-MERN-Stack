import { cn } from "@/utils/cn"
export function Select({ className, options = [], error, ...props }) {
  return (
    <select
      className={cn(
        "w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-1",
        error
          ? "border-red-300 focus:border-red-500 focus:ring-red-500"
          : "border-slate-300 focus:border-teal-500 focus:ring-teal-500",
        className
      )}
      {...props}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  )
}
export default Select
