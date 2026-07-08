import { Bell } from "lucide-react"
import { Link } from "react-router-dom"
import { useNotifications } from "@/hooks/useNotifications"
import { ROUTES } from "@/constants/routes"
export function NotificationBell() {
  const { count } = useNotifications()
  return (
    <Link
      to={ROUTES.NOTIFICATIONS}
      className="relative rounded-lg p-2 text-slate-600 hover:bg-slate-100"
    >
      <Bell className="h-5 w-5" />
      {count > 0 && (
        <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-medium text-white">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  )
}
export default NotificationBell
