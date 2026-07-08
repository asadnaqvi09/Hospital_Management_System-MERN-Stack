import { baseApi } from "@/store/api"
import { QUERY_TAGS } from "@/constants/queryKeys"
export const ipdApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getRooms: builder.query({
      query: (params) => ({ url: "/ipd/rooms", params }),
      providesTags: [QUERY_TAGS.IPD]
    }),
    getAdmissions: builder.query({
      query: (params) => ({ url: "/ipd/admissions", params }),
      providesTags: [QUERY_TAGS.IPD]
    }),
    getAdmission: builder.query({
      query: (id) => `/ipd/admissions/${id}`,
      providesTags: (result, error, id) => [{ type: QUERY_TAGS.IPD, id }]
    }),
    createAdmission: builder.mutation({
      query: (body) => ({ url: "/ipd/admissions", method: "POST", body }),
      invalidatesTags: [QUERY_TAGS.IPD]
    })
  })
})
export const {
  useGetRoomsQuery,
  useGetAdmissionsQuery,
  useGetAdmissionQuery,
  useCreateAdmissionMutation
} = ipdApi
