import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { useGetAuditLogsQuery } from "@/api/audit.api"
import { ADMIN_ROUTES } from "@/constants/routes"
import DataTable from "@/components/data-display/DataTable"
import PageLoader from "@/components/feedback/PageLoader"
import ErrorState from "@/components/ui/ErrorState"
import Pagination from "@/components/ui/Pagination"
import Button from "@/components/ui/Button"
import FormField from "@/components/forms/FormField"
import Input from "@/components/ui/Input"
import Select from "@/components/ui/Select"
import Badge from "@/components/ui/Badge"
import { formatDateTime } from "@/utils/formatDate"

const ACTION_OPTIONS = [
  { value: "", label: "All actions" },
  { value: "CREATE", label: "Create" },
  { value: "UPDATE", label: "Update" },
  { value: "DELETE", label: "Delete" },
  { value: "LOGIN", label: "Login" },
  { value: "LOGOUT", label: "Logout" },
  { value: "ACCESS", label: "Access" }
]

const ACTION_VARIANT = {
  CREATE: "success",
  UPDATE: "warning",
  DELETE: "danger",
  LOGIN: "info",
  LOGOUT: "default",
  ACCESS: "info"
}

export default function AuditLogListPage() {
  const [page, setPage] = useState(1)
  const [action, setAction] = useState("")
  const [entityType, setEntityType] = useState("")
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const limit = 20
  const { data, isLoading, error, refetch } = useGetAuditLogsQuery({
    page,
    limit,
    action: action || undefined,
    entityType: entityType || undefined,
    fromDate: fromDate || undefined,
    toDate: toDate || undefined
  })
  const logs = data?.data?.logs || []
  const totalPages = data?.pagination?.totalPages || 1
  const columns = useMemo(
    () => [
      {
        header: "Time",
        cell: ({ row }) => formatDateTime(row.original.created_at)
      },
      {
        header: "User",
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-slate-900">{row.original.user_name || "System"}</p>
            {row.original.user_email && <p className="text-xs text-slate-500">{row.original.user_email}</p>}
          </div>
        )
      },
      {
        header: "Role",
        cell: ({ row }) => <span className="capitalize">{row.original.user_role?.replace("_", " ") || "-"}</span>
      },
      {
        header: "Action",
        cell: ({ row }) => (
          <Badge variant={ACTION_VARIANT[row.original.action] || "default"}>
            {row.original.action}
          </Badge>
        )
      },
      {
        header: "Entity",
        cell: ({ row }) => (
          <div>
            <p className="text-sm text-slate-900">{row.original.entity_type || "-"}</p>
            {row.original.entity_id && <p className="text-xs text-slate-500 font-mono">{row.original.entity_id.slice(0, 8)}…</p>}
          </div>
        )
      },
      {
        header: "",
        cell: ({ row }) => (
          <div className="flex justify-end">
            <Button variant="secondary" size="sm" as={Link} to={`${ADMIN_ROUTES.AUDIT}/${row.original.id}`}>
              View
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
      <div>
        <h1 className="text-lg font-semibold text-slate-900">Audit logs</h1>
        <p className="mt-1 text-sm text-slate-600">Security and compliance activity across the system.</p>
      </div>
      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4">
        <FormField label="Action" htmlFor="audit-action">
          <Select
            id="audit-action"
            value={action}
            onChange={(e) => { setPage(1); setAction(e.target.value) }}
            options={ACTION_OPTIONS}
            className="w-[160px]"
          />
        </FormField>
        <FormField label="Entity type" htmlFor="audit-entity">
          <Input
            id="audit-entity"
            placeholder="e.g. patient"
            value={entityType}
            onChange={(e) => { setPage(1); setEntityType(e.target.value) }}
            className="w-[180px]"
          />
        </FormField>
        <FormField label="From" htmlFor="audit-from">
          <Input id="audit-from" type="date" value={fromDate} onChange={(e) => { setPage(1); setFromDate(e.target.value) }} className="w-[160px]" />
        </FormField>
        <FormField label="To" htmlFor="audit-to">
          <Input id="audit-to" type="date" value={toDate} onChange={(e) => { setPage(1); setToDate(e.target.value) }} className="w-[160px]" />
        </FormField>
      </div>
      <DataTable columns={columns} data={logs} emptyTitle="No audit logs" emptyDescription="Try adjusting your filters." />
      {totalPages > 1 && <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />}
    </div>
  )
}
