import { baseApi } from "@/store/api"
import { QUERY_TAGS } from "@/constants/queryKeys"
export const prescriptionsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPrescriptions: builder.query({
      query: (params) => ({ url: "/prescriptions", params }),
      providesTags: [QUERY_TAGS.PRESCRIPTIONS]
    }),
    getPrescription: builder.query({
      query: (id) => `/prescriptions/${id}`,
      providesTags: (result, error, id) => [{ type: QUERY_TAGS.PRESCRIPTIONS, id }]
    }),
    createPrescription: builder.mutation({
      query: (body) => ({ url: "/prescriptions", method: "POST", body }),
      invalidatesTags: [QUERY_TAGS.PRESCRIPTIONS]
    }),
    dispensePrescription: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/prescriptions/${id}/dispense`, method: "POST", body }),
      invalidatesTags: [QUERY_TAGS.PRESCRIPTIONS]
    })
  })
})
export const {
  useGetPrescriptionsQuery,
  useGetPrescriptionQuery,
  useCreatePrescriptionMutation,
  useDispensePrescriptionMutation
} = prescriptionsApi
