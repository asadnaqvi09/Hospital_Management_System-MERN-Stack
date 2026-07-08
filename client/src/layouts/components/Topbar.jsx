import { useDispatch, useSelector } from "react-redux"
import { Menu, PanelLeftClose, PanelLeftOpen } from "lucide-react"
import { toggleSidebar, toggleMobileSidebar } from "@/store/uiSlice"
import { useAuth } from "@/hooks/useAuth"
import NotificationBell from "@/components/domain/NotificationBell"
import PatientSearchBar from "@/components/domain/PatientSearchBar"
import { env } from "@/config/env"
export function Topbar() {
  const dispatch = useDispatch()
  const sidebarOpen = useSelector((state) => state.ui.sidebarOpen)
  const user = useSelector((state) => state.auth.user)
  const { logout } = useAuth()
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => dispatch(toggleMobileSidebar())}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={() => dispatch(toggleSidebar())}
          className="hidden rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:inline-flex"
        >
          {sidebarOpen ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeftOpen className="h-5 w-5" />}
        </button>
        <span className="text-sm font-medium text-slate-500 lg:hidden">{env.appName}</span>
      </div>
      <div className="flex items-center gap-3">
        <PatientSearchBar />
        <NotificationBell />
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium text-slate-900">{user?.name || user?.email}</p>
          <p className="text-xs capitalize text-slate-500">{user?.role?.replace("_", " ")}</p>
        </div>
        <button
          type="button"
          onClick={logout}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
        >
          Logout
        </button>
      </div>
    </header>
  )
}
export default Topbar
