import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { toast } from "sonner"
import { useGetUsersQuery, useActivateUserMutation, useDeactivateUserMutation } from "@/api/users.api"
import DataTable from "@/components/data-display/DataTable"
import PageLoader from "@/components/feedback/PageLoader"
import ErrorState from "@/components/ui/ErrorState"
import Pagination from "@/components/ui/Pagination"
import Button from "@/components/ui/Button"
import SearchInput from "@/components/forms/SearchInput"
import { parseApiError } from "@/utils/parseApiError"
export default function UserListPage() {
  return <UsersList />
}

function UsersList() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const limit = 20
  const { data, isLoading, error, refetch } = useGetUsersQuery({ page, limit, search: search || undefined })
  const [deactivateUser] = useDeactivateUserMutation()
  const [activateUser] = useActivateUserMutation()
  const users = data?.data?.users || []
  const totalPages = data?.pagination?.totalPages || 1

  const columns = useMemo(
    () => [
      {
        header: "Name",
        cell: ({ row }) => (
          <Link to={`/admin/users/${row.original.id}`} className="font-medium text-teal-700 hover:text-teal-800">
            {row.original.full_name || row.original.fullName || "-"}
          </Link>
        )
      },
      { header: "Email", cell: ({ row }) => row.original.email },
      { header: "Role", cell: ({ row }) => <span className="capitalize">{row.original.role?.replace("_", " ")}</span> },
      { header: "Status", cell: ({ row }) => (row.original.is_active === false || row.original.isActive === false ? "Inactive" : "Active") },
      {
        header: "",
        cell: ({ row }) => {
          const inactive = row.original.is_active === false || row.original.isActive === false
          return (
            <div className="flex justify-end gap-2">
              <Button variant="secondary" size="sm" as={Link} to={`/admin/users/${row.original.id}`}>
                View
              </Button>
              <Button
                variant={inactive ? "primary" : "danger"}
                size="sm"
                onClick={async () => {
                  try {
                    if (inactive) await activateUser(row.original.id).unwrap()
                    else await deactivateUser(row.original.id).unwrap()
                    toast.success(inactive ? "User activated" : "User deactivated")
                  } catch (err) {
                    toast.error(parseApiError(err?.data || err))
                  }
                }}
              >
                {inactive ? "Activate" : "Deactivate"}
              </Button>
            </div>
          )
        }
      }
    ],
    [activateUser, deactivateUser]
  )

  if (isLoading) return <PageLoader />
  if (error) return <ErrorState error={error?.data || error} onRetry={refetch} />

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-semibold text-slate-900">Users</h1>
        <div className="flex items-center gap-2">
          <SearchInput placeholder="Search..." value={search} onChange={(e) => { setPage(1); setSearch(e.target.value) }} className="w-[260px]" />
          <Button as={Link} to="/admin/users/new">
            New user
          </Button>
        </div>
      </div>
      <DataTable columns={columns} data={users} emptyTitle="No users" emptyDescription="No users found." />
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  )
}
