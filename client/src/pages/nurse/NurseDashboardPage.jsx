import { Link } from "react-router-dom"
import Card from "@/components/ui/Card"
import Button from "@/components/ui/Button"

export default function NurseDashboardPage() {
  const cards = [
    {
      title: "Queue",
      description: "Live queue view and quick access to vitals recording.",
      href: "/nurse/queue",
      action: "Open queue"
    },
    {
      title: "Vitals",
      description: "Record patient vitals and review history.",
      href: "/nurse/vitals",
      action: "Record vitals"
    },
    {
      title: "IPD admissions",
      description: "View active admissions and add nursing notes.",
      href: "/nurse/ipd",
      action: "Open IPD"
    }
  ]
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">Nurse</h1>
        <p className="mt-1 text-sm text-slate-600">Queue, vitals, and IPD nursing notes.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {cards.map((c) => (
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
