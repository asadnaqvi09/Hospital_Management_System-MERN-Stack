import { Link } from "react-router-dom"
import Card from "@/components/ui/Card"
import Button from "@/components/ui/Button"
const CARDS = [
  {
    title: "Pending prescriptions",
    description: "Review and dispense pending or partially dispensed prescriptions.",
    href: "/pharmacy/pending",
    action: "Open pending"
  },
  {
    title: "Prescription history",
    description: "Browse all prescriptions and filter by status.",
    href: "/pharmacy/prescriptions",
    action: "View history"
  },
  {
    title: "Inventory",
    description: "Browse medicine stock levels and batch details.",
    href: "/pharmacy/inventory",
    action: "Open inventory"
  },
  {
    title: "Receive batch",
    description: "Record incoming stock for a medicine batch.",
    href: "/pharmacy/inventory/receive",
    action: "Receive stock"
  },
  {
    title: "Reorder alerts",
    description: "Medicines at or below reorder level.",
    href: "/pharmacy/alerts/reorder",
    action: "View alerts"
  },
  {
    title: "Expiry alerts",
    description: "Batches expiring within the selected window.",
    href: "/pharmacy/alerts/expiry",
    action: "View expiry"
  },
  {
    title: "Drug interactions",
    description: "Check medicine interactions for a patient.",
    href: "/pharmacy/tools/interactions",
    action: "Run check"
  }
]
export default function PharmacistDashboardPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">Pharmacy</h1>
        <p className="mt-1 text-sm text-slate-600">Prescriptions, inventory, and safety checks.</p>
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
