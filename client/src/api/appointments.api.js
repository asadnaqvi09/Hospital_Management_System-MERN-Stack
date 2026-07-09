import { baseApi } from "@/store/api"
import { QUERY_TAGS } from "@/constants/queryKeys"
export const appointmentsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAppointments: builder.query({
      query: (params) => ({ url: "/appointments", params }),
      providesTags: [QUERY_TAGS.APPOINTMENTS]
    }),
    getAppointment: builder.query({
      query: (id) => `/appointments/${id}`,
      providesTags: (result, error, id) => [{ type: QUERY_TAGS.APPOINTMENTS, id }]
    }),
    createAppointment: builder.mutation({
      query: (body) => ({ url: "/appointments", method: "POST", body }),
      invalidatesTags: [QUERY_TAGS.APPOINTMENTS]
    }),
    updateAppointmentStatus: builder.mutation({
      query: ({ id, status }) => ({
        url: `/appointments/${id}/status`,
        method: "PATCH",
        body: { status }
      }),
      invalidatesTags: [QUERY_TAGS.APPOINTMENTS]
    }),
    cancelAppointment: builder.mutation({
      query: (id) => ({ url: `/appointments/${id}/cancel`, method: "PATCH" }),
      invalidatesTags: [QUERY_TAGS.APPOINTMENTS]
    }),
    rescheduleAppointment: builder.mutation({
      query: ({ id, appointmentDate, slotTime }) => ({
        url: `/appointments/${id}/reschedule`,
        method: "PATCH",
        body: { appointmentDate, slotTime }
      }),
      invalidatesTags: [QUERY_TAGS.APPOINTMENTS]
    }),
    getQueue: builder.query({
      query: (params) => ({ url: "/appointments/queue", params }),
      providesTags: [QUERY_TAGS.APPOINTMENTS]
    })
  })
})
export const {
  useGetAppointmentsQuery,
  useGetAppointmentQuery,
  useLazyGetAppointmentQuery,
  useCreateAppointmentMutation,
  useUpdateAppointmentStatusMutation,
  useCancelAppointmentMutation,
  useRescheduleAppointmentMutation,
  useGetQueueQuery
} = appointmentsApi
