import { useState } from "react"
import { Link } from "react-router-dom"
import { useGetRoomsQuery } from "@/api/ipd.api"
import { RECEPTIONIST_ROUTES } from "@/constants/routes"
import { ROOM_STATUS } from "@/constants/statuses"
import PageLoader from "@/components/feedback/PageLoader"
import ErrorState from "@/components/ui/ErrorState"
import Button from "@/components/ui/Button"
import Card from "@/components/ui/Card"
import Input from "@/components/ui/Input"
import Select from "@/components/ui/Select"
import StatusBadge from "@/components/data-display/StatusBadge"
import { formatCurrency } from "@/utils/formatCurrency"

export default function RoomsOverviewPage() {
  const [ward, setWard] = useState("")
  const [status, setStatus] = useState("")
  const { data, isLoading, error, refetch } = useGetRoomsQuery({
    ward: ward || undefined,
    status: status || undefined
  })
  const rooms = data?.data?.rooms || []

  if (isLoading) return <PageLoader />
  if (error) return <ErrorState error={error?.data || error} onRetry={refetch} />

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">IPD rooms</h1>
          <p className="text-sm text-slate-600">Ward occupancy and bed availability.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" as={Link} to={RECEPTIONIST_ROUTES.IPD_ADMISSIONS}>
            Admissions
          </Button>
          <Button as={Link} to={RECEPTIONIST_ROUTES.IPD_ADMISSION_CREATE}>
            Admit patient
          </Button>
        </div>
      </div>
      <Card className="p-4">
        <div className="grid gap-3 md:grid-cols-3">
          <div>
            <p className="mb-1 text-sm font-medium text-slate-700">Ward</p>
            <Input placeholder="Filter ward" value={ward} onChange={(e) => setWard(e.target.value)} />
          </div>
          <div>
            <p className="mb-1 text-sm font-medium text-slate-700">Status</p>
            <Select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              options={[
                { value: "", label: "All statuses" },
                { value: ROOM_STATUS.AVAILABLE, label: "Available" },
                { value: ROOM_STATUS.OCCUPIED, label: "Occupied" },
                { value: ROOM_STATUS.MAINTENANCE, label: "Maintenance" }
              ]}
            />
          </div>
          <div className="flex items-end justify-end">
            <Button variant="secondary" onClick={refetch}>Refresh</Button>
          </div>
        </div>
      </Card>
      {rooms.length === 0 ? (
        <Card className="p-8 text-center text-sm text-slate-600">No rooms match the current filters.</Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rooms.map((room) => (
            <Card key={room.id} className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-slate-900">Room {room.room_number}</p>
                  <p className="text-sm text-slate-600">{room.ward || "-"} • Floor {room.floor ?? "-"}</p>
                </div>
                <StatusBadge status={room.status} />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-xs text-slate-500">Capacity</p>
                  <p className="font-medium text-slate-900">{room.capacity ?? "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Available beds</p>
                  <p className="font-medium text-slate-900">{room.available_beds ?? 0}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Admitted</p>
                  <p className="font-medium text-slate-900">{room.active_admissions ?? 0}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Daily rate</p>
                  <p className="font-medium text-slate-900">{formatCurrency(room.daily_rate || 0)}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
