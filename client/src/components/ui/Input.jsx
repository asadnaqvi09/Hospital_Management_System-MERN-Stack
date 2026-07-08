import { cn } from "@/utils/cn"
export function Input({ className, error, ...props }) {
  return (
    <input
      className={cn(
        "w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-1",
        error
          ? "border-red-300 focus:border-red-500 focus:ring-red-500"
          : "border-slate-300 focus:border-teal-500 focus:ring-teal-500",
        className
      )}
      {...props}
    />
  )
}
export default Input
