import { Link, useParams } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { useGetAuditLogQuery } from "@/api/audit.api"
import { ADMIN_ROUTES } from "@/constants/routes"
import PageLoader from "@/components/feedback/PageLoader"
import ErrorState from "@/components/ui/ErrorState"
import Card from "@/components/ui/Card"
import Badge from "@/components/ui/Badge"
import { formatDateTime } from "@/utils/formatDate"

const ACTION_VARIANT = {
  CREATE: "success",
  UPDATE: "warning",
  DELETE: "danger",
  LOGIN: "info",
  LOGOUT: "default",
  ACCESS: "info"
}

function JsonBlock({ label, value }) {
  if (!value || (typeof value === "object" && Object.keys(value).length === 0)) {
    return (
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
        <p className="mt-2 text-sm text-slate-500">—</p>
      </div>
    )
  }
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <pre className="mt-2 max-h-80 overflow-auto rounded-lg bg-slate-50 p-4 text-xs text-slate-800">
        {JSON.stringify(value, null, 2)}
      </pre>
    </div>
  )
}

export default function AuditLogDetailPage() {
  const { id } = useParams()
  const { data, isLoading, error, refetch } = useGetAuditLogQuery(id)
  const log = data?.data?.log
  if (isLoading) return <PageLoader />
  if (error) return <ErrorState error={error?.data || error} onRetry={refetch} />
  if (!log) return <ErrorState error={{ error: "Audit log not found" }} onRetry={refetch} />
  const beforeState = log.before_state || log.beforeState
  const afterState = log.after_state || log.afterState
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Link to={ADMIN_ROUTES.AUDIT} className="inline-flex items-center gap-1.5 text-sm text-teal-700 hover:text-teal-800">
          <ArrowLeft className="h-4 w-4" />
          Audit logs
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-lg font-semibold text-slate-900">Audit log detail</h1>
          <Badge variant={ACTION_VARIANT[log.action] || "default"}>{log.action}</Badge>
        </div>
      </div>
      <Card className="p-6">
        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Timestamp</dt>
            <dd className="mt-1 text-sm text-slate-900">{formatDateTime(log.created_at)}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">User</dt>
            <dd className="mt-1 text-sm text-slate-900">{log.user_name || "System"}</dd>
            {log.user_email && <dd className="text-xs text-slate-500">{log.user_email}</dd>}
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Role</dt>
            <dd className="mt-1 text-sm capitalize text-slate-900">{log.user_role?.replace("_", " ") || "-"}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Entity</dt>
            <dd className="mt-1 text-sm text-slate-900">{log.entity_type || "-"}</dd>
            {log.entity_id && <dd className="font-mono text-xs text-slate-500">{log.entity_id}</dd>}
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">IP address</dt>
            <dd className="mt-1 text-sm text-slate-900">{log.ip_address || "-"}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">User agent</dt>
            <dd className="mt-1 break-all text-sm text-slate-900">{log.user_agent || "-"}</dd>
          </div>
        </dl>
      </Card>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-6">
          <JsonBlock label="Before state" value={beforeState} />
        </Card>
        <Card className="p-6">
          <JsonBlock label="After state" value={afterState} />
        </Card>
      </div>
    </div>
  )
}
