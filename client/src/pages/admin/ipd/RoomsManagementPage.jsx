import { useMemo, useState } from "react"
import { toast } from "sonner"
import { useCreateRoomMutation, useGetRoomsQuery, useUpdateRoomMutation } from "@/api/ipd.api"
import { ROOM_STATUS } from "@/constants/statuses"
import DataTable from "@/components/data-display/DataTable"
import PageLoader from "@/components/feedback/PageLoader"
import ErrorState from "@/components/ui/ErrorState"
import Button from "@/components/ui/Button"
import Modal from "@/components/ui/Modal"
import Card from "@/components/ui/Card"
import FormField from "@/components/forms/FormField"
import Input from "@/components/ui/Input"
import Select from "@/components/ui/Select"
import StatusBadge from "@/components/data-display/StatusBadge"
import { formatCurrency } from "@/utils/formatCurrency"
import { parseApiError } from "@/utils/parseApiError"

const STATUS_OPTIONS = [
  { value: ROOM_STATUS.AVAILABLE, label: "Available" },
  { value: ROOM_STATUS.OCCUPIED, label: "Occupied" },
  { value: ROOM_STATUS.MAINTENANCE, label: "Maintenance" }
]

export default function RoomsManagementPage() {
  const [ward, setWard] = useState("")
  const [status, setStatus] = useState("")
  const { data, isLoading, error, refetch } = useGetRoomsQuery({
    ward: ward || undefined,
    status: status || undefined
  })
  const [createRoom, { isLoading: isCreating }] = useCreateRoomMutation()
  const [updateRoom, { isLoading: isUpdating }] = useUpdateRoomMutation()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const rooms = data?.data?.rooms || []
  const columns = useMemo(
    () => [
      { header: "Room", cell: ({ row }) => <span className="font-medium text-slate-900">{row.original.room_number}</span> },
      { header: "Ward", cell: ({ row }) => row.original.ward || "-" },
      { header: "Floor", cell: ({ row }) => row.original.floor ?? "-" },
      { header: "Capacity", cell: ({ row }) => row.original.capacity ?? "-" },
      { header: "Available", cell: ({ row }) => row.original.available_beds ?? 0 },
      { header: "Rate", cell: ({ row }) => formatCurrency(row.original.daily_rate || 0) },
      { header: "Status", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
      {
        header: "",
        cell: ({ row }) => (
          <div className="flex justify-end">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setEditing(row.original)
                setOpen(true)
              }}
            >
              Edit
            </Button>
          </div>
        )
      }
    ],
    []
  )
  if (isLoading) return <PageLoader />
  if (error) return <ErrorState error={error?.data || error} onRetry={refetch} />
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">IPD rooms</h1>
          <p className="text-sm text-slate-600">Create and update ward rooms and bed capacity.</p>
        </div>
        <Button
          onClick={() => {
            setEditing(null)
            setOpen(true)
          }}
        >
          Add room
        </Button>
      </div>
      <Card className="p-4">
        <div className="grid gap-3 md:grid-cols-3">
          <FormField label="Ward filter" htmlFor="ward">
            <Input id="ward" value={ward} onChange={(e) => setWard(e.target.value)} placeholder="All wards" />
          </FormField>
          <FormField label="Status filter" htmlFor="status">
            <Select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              options={[{ value: "", label: "All statuses" }, ...STATUS_OPTIONS]}
            />
          </FormField>
          <div className="flex items-end justify-end">
            <Button variant="secondary" onClick={refetch}>Refresh</Button>
          </div>
        </div>
      </Card>
      <DataTable columns={columns} data={rooms} emptyTitle="No rooms" emptyDescription="Add a room to get started." />
      <Modal open={open} title={editing ? "Edit room" : "Add room"} onClose={() => setOpen(false)} className="max-w-lg">
        <RoomForm
          initial={editing}
          loading={isCreating || isUpdating}
          onSubmit={async (payload) => {
            try {
              const res = editing
                ? await updateRoom({ id: editing.id, ...payload }).unwrap()
                : await createRoom(payload).unwrap()
              toast.success(res?.message || (editing ? "Room updated" : "Room created"))
              setOpen(false)
            } catch (err) {
              toast.error(parseApiError(err?.data || err))
            }
          }}
        />
      </Modal>
    </div>
  )
}

function RoomForm({ initial, onSubmit, loading }) {
  const isEdit = Boolean(initial)
  const [roomNumber, setRoomNumber] = useState(initial?.room_number || "")
  const [ward, setWard] = useState(initial?.ward || "")
  const [floor, setFloor] = useState(initial?.floor ?? "")
  const [capacity, setCapacity] = useState(initial?.capacity ?? "")
  const [dailyRate, setDailyRate] = useState(initial?.daily_rate ?? "")
  const [status, setStatus] = useState(initial?.status || ROOM_STATUS.AVAILABLE)
  const [formError, setFormError] = useState("")
  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError("")
    if (!isEdit && !roomNumber.trim()) {
      setFormError("Room number is required.")
      return
    }
    if (!ward.trim()) {
      setFormError("Ward is required.")
      return
    }
    const payload = {
      ward: ward.trim(),
      floor: floor === "" ? undefined : Number(floor),
      capacity: capacity === "" ? undefined : Number(capacity),
      dailyRate: dailyRate === "" ? undefined : Number(dailyRate)
    }
    if (isEdit) {
      payload.status = status
    } else {
      payload.roomNumber = roomNumber.trim()
    }
    await onSubmit(payload)
  }
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {formError && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</div>}
      {!isEdit && (
        <FormField label="Room number" htmlFor="roomNumber">
          <Input id="roomNumber" value={roomNumber} onChange={(e) => setRoomNumber(e.target.value)} required />
        </FormField>
      )}
      <FormField label="Ward" htmlFor="wardName">
        <Input id="wardName" value={ward} onChange={(e) => setWard(e.target.value)} required />
      </FormField>
      <div className="grid gap-3 md:grid-cols-2">
        <FormField label="Floor" htmlFor="floor">
          <Input id="floor" inputMode="numeric" value={floor} onChange={(e) => setFloor(e.target.value)} />
        </FormField>
        <FormField label="Capacity" htmlFor="capacity">
          <Input id="capacity" inputMode="numeric" value={capacity} onChange={(e) => setCapacity(e.target.value)} />
        </FormField>
      </div>
      <FormField label="Daily rate" htmlFor="dailyRate">
        <Input id="dailyRate" inputMode="decimal" value={dailyRate} onChange={(e) => setDailyRate(e.target.value)} />
      </FormField>
      {isEdit && (
        <FormField label="Status" htmlFor="roomStatus">
          <Select id="roomStatus" value={status} onChange={(e) => setStatus(e.target.value)} options={STATUS_OPTIONS} />
        </FormField>
      )}
      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={loading}>{loading ? "Saving..." : isEdit ? "Save changes" : "Create room"}</Button>
      </div>
    </form>
  )
}
