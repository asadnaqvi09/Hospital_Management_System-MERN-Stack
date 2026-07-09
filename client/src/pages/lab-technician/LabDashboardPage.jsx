import { Link } from "react-router-dom"
import Card from "@/components/ui/Card"
import Button from "@/components/ui/Button"
const CARDS = [
  {
    title: "Orders queue",
    description: "Process lab orders, collect samples, and enter results.",
    href: "/lab/orders",
    action: "Open queue"
  },
  {
    title: "Test catalog",
    description: "Browse available lab tests, units, and reference ranges.",
    href: "/lab/tests",
    action: "Browse tests"
  }
]
export default function LabDashboardPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">Laboratory</h1>
        <p className="mt-1 text-sm text-slate-600">Lab orders, sample processing, and results entry.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {CARDS.map((c) => (
          <Card key={c.href} className="p-6">
            <h2 className="text-sm font-semibold text-slate-900">{c.title}</h2>
            <p className="mt-1 text-sm text-slate-600">{c.description}</p>
            <div className="mt-4">
              <Button as={Link} to={c.href}>
                {c.action}
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
