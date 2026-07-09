import { Link } from "react-router-dom"
import Card from "@/components/ui/Card"
import Button from "@/components/ui/Button"

export default function ReceptionDashboardPage() {
  return <ReceptionDashboard />
}
const CARDS = [
  {
    title: "Patients",
    description: "Register and search patient profiles.",
    href: "/reception/patients",
    action: "Open patients"
  },
  {
    title: "Book appointment",
    description: "Book an appointment using real doctor availability.",
    href: "/reception/appointments/new",
    action: "Book now"
  },
  {
    title: "Appointments",
    description: "View and manage appointment statuses.",
    href: "/reception/appointments",
    action: "Open appointments"
  },
  {
    title: "Queue board",
    description: "Live queue view for today's date.",
    href: "/reception/queue",
    action: "Open queue"
  }
]
function ReceptionDashboard() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">Reception</h1>
        <p className="mt-1 text-sm text-slate-600">Patients, appointments, and queue.</p>
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
