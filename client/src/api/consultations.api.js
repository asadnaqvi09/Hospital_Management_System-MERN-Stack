import { baseApi } from "@/store/api"
import { QUERY_TAGS } from "@/constants/queryKeys"
export const consultationsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getConsultations: builder.query({
      query: (params) => ({ url: "/consultations", params }),
      providesTags: [QUERY_TAGS.CONSULTATIONS]
    }),
    getConsultation: builder.query({
      query: (id) => `/consultations/${id}`,
      providesTags: (result, error, id) => [{ type: QUERY_TAGS.CONSULTATIONS, id }]
    }),
    getConsultationByAppointment: builder.query({
      query: (appointmentId) => `/consultations/appointment/${appointmentId}`,
      providesTags: (result, error, appointmentId) => [{ type: QUERY_TAGS.CONSULTATIONS, id: `appointment:${appointmentId}` }]
    }),
    createConsultation: builder.mutation({
      query: (body) => ({ url: "/consultations", method: "POST", body }),
      invalidatesTags: [QUERY_TAGS.CONSULTATIONS, QUERY_TAGS.APPOINTMENTS]
    }),
    updateConsultation: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/consultations/${id}`, method: "PATCH", body }),
      invalidatesTags: [QUERY_TAGS.CONSULTATIONS]
    }),
    completeConsultation: builder.mutation({
      query: (id) => ({ url: `/consultations/${id}/complete`, method: "PATCH" }),
      invalidatesTags: [QUERY_TAGS.CONSULTATIONS, QUERY_TAGS.APPOINTMENTS]
    })
  })
})
export const {
  useGetConsultationsQuery,
  useGetConsultationQuery,
  useGetConsultationByAppointmentQuery,
  useCreateConsultationMutation,
  useUpdateConsultationMutation,
  useCompleteConsultationMutation
} = consultationsApi
