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
    createConsultation: builder.mutation({
      query: (body) => ({ url: "/consultations", method: "POST", body }),
      invalidatesTags: [QUERY_TAGS.CONSULTATIONS]
    }),
    updateConsultation: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/consultations/${id}`, method: "PATCH", body }),
      invalidatesTags: [QUERY_TAGS.CONSULTATIONS]
    })
  })
})
export const {
  useGetConsultationsQuery,
  useGetConsultationQuery,
  useCreateConsultationMutation,
  useUpdateConsultationMutation
} = consultationsApi
