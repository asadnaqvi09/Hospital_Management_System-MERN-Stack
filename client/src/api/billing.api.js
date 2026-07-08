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
    recordPayment: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/billing/invoices/${id}/payments`, method: "POST", body }),
      invalidatesTags: [QUERY_TAGS.BILLING]
    })
  })
})
export const {
  useGetInvoicesQuery,
  useGetInvoiceQuery,
  useCreateInvoiceMutation,
  useRecordPaymentMutation
} = billingApi
