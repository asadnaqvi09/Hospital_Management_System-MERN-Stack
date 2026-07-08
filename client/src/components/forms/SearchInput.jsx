import { Search } from "lucide-react"
import { cn } from "@/utils/cn"
export function SearchInput({ className, inputClassName, ...props }) {
  return (
    <div className={cn("relative", className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        className={cn(
          "w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500",
          inputClassName
        )}
        {...props}
      />
    </div>
  )
}
export default SearchInput
