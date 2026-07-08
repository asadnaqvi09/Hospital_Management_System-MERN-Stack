import { useMemo, useState } from "react"
import { toast } from "sonner"
import { useGetNotificationsQuery, useMarkAllReadMutation, useMarkReadMutation } from "@/api/notifications.api"
import DataTable from "@/components/data-display/DataTable"
import PageLoader from "@/components/feedback/PageLoader"
import ErrorState from "@/components/ui/ErrorState"
import Button from "@/components/ui/Button"
import Pagination from "@/components/ui/Pagination"
import { parseApiError } from "@/utils/parseApiError"
export default function NotificationsPage() {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-semibold text-slate-900">Notifications</h1>
        <Actions />
      </div>
      <NotificationsTable />
    </div>
  )
}

function Actions() {
  const [markAllRead, { isLoading }] = useMarkAllReadMutation()
  const onClick = async () => {
    try {
      const res = await markAllRead().unwrap()
      toast.success(res?.message || "All marked as read")
    } catch (err) {
      toast.error(parseApiError(err?.data || err))
    }
  }
  return (
    <Button variant="secondary" onClick={onClick} disabled={isLoading}>
      {isLoading ? "Updating..." : "Mark all read"}
    </Button>
  )
}

function NotificationsTable() {
  const [page, setPage] = useState(1)
  const limit = 20
  const { data, isLoading, error, refetch } = useGetNotificationsQuery({ page, limit })
  const [markRead] = useMarkReadMutation()
  const notifications = data?.data?.notifications || []
  const pagination = data?.pagination
  const totalPages = pagination?.totalPages || 1

  const columns = useMemo(
    () => [
      {
        header: "Status",
        cell: ({ row }) => (
          <span className={row.original.is_read ? "text-slate-500" : "font-semibold text-slate-900"}>
            {row.original.is_read ? "Read" : "Unread"}
          </span>
        )
      },
      { header: "Title", cell: ({ row }) => <span className="text-slate-900">{row.original.title}</span> },
      { header: "Message", cell: ({ row }) => <span className="text-slate-700">{row.original.message || "-"}</span> },
      { header: "Time", cell: ({ row }) => new Date(row.original.created_at).toLocaleString() },
      {
        header: "",
        cell: ({ row }) => (
          <div className="flex justify-end">
            <Button
              variant="secondary"
              size="sm"
              disabled={row.original.is_read}
              onClick={async () => {
                try {
                  await markRead(row.original.id).unwrap()
                  toast.success("Marked as read")
                } catch (err) {
                  toast.error(parseApiError(err?.data || err))
                }
              }}
            >
              Mark read
            </Button>
          </div>
        )
      }
    ],
    [markRead]
  )

  if (isLoading) return <PageLoader />
  if (error) return <ErrorState error={error?.data || error} onRetry={refetch} />

  return (
    <div className="space-y-3">
      <DataTable
        columns={columns}
        data={notifications}
        emptyTitle="No notifications"
        emptyDescription="You’re all caught up."
      />
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  )
}
