import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react"
import { X } from "lucide-react"
import { useDispatch, useSelector } from "react-redux"
import { NavLink } from "react-router-dom"
import * as Icons from "lucide-react"
import { setMobileSidebarOpen } from "@/store/uiSlice"
import { NAVIGATION } from "@/config/navigation"
import { cn } from "@/utils/cn"
function NavIcon({ name }) {
  const Icon = Icons[name] || Icons.Circle
  return <Icon className="h-5 w-5 shrink-0" />
}
export function MobileSidebar() {
  const dispatch = useDispatch()
  const open = useSelector((state) => state.ui.mobileSidebarOpen)
  const role = useSelector((state) => state.auth.user?.role)
  const items = NAVIGATION[role] || []
  return (
    <Dialog open={open} onClose={() => dispatch(setMobileSidebarOpen(false))} className="relative z-40 lg:hidden">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex">
        <DialogPanel className="flex w-72 max-w-full flex-col bg-white shadow-xl">
          <div className="flex h-16 items-center justify-between border-b border-slate-200 px-4">
            <DialogTitle className="text-lg font-semibold text-teal-700">Menu</DialogTitle>
            <button
              type="button"
              onClick={() => dispatch(setMobileSidebarOpen(false))}
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <nav className="flex-1 space-y-1 overflow-y-auto p-3">
            {items.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => dispatch(setMobileSidebarOpen(false))}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium",
                    isActive ? "bg-teal-50 text-teal-700" : "text-slate-600 hover:bg-slate-100"
                  )
                }
              >
                <NavIcon name={item.icon} />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </DialogPanel>
      </div>
    </Dialog>
  )
}
export default MobileSidebar
