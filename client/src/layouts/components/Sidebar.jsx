import * as Icons from "lucide-react"
import { NavLink } from "react-router-dom"
import { useSelector } from "react-redux"
import { NAVIGATION } from "@/config/navigation"
import { env } from "@/config/env"
import { NavBadge } from "@/components/feedback/ComingSoonPanel"
import { cn } from "@/utils/cn"
function NavIcon({ name }) {
  const Icon = Icons[name] || Icons.Circle
  return <Icon className="h-5 w-5 shrink-0" />
}
export function Sidebar() {
  const role = useSelector((state) => state.auth.user?.role)
  const sidebarOpen = useSelector((state) => state.ui.sidebarOpen)
  const items = NAVIGATION[role] || []
  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-30 hidden border-r border-slate-200 bg-white lg:flex lg:flex-col",
        sidebarOpen ? "w-64" : "w-20"
      )}
    >
      <div className="flex h-16 items-center border-b border-slate-200 px-4">
        <span className="truncate text-lg font-semibold text-teal-700">
          {sidebarOpen ? env.appName : "CC"}
        </span>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {items.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path.split("/").length <= 2}
            className={({ isActive }) =>
              cn(
                "relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-teal-50 text-teal-700"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              )
            }
          >
            <NavIcon name={item.icon} />
            {sidebarOpen ? (
              <>
                <span className="min-w-0 flex-1 truncate">{item.label}</span>
                {item.badge && <NavBadge>{item.badge}</NavBadge>}
              </>
            ) : (
              item.badge && <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-amber-400" aria-hidden />
            )}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
export default Sidebar
