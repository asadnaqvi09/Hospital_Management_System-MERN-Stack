import { baseApi } from "@/store/api"
import { QUERY_TAGS } from "@/constants/queryKeys"
export const medicinesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMedicines: builder.query({
      query: (params) => ({ url: "/medicines", params }),
      providesTags: [QUERY_TAGS.MEDICINES]
    }),
    getMedicine: builder.query({
      query: (id) => `/medicines/${id}`,
      providesTags: (result, error, id) => [{ type: QUERY_TAGS.MEDICINES, id }]
    }),
    createMedicine: builder.mutation({
      query: (body) => ({ url: "/medicines", method: "POST", body }),
      invalidatesTags: [QUERY_TAGS.MEDICINES]
    }),
    updateMedicine: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/medicines/${id}`, method: "PATCH", body }),
      invalidatesTags: [QUERY_TAGS.MEDICINES]
    }),
    receiveBatch: builder.mutation({
      query: ({ medicineId, ...body }) => ({ url: `/medicines/${medicineId}/batches`, method: "POST", body }),
      invalidatesTags: [QUERY_TAGS.MEDICINES]
    })
  })
})
export const {
  useGetMedicinesQuery,
  useGetMedicineQuery,
  useCreateMedicineMutation,
  useUpdateMedicineMutation,
  useReceiveBatchMutation
} = medicinesApi
