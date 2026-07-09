import { baseApi } from "@/store/api"
import { QUERY_TAGS } from "@/constants/queryKeys"
export const doctorsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
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
    getDoctorSchedule: builder.query({
      query: (id) => `/doctors/${id}/schedule`,
      providesTags: [QUERY_TAGS.DOCTORS]
    }),
    setDoctorSchedule: builder.mutation({
      query: ({ doctorId, schedule }) => ({ url: `/doctors/${doctorId}/schedule`, method: "PUT", body: { schedule } }),
      invalidatesTags: [QUERY_TAGS.DOCTORS]
    }),
    getDoctorAvailability: builder.query({
      query: ({ doctorId, date }) => ({ url: `/doctors/${doctorId}/availability`, params: { date } }),
      providesTags: [QUERY_TAGS.DOCTORS]
    })
  })
})
export const {
  useGetDoctorsQuery,
  useGetDoctorQuery,
  useCreateDoctorMutation,
  useGetDoctorScheduleQuery,
  useSetDoctorScheduleMutation,
  useGetDoctorAvailabilityQuery
} = doctorsApi
