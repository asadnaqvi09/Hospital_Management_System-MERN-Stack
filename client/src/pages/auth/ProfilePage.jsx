import { useMeQuery } from "@/api/auth.api"
import PageLoader from "@/components/feedback/PageLoader"
import ErrorState from "@/components/ui/ErrorState"
export default function ProfilePage() {
  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold text-slate-900">Profile</h1>
      <ProfileCard />
    </div>
  )
}
function ProfileCard() {
  const { data, isLoading, error, refetch } = useMeQuery()
  if (isLoading) return <PageLoader />
  if (error) return <ErrorState error={error?.data || error} onRetry={refetch} />
  const user = data?.data?.user || data?.user || data
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Full name</p>
          <p className="mt-1 text-sm font-medium text-slate-900">{user?.fullName || "-"}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Email</p>
          <p className="mt-1 text-sm font-medium text-slate-900">{user?.email || "-"}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Role</p>
          <p className="mt-1 text-sm font-medium capitalize text-slate-900">{user?.role?.replace("_", " ") || "-"}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">2FA</p>
          <p className="mt-1 text-sm font-medium text-slate-900">{user?.twoFactorEnabled ? "Enabled" : "Disabled"}</p>
        </div>
      </div>
    </div>
  )
}
