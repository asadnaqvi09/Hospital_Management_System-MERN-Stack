import { baseApi } from "@/store/api"
import { QUERY_TAGS } from "@/constants/queryKeys"
export const labApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getLabOrders: builder.query({
      query: (params) => ({ url: "/lab/orders", params }),
      providesTags: [QUERY_TAGS.LAB]
    }),
    getLabOrder: builder.query({
      query: (id) => `/lab/orders/${id}`,
      providesTags: (result, error, id) => [{ type: QUERY_TAGS.LAB, id }]
    }),
    createLabOrder: builder.mutation({
      query: (body) => ({ url: "/lab/orders", method: "POST", body }),
      invalidatesTags: [QUERY_TAGS.LAB]
    }),
    submitLabResults: builder.mutation({
      query: ({ orderId, itemId, ...body }) => ({
        url: `/lab/orders/${orderId}/items/${itemId}/results`,
        method: "PATCH",
        body
      }),
      invalidatesTags: [QUERY_TAGS.LAB]
    }),
    getLabTests: builder.query({
      query: (params) => ({ url: "/lab/tests", params }),
      providesTags: [QUERY_TAGS.LAB]
    }),
    createLabTest: builder.mutation({
      query: (body) => ({ url: "/lab/tests", method: "POST", body }),
      invalidatesTags: [QUERY_TAGS.LAB]
    }),
    updateLabTest: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/lab/tests/${id}`, method: "PATCH", body }),
      invalidatesTags: [QUERY_TAGS.LAB]
    }),
    deleteLabTest: builder.mutation({
      query: (id) => ({ url: `/lab/tests/${id}`, method: "DELETE" }),
      invalidatesTags: [QUERY_TAGS.LAB]
    })
  })
})
export const {
  useGetLabOrdersQuery,
  useGetLabOrderQuery,
  useCreateLabOrderMutation,
  useSubmitLabResultsMutation,
  useGetLabTestsQuery,
  useCreateLabTestMutation,
  useUpdateLabTestMutation,
  useDeleteLabTestMutation
} = labApi
