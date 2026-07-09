import { baseApi } from "@/store/api"
import { QUERY_TAGS } from "@/constants/queryKeys"
export const patientsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPatients: builder.query({
      query: (params) => ({ url: "/patients", params }),
      providesTags: [QUERY_TAGS.PATIENTS]
    }),
    getPatient: builder.query({
      query: (id) => `/patients/${id}`,
      providesTags: (result, error, id) => [{ type: QUERY_TAGS.PATIENTS, id }]
    }),
    createPatient: builder.mutation({
      query: (body) => ({ url: "/patients", method: "POST", body }),
      invalidatesTags: [QUERY_TAGS.PATIENTS]
    }),
    getPatientEmr: builder.query({
      query: (id) => `/patients/${id}/emr`,
      providesTags: (result, error, id) => [{ type: QUERY_TAGS.PATIENTS, id }]
    }),
    getPatientVitals: builder.query({
      query: (patientId) => `/patients/${patientId}/vitals`,
      providesTags: (result, error, patientId) => [{ type: QUERY_TAGS.PATIENTS, id: patientId }]
    }),
    recordPatientVitals: builder.mutation({
      query: ({ patientId, ...body }) => ({ url: `/patients/${patientId}/vitals`, method: "POST", body }),
      invalidatesTags: (result, error, { patientId }) => [{ type: QUERY_TAGS.PATIENTS, id: patientId }]
    })
  })
})
export const {
  useGetPatientsQuery,
  useGetPatientQuery,
  useCreatePatientMutation,
  useGetPatientEmrQuery,
  useGetPatientVitalsQuery,
  useRecordPatientVitalsMutation
} = patientsApi
