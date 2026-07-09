import { baseApi } from "@/store/api"
import { QUERY_TAGS } from "@/constants/queryKeys"
export const doctorsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMyDoctorProfile: builder.query({
      query: () => "/doctors/me",
      providesTags: [QUERY_TAGS.DOCTORS]
    }),
    getDoctors: builder.query({
      query: (params) => ({ url: "/doctors", params }),
      providesTags: [QUERY_TAGS.DOCTORS]
    }),
    getDoctor: builder.query({
      query: (id) => `/doctors/${id}`,
      providesTags: (result, error, id) => [{ type: QUERY_TAGS.DOCTORS, id }]
    }),
    createDoctor: builder.mutation({
      query: (body) => ({ url: "/doctors", method: "POST", body }),
      invalidatesTags: [QUERY_TAGS.DOCTORS]
    }),
    updateDoctor: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/doctors/${id}`, method: "PATCH", body }),
      invalidatesTags: (result, error, { id }) => [QUERY_TAGS.DOCTORS, { type: QUERY_TAGS.DOCTORS, id }]
    }),
    getDoctorSchedule: builder.query({
      query: (id) => `/doctors/${id}/schedule`,
      providesTags: [QUERY_TAGS.DOCTORS]
    }),
    setDoctorSchedule: builder.mutation({
      query: ({ doctorId, schedule }) => ({ url: `/doctors/${doctorId}/schedule`, method: "PUT", body: { schedule } }),
      invalidatesTags: [QUERY_TAGS.DOCTORS]
    }),
    getDoctorLeaves: builder.query({
      query: (doctorId) => `/doctors/${doctorId}/leaves`,
      providesTags: [QUERY_TAGS.DOCTORS]
    }),
    addDoctorLeave: builder.mutation({
      query: ({ doctorId, ...body }) => ({ url: `/doctors/${doctorId}/leaves`, method: "POST", body }),
      invalidatesTags: [QUERY_TAGS.DOCTORS]
    }),
    removeDoctorLeave: builder.mutation({
      query: ({ doctorId, leaveId }) => ({ url: `/doctors/${doctorId}/leaves/${leaveId}`, method: "DELETE" }),
      invalidatesTags: [QUERY_TAGS.DOCTORS]
    }),
    getDoctorAvailability: builder.query({
      query: ({ doctorId, date }) => ({ url: `/doctors/${doctorId}/availability`, params: { date } }),
      providesTags: [QUERY_TAGS.DOCTORS]
    })
  })
})
export const {
  useGetMyDoctorProfileQuery,
  useGetDoctorsQuery,
  useGetDoctorQuery,
  useCreateDoctorMutation,
  useUpdateDoctorMutation,
  useGetDoctorScheduleQuery,
  useSetDoctorScheduleMutation,
  useGetDoctorLeavesQuery,
  useAddDoctorLeaveMutation,
  useRemoveDoctorLeaveMutation,
  useGetDoctorAvailabilityQuery
} = doctorsApi
