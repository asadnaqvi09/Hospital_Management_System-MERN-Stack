import { useGetUnreadCountQuery } from "@/api/notifications.api"
import { useSocket } from "./useSocket"
export function useNotifications() {
  useSocket()
  const { data, isLoading, refetch } = useGetUnreadCountQuery(undefined, {
    skip: false
  })
  const count = data?.data?.count ?? data?.count ?? 0
  return { count, isLoading, refetch }
}
