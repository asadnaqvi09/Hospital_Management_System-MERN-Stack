import { baseApi } from "@/store/api"
import { QUERY_TAGS } from "@/constants/queryKeys"
export const notificationsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getNotifications: builder.query({
      query: (params) => ({ url: "/notifications", params }),
      providesTags: [QUERY_TAGS.NOTIFICATIONS]
    }),
    getUnreadCount: builder.query({
      query: () => "/notifications/unread-count",
      providesTags: [QUERY_TAGS.NOTIFICATIONS]
    }),
    markRead: builder.mutation({
      query: (id) => ({ url: `/notifications/${id}/read`, method: "PATCH" }),
      invalidatesTags: [QUERY_TAGS.NOTIFICATIONS]
    }),
    markAllRead: builder.mutation({
      query: () => ({ url: "/notifications/read-all", method: "PATCH" }),
      invalidatesTags: [QUERY_TAGS.NOTIFICATIONS]
    })
  })
})
export const {
  useGetNotificationsQuery,
  useGetUnreadCountQuery,
  useMarkReadMutation,
  useMarkAllReadMutation
} = notificationsApi
