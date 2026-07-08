export default function NotFoundPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="max-w-md rounded-xl border border-slate-200 bg-white p-8 text-center">
        <p className="text-4xl font-bold text-slate-900">404</p>
        <h1 className="mt-2 text-lg font-semibold text-slate-900">Page not found</h1>
        <p className="mt-2 text-sm text-slate-600">The page you’re looking for doesn’t exist.</p>
      </div>
    </div>
  )
}
