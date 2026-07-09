import { baseApi } from "@/store/api"
import { QUERY_TAGS } from "@/constants/queryKeys"

export const ipdApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getRooms: builder.query({
      query: (params) => ({ url: "/ipd/rooms", params }),
      providesTags: [QUERY_TAGS.IPD]
    }),
    createRoom: builder.mutation({
      query: (body) => ({ url: "/ipd/rooms", method: "POST", body }),
      invalidatesTags: [QUERY_TAGS.IPD]
    }),
    updateRoom: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/ipd/rooms/${id}`, method: "PATCH", body }),
      invalidatesTags: [QUERY_TAGS.IPD]
    }),
    getAdmissions: builder.query({
      query: (params) => ({ url: "/ipd/admissions", params }),
      providesTags: [QUERY_TAGS.IPD]
    }),
    getAdmission: builder.query({
      query: (id) => `/ipd/admissions/${id}`,
      providesTags: (result, error, id) => [{ type: QUERY_TAGS.IPD, id }]
    }),
    getAdmissionNotes: builder.query({
      query: (id) => `/ipd/admissions/${id}/notes`,
      providesTags: (result, error, id) => [{ type: QUERY_TAGS.IPD, id: `${id}:notes` }]
    }),
    createAdmission: builder.mutation({
      query: (body) => ({ url: "/ipd/admissions", method: "POST", body }),
      invalidatesTags: [QUERY_TAGS.IPD]
    }),
    dischargeAdmission: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/ipd/admissions/${id}/discharge`,
        method: "PATCH",
        body
      }),
      invalidatesTags: [QUERY_TAGS.IPD]
    }),
    addNursingNote: builder.mutation({
      query: ({ admissionId, ...body }) => ({
        url: `/ipd/admissions/${admissionId}/notes`,
        method: "POST",
        body
      }),
      invalidatesTags: (result, error, { admissionId }) => [
        QUERY_TAGS.IPD,
        { type: QUERY_TAGS.IPD, id: admissionId },
        { type: QUERY_TAGS.IPD, id: `${admissionId}:notes` }
      ]
    })
  })
})

export const {
  useGetRoomsQuery,
  useCreateRoomMutation,
  useUpdateRoomMutation,
  useGetAdmissionsQuery,
  useGetAdmissionQuery,
  useGetAdmissionNotesQuery,
  useCreateAdmissionMutation,
  useDischargeAdmissionMutation,
  useAddNursingNoteMutation
} = ipdApi
