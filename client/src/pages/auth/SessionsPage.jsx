import { useMemo, useState } from "react"
import { toast } from "sonner"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRevokeSessionMutation, useSessionsQuery } from "@/api/auth.api"
import PageLoader from "@/components/feedback/PageLoader"
import ErrorState from "@/components/ui/ErrorState"
import DataTable from "@/components/data-display/DataTable"
import Button from "@/components/ui/Button"
import Modal from "@/components/ui/Modal"
import FormField from "@/components/forms/FormField"
import Input from "@/components/ui/Input"
import { parseApiError } from "@/utils/parseApiError"
export default function SessionsPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-lg font-semibold text-slate-900">Sessions</h1>
      </div>
      <SessionsTable />
    </div>
  )
}

function SessionsTable() {
  const { data, isLoading, error, refetch } = useSessionsQuery()
  const [revokeSession, { isLoading: isRevoking }] = useRevokeSessionMutation()
  const [selected, setSelected] = useState(null)
  const sessions = data?.data?.sessions || data?.sessions || []
  const schema = z.object({ confirm: z.string().trim().toUpperCase().refine((v) => v === "REVOKE", "Type REVOKE to confirm") })
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setError
  } = useForm({ resolver: zodResolver(schema), defaultValues: { confirm: "" } })

  const columns = useMemo(
    () => [
      { header: "Device", cell: ({ row }) => <span className="text-slate-900">{row.original.user_agent || "Unknown"}</span> },
      { header: "IP", cell: ({ row }) => <span className="text-slate-700">{row.original.ip_address || "-"}</span> },
      { header: "Created", cell: ({ row }) => new Date(row.original.created_at).toLocaleString() },
      { header: "Expires", cell: ({ row }) => new Date(row.original.expires_at).toLocaleString() },
      {
        header: "",
        cell: ({ row }) => (
          <div className="flex justify-end">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                reset()
                setSelected(row.original)
              }}
            >
              Revoke
            </Button>
          </div>
        )
      }
    ],
    []
  )

  const onConfirm = async () => {
    if (!selected) return
    try {
      const res = await revokeSession(selected.id).unwrap()
      toast.success(res?.message || "Session revoked")
      setSelected(null)
    } catch (err) {
      setError("root", { message: parseApiError(err?.data || err) })
    }
  }

  if (isLoading) return <PageLoader />
  if (error) return <ErrorState error={error?.data || error} onRetry={refetch} />

  return (
    <>
      <DataTable
        columns={columns}
        data={sessions}
        emptyTitle="No active sessions"
        emptyDescription="You don’t have any active sessions."
      />
      <Modal open={Boolean(selected)} title="Revoke session" onClose={() => setSelected(null)} className="max-w-md">
        <p className="text-sm text-slate-600">Type <span className="font-semibold text-slate-900">REVOKE</span> to confirm.</p>
        <form
          className="mt-4 space-y-4"
          onSubmit={handleSubmit(async () => {
            await onConfirm()
          })}
        >
          {errors.root?.message && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{errors.root.message}</div>}
          <FormField label="Confirmation" htmlFor="confirm" error={errors.confirm?.message}>
            <Input id="confirm" {...register("confirm")} error={Boolean(errors.confirm)} />
          </FormField>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" type="button" onClick={() => setSelected(null)} disabled={isRevoking}>
              Cancel
            </Button>
            <Button variant="danger" type="submit" disabled={isRevoking}>
              {isRevoking ? "Revoking..." : "Revoke"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  )
}
