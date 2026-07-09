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
      query: (params) => ({ url: "/reports/appointment-analytics", params }),
      providesTags: [QUERY_TAGS.REPORTS]
    }),
    getBedOccupancyReport: builder.query({
      query: (params) => ({ url: "/reports/bed-occupancy", params }),
      providesTags: [QUERY_TAGS.REPORTS]
    }),
    getLabTurnaroundReport: builder.query({
      query: (params) => ({ url: "/reports/lab-turnaround", params }),
      providesTags: [QUERY_TAGS.REPORTS]
    }),
    getPharmacyReport: builder.query({
      query: (params) => ({ url: "/reports/pharmacy", params }),
      providesTags: [QUERY_TAGS.REPORTS]
    }),
    refreshReports: builder.mutation({
      query: () => ({ url: "/reports/refresh", method: "POST" }),
      invalidatesTags: [QUERY_TAGS.REPORTS]
    })
  })
})

export const {
  useGetRevenueReportQuery,
  useGetPatientVolumeReportQuery,
  useGetDoctorPerformanceReportQuery,
  useGetAppointmentAnalyticsQuery,
  useGetBedOccupancyReportQuery,
  useGetLabTurnaroundReportQuery,
  useGetPharmacyReportQuery,
  useRefreshReportsMutation
} = reportsApi
