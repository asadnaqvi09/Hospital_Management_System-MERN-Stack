import { cn } from "@/utils/cn"
export function Table({ className, ...props }) {
  return <table className={cn("w-full text-left text-sm", className)} {...props} />
}
export default Table
