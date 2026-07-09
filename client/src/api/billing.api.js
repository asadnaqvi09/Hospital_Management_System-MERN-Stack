import { baseApi } from "@/store/api"
import { QUERY_TAGS } from "@/constants/queryKeys"

export const billingApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getInvoices: builder.query({
      query: (params) => ({ url: "/billing/invoices", params }),
      providesTags: [QUERY_TAGS.BILLING]
    }),
    getInvoice: builder.query({
      query: (id) => `/billing/invoices/${id}`,
      providesTags: (result, error, id) => [{ type: QUERY_TAGS.BILLING, id }]
    }),
    createInvoice: builder.mutation({
      query: (body) => ({ url: "/billing/invoices", method: "POST", body }),
      invalidatesTags: [QUERY_TAGS.BILLING]
    }),
    generateInvoice: builder.mutation({
      query: (body) => ({ url: "/billing/invoices/generate", method: "POST", body }),
      invalidatesTags: [QUERY_TAGS.BILLING]
    }),
    updateInvoice: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/billing/invoices/${id}`, method: "PATCH", body }),
      invalidatesTags: (result, error, { id }) => [QUERY_TAGS.BILLING, { type: QUERY_TAGS.BILLING, id }]
    }),
    finalizeInvoice: builder.mutation({
      query: (id) => ({ url: `/billing/invoices/${id}/finalize`, method: "POST" }),
      invalidatesTags: (result, error, id) => [QUERY_TAGS.BILLING, { type: QUERY_TAGS.BILLING, id }]
    }),
    cancelInvoice: builder.mutation({
      query: (id) => ({ url: `/billing/invoices/${id}/cancel`, method: "POST" }),
      invalidatesTags: (result, error, id) => [QUERY_TAGS.BILLING, { type: QUERY_TAGS.BILLING, id }]
    }),
    recordPayment: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/billing/invoices/${id}/payments`, method: "POST", body }),
      invalidatesTags: (result, error, { id }) => [QUERY_TAGS.BILLING, { type: QUERY_TAGS.BILLING, id }]
    })
  })
})

export const {
  useGetInvoicesQuery,
  useGetInvoiceQuery,
  useCreateInvoiceMutation,
  useGenerateInvoiceMutation,
  useUpdateInvoiceMutation,
  useFinalizeInvoiceMutation,
  useCancelInvoiceMutation,
  useRecordPaymentMutation
} = billingApi
