import { baseApi } from "@/store/api"
import { QUERY_TAGS } from "@/constants/queryKeys"
export const searchApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    searchPatients: builder.query({
      query: (q) => ({ url: "/search/patients", params: { q } }),
      providesTags: [QUERY_TAGS.SEARCH]
    }),
    globalSearch: builder.query({
      query: (q) => ({ url: "/search", params: { q } }),
      providesTags: [QUERY_TAGS.SEARCH]
    })
  })
})
export const { useSearchPatientsQuery, useLazySearchPatientsQuery, useGlobalSearchQuery } = searchApi
