import { Outlet } from "react-router-dom"
import Sidebar from "./components/Sidebar"
import Topbar from "./components/Topbar"
import MobileSidebar from "./components/MobileSidebar"
import { useSelector } from "react-redux"
import { cn } from "@/utils/cn"
export function DashboardLayout() {
  const sidebarOpen = useSelector((state) => state.ui.sidebarOpen)
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <MobileSidebar />
      <div className={cn("flex flex-1 flex-col transition-all", sidebarOpen ? "lg:ml-64" : "lg:ml-20")}>
        <Topbar />
        <main className="flex-1 p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
export default DashboardLayout
