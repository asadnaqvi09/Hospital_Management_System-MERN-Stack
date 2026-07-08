import { cn } from "@/utils/cn"
export function Card({ className, ...props }) {
  return <div className={cn("rounded-xl border border-slate-200 bg-white", className)} {...props} />
}
export default Card
