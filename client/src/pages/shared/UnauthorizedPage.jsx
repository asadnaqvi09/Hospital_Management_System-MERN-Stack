export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="max-w-md rounded-xl border border-slate-200 bg-white p-8 text-center">
        <p className="text-4xl font-bold text-slate-900">403</p>
        <h1 className="mt-2 text-lg font-semibold text-slate-900">Unauthorized</h1>
        <p className="mt-2 text-sm text-slate-600">You don’t have permission to access this page.</p>
      </div>
    </div>
  )
}
