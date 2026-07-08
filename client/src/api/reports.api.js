import { baseApi } from "@/store/api"
import { QUERY_TAGS } from "@/constants/queryKeys"
export const reportsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getRevenueReport: builder.query({
      query: (params) => ({ url: "/reports/revenue", params }),
      providesTags: [QUERY_TAGS.REPORTS]
    }),
    getPatientVolumeReport: builder.query({
      query: (params) => ({ url: "/reports/patient-volume", params }),
      providesTags: [QUERY_TAGS.REPORTS]
    }),
    getDoctorPerformanceReport: builder.query({
      query: (params) => ({ url: "/reports/doctor-performance", params }),
      providesTags: [QUERY_TAGS.REPORTS]
    }),
    getAppointmentAnalytics: builder.query({
      query: (params) => ({ url: "/reports/appointments", params }),
      providesTags: [QUERY_TAGS.REPORTS]
    }),
    getBedOccupancyReport: builder.query({
      query: (params) => ({ url: "/reports/bed-occupancy", params }),
      providesTags: [QUERY_TAGS.REPORTS]
    })
  })
})
export const {
  useGetRevenueReportQuery,
  useGetPatientVolumeReportQuery,
  useGetDoctorPerformanceReportQuery,
  useGetAppointmentAnalyticsQuery,
  useGetBedOccupancyReportQuery
} = reportsApi
