import { Link } from "react-router-dom"
import {
  DollarSign,
  Users,
  Stethoscope,
  Calendar,
  Bed,
  FlaskConical,
  Pill,
  RefreshCw
} from "lucide-react"
import { toast } from "sonner"
import { ADMIN_ROUTES } from "@/constants/routes"
import { useRefreshReportsMutation } from "@/api/reports.api"
import Card from "@/components/ui/Card"
import Button from "@/components/ui/Button"
import { parseApiError } from "@/utils/parseApiError"

const REPORTS = [
  {
    title: "Revenue",
    description: "Payment totals by method and date",
    path: `${ADMIN_ROUTES.REPORTS}/revenue`,
    icon: DollarSign
  },
  {
    title: "Patient volume",
    description: "New patient registrations over time",
    path: `${ADMIN_ROUTES.REPORTS}/patient-volume`,
    icon: Users
  },
  {
    title: "Doctor performance",
    description: "Visits, consultations, and revenue by doctor",
    path: `${ADMIN_ROUTES.REPORTS}/doctor-performance`,
    icon: Stethoscope
  },
  {
    title: "Appointment analytics",
    description: "Status breakdown and no-show trends",
    path: `${ADMIN_ROUTES.REPORTS}/appointments`,
    icon: Calendar
  },
  {
    title: "Bed occupancy",
    description: "Ward and room utilization snapshot",
    path: `${ADMIN_ROUTES.REPORTS}/bed-occupancy`,
    icon: Bed
  },
  {
    title: "Lab turnaround",
    description: "Order completion times by priority",
    path: `${ADMIN_ROUTES.REPORTS}/lab-turnaround`,
    icon: FlaskConical
  },
  {
    title: "Pharmacy",
    description: "Dispensing activity and prescription volume",
    path: `${ADMIN_ROUTES.REPORTS}/pharmacy`,
    icon: Pill
  }
]

export default function ReportsHubPage() {
  const [refreshReports, { isLoading }] = useRefreshReportsMutation()
  const onRefresh = async () => {
    try {
      await refreshReports().unwrap()
      toast.success("Report data refreshed")
    } catch (err) {
      toast.error(parseApiError(err?.data || err))
    }
  }
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Reports</h1>
          <p className="mt-1 text-sm text-slate-600">Analytics and operational insights across the hospital.</p>
        </div>
        <Button variant="secondary" onClick={onRefresh} disabled={isLoading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          Refresh data
        </Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {REPORTS.map((report) => {
          const Icon = report.icon
          return (
            <Link key={report.path} to={report.path} className="group">
              <Card className="h-full p-5 transition hover:border-teal-200 hover:shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="rounded-lg bg-teal-50 p-2.5 text-teal-700 group-hover:bg-teal-100">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="font-medium text-slate-900">{report.title}</h2>
                    <p className="mt-1 text-sm text-slate-600">{report.description}</p>
                  </div>
                </div>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
