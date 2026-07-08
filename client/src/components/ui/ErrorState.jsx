import { cn } from "@/utils/cn"
import { parseApiError } from "@/utils/parseApiError"
import Button from "@/components/ui/Button"
export function ErrorState({ error, title = "Something went wrong", onRetry, className }) {
  const message = parseApiError(error)
  return (
    <div className={cn("rounded-xl border border-red-100 bg-red-50 p-6", className)}>
      <h3 className="text-sm font-semibold text-red-900">{title}</h3>
      <p className="mt-1 text-sm text-red-700">{message}</p>
      {onRetry && (
        <div className="mt-4">
          <Button variant="secondary" onClick={onRetry}>
            Retry
          </Button>
        </div>
      )}
    </div>
  )
}
export default ErrorState
