import { useMemo, useState } from "react"
import { useParams } from "react-router-dom"
import { toast } from "sonner"
import {
  useActivateUserMutation,
  useChangeUserRoleMutation,
  useDeactivateUserMutation,
  useGetUserQuery,
  useUpdateUserMutation
} from "@/api/users.api"
import PageLoader from "@/components/feedback/PageLoader"
import ErrorState from "@/components/ui/ErrorState"
import Button from "@/components/ui/Button"
import Modal from "@/components/ui/Modal"
import FormField from "@/components/forms/FormField"
import Input from "@/components/ui/Input"
import Select from "@/components/ui/Select"
import { ROLE_VALUES } from "@/constants/roles"
import { parseApiError } from "@/utils/parseApiError"
export default function UserDetailPage() {
  return <UserDetail />
}

function UserDetail() {
  const { id } = useParams()
  const { data, isLoading, error, refetch } = useGetUserQuery(id)
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation()
  const [changeRole, { isLoading: isChangingRole }] = useChangeUserRoleMutation()
  const [deactivateUser] = useDeactivateUserMutation()
  const [activateUser] = useActivateUserMutation()
  const [openEdit, setOpenEdit] = useState(false)
  const [openRole, setOpenRole] = useState(false)

  const user = data?.data?.user || data?.user || data
  const inactive = user?.is_active === false || user?.isActive === false

  const defaults = useMemo(
    () => ({
      fullName: user?.full_name || user?.fullName || "",
      phone: user?.phone || "",
      role: user?.role || "receptionist"
    }),
    [user]
  )

  if (isLoading) return <PageLoader />
  if (error) return <ErrorState error={error?.data || error} onRetry={refetch} />

  const onToggleActive = async () => {
    try {
      if (inactive) await activateUser(user.id).unwrap()
      else await deactivateUser(user.id).unwrap()
      toast.success(inactive ? "User activated" : "User deactivated")
    } catch (err) {
      toast.error(parseApiError(err?.data || err))
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">{defaults.fullName || "User"}</h1>
          <p className="mt-1 text-sm text-slate-600">{user?.email}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setOpenEdit(true)}>Edit</Button>
          <Button variant="secondary" onClick={() => setOpenRole(true)}>Change role</Button>
          <Button variant={inactive ? "primary" : "danger"} onClick={onToggleActive}>
            {inactive ? "Activate" : "Deactivate"}
          </Button>
        </div>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Role</p>
            <p className="mt-1 text-sm font-medium capitalize text-slate-900">{user?.role?.replace("_", " ")}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Status</p>
            <p className="mt-1 text-sm font-medium text-slate-900">{inactive ? "Inactive" : "Active"}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Phone</p>
            <p className="mt-1 text-sm font-medium text-slate-900">{user?.phone || "-"}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Created</p>
            <p className="mt-1 text-sm font-medium text-slate-900">{user?.created_at ? new Date(user.created_at).toLocaleString() : "-"}</p>
          </div>
        </div>
      </div>

      <Modal open={openEdit} title="Edit user" onClose={() => setOpenEdit(false)} className="max-w-md">
        <EditForm
          defaults={defaults}
          loading={isUpdating}
          onSubmit={async (payload) => {
            try {
              const res = await updateUser({ id: user.id, ...payload }).unwrap()
              toast.success(res?.message || "User updated")
              setOpenEdit(false)
            } catch (err) {
              toast.error(parseApiError(err?.data || err))
            }
          }}
        />
      </Modal>

      <Modal open={openRole} title="Change role" onClose={() => setOpenRole(false)} className="max-w-md">
        <RoleForm
          role={defaults.role}
          loading={isChangingRole}
          onSubmit={async (role) => {
            try {
              const res = await changeRole({ id: user.id, role }).unwrap()
              toast.success(res?.message || "Role updated")
              setOpenRole(false)
            } catch (err) {
              toast.error(parseApiError(err?.data || err))
            }
          }}
        />
      </Modal>
    </div>
  )
}

function EditForm({ defaults, onSubmit, loading }) {
  const [fullName, setFullName] = useState(defaults.fullName)
  const [phone, setPhone] = useState(defaults.phone)
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit({ fullName, phone: phone || undefined })
      }}
    >
      <FormField label="Full name" htmlFor="fullName">
        <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} />
      </FormField>
      <FormField label="Phone" htmlFor="phone">
        <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
      </FormField>
      <div className="flex justify-end">
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Save"}
        </Button>
      </div>
    </form>
  )
}

function RoleForm({ role: initialRole, onSubmit, loading }) {
  const [role, setRole] = useState(initialRole)
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit(role)
      }}
    >
      <FormField label="Role" htmlFor="role">
        <Select
          id="role"
          options={ROLE_VALUES.map((r) => ({ label: r.replace("_", " "), value: r }))}
          value={role}
          onChange={(e) => setRole(e.target.value)}
        />
      </FormField>
      <div className="flex justify-end">
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Update role"}
        </Button>
      </div>
    </form>
  )
}
