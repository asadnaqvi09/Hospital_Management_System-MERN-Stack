import { Link } from "react-router-dom"
import { Brain } from "lucide-react"
import Button from "@/components/ui/Button"
import Card from "@/components/ui/Card"
import { cn } from "@/utils/cn"

export function NavBadge({ children, className }) {
  return (
    <span
      className={cn(
        "shrink-0 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-medium leading-none text-amber-800",
        className
      )}
    >
      {children}
    </span>
  )
}

export function ComingSoonPanel({ title = "Coming soon", description, backHref, backLabel = "Go back" }) {
  return (
    <Card className="mx-auto max-w-lg p-8 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-teal-50 text-teal-600">
        <Brain className="h-7 w-7" aria-hidden />
      </div>
      <h1 className="mt-5 text-lg font-semibold text-slate-900">{title}</h1>
      <p className="mt-2 text-sm text-slate-600">
        {description || "This AI feature is planned for a future release. Clinical workflows remain fully available."}
      </p>
      {backHref && (
        <div className="mt-6">
          <Button as={Link} to={backHref} variant="secondary">
            {backLabel}
          </Button>
        </div>
      )}
    </Card>
  )
}

export default ComingSoonPanel
