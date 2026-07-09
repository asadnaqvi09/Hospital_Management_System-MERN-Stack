import { Link } from "react-router-dom"
import { ClipboardList, Package, AlertCircle, Timer } from "lucide-react"
import { useGetPendingPrescriptionsQuery } from "@/api/prescriptions.api"
import { useGetReorderAlertsQuery, useGetExpiryAlertsQuery } from "@/api/medicines.api"
import { PHARMACIST_ROUTES } from "@/constants/routes"
import PageLoader from "@/components/feedback/PageLoader"
import ErrorState from "@/components/ui/ErrorState"
import StatCard from "@/components/data-display/StatCard"
import Card from "@/components/ui/Card"
import Button from "@/components/ui/Button"

export default function PharmacistDashboardPage() {
  const pending = useGetPendingPrescriptionsQuery({ page: 1, limit: 10 })
  const reorder = useGetReorderAlertsQuery()
  const expiry = useGetExpiryAlertsQuery({ days: 30 })
  const isLoading = pending.isLoading || reorder.isLoading || expiry.isLoading
  const error = pending.error || reorder.error || expiry.error
  if (isLoading) return <PageLoader />
  if (error) {
    return (
      <ErrorState
        error={error?.data || error}
        onRetry={() => {
          pending.refetch()
          reorder.refetch()
          expiry.refetch()
        }}
      />
    )
  }
  const pendingRows = pending.data?.data?.prescriptions || []
  const pendingTotal = pending.data?.pagination?.total ?? pendingRows.length
  const reorderAlerts = reorder.data?.data?.alerts || reorder.data?.data?.medicines || []
  const expiryAlerts = expiry.data?.data?.batches || expiry.data?.data?.alerts || []
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Pharmacy dashboard</h1>
          <p className="mt-1 text-sm text-slate-600">Dispensing queue and inventory alerts.</p>
        </div>
        <Button as={Link} to={PHARMACIST_ROUTES.PENDING}>Open pending Rx</Button>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Pending prescriptions" value={pendingTotal} icon={ClipboardList} />
        <StatCard label="Reorder alerts" value={reorderAlerts.length} icon={AlertCircle} />
        <StatCard label="Expiry alerts (30d)" value={expiryAlerts.length} icon={Timer} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-slate-900">Pending to dispense</h2>
            <Button variant="secondary" size="sm" as={Link} to={PHARMACIST_ROUTES.PENDING}>View all</Button>
          </div>
          {pendingRows.length === 0 ? (
            <p className="mt-4 text-sm text-slate-600">No pending prescriptions.</p>
          ) : (
            <div className="mt-4 divide-y divide-slate-100">
              {pendingRows.slice(0, 5).map((rx) => (
                <div key={rx.id} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <div>
                    <p className="font-medium text-slate-900">{rx.patient_name || "Patient"}</p>
                    <p className="text-sm text-slate-600">{String(rx.created_at || "").replace("T", " ").slice(0, 16)}</p>
                  </div>
                  <Button variant="secondary" size="sm" as={Link} to={`${PHARMACIST_ROUTES.PRESCRIPTIONS}/${rx.id}/dispense`}>
                    Dispense
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-slate-900">Inventory alerts</h2>
            <Button variant="secondary" size="sm" as={Link} to={PHARMACIST_ROUTES.INVENTORY}>
              <Package className="mr-1.5 h-4 w-4" />
              Inventory
            </Button>
          </div>
          <div className="mt-4 space-y-3 text-sm text-slate-700">
            <p>
              <span className="font-medium text-slate-900">{reorderAlerts.length}</span> medicines at or below reorder level.
            </p>
            <p>
              <span className="font-medium text-slate-900">{expiryAlerts.length}</span> batches expiring within 30 days.
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              <Button variant="secondary" size="sm" as={Link} to={PHARMACIST_ROUTES.REORDER_ALERTS}>Reorder alerts</Button>
              <Button variant="secondary" size="sm" as={Link} to={PHARMACIST_ROUTES.EXPIRY_ALERTS}>Expiry alerts</Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
