import { baseApi } from "@/store/api"
import { QUERY_TAGS } from "@/constants/queryKeys"
export const auditApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAuditLogs: builder.query({
      query: (params) => ({ url: "/audit", params }),
      providesTags: [QUERY_TAGS.AUDIT]
    }),
    getAuditLog: builder.query({
      query: (id) => `/audit/${id}`,
      providesTags: (result, error, id) => [{ type: QUERY_TAGS.AUDIT, id }]
    })
  })
})
export const { useGetAuditLogsQuery, useGetAuditLogQuery } = auditApi
