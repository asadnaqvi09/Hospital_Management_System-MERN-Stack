import { Link, useLocation } from "react-router-dom"
import { ChevronRight } from "lucide-react"
export function Breadcrumbs() {
  const location = useLocation()
  const segments = location.pathname.split("/").filter(Boolean)
  if (!segments.length) return null
  const crumbs = segments.map((segment, index) => {
    const path = `/${segments.slice(0, index + 1).join("/")}`
    return { label: segment.replace(/-/g, " "), path }
  })
  return (
    <nav className="mb-4 flex items-center gap-1 text-sm text-slate-500">
      {crumbs.map((crumb, index) => (
        <span key={crumb.path} className="flex items-center gap-1 capitalize">
          {index > 0 && <ChevronRight className="h-4 w-4" />}
          {index === crumbs.length - 1 ? (
            <span className="text-slate-900">{crumb.label}</span>
          ) : (
            <Link to={crumb.path} className="hover:text-teal-700">
              {crumb.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  )
}
export default Breadcrumbs
