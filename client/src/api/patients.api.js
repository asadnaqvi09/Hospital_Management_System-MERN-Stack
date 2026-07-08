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
    updatePatient: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/patients/${id}`, method: "PATCH", body }),
      invalidatesTags: [QUERY_TAGS.PATIENTS]
    }),
    getPatientEmr: builder.query({
      query: (id) => `/patients/${id}/emr`,
      providesTags: (result, error, id) => [{ type: QUERY_TAGS.PATIENTS, id }]
    })
  })
})
export const {
  useGetPatientsQuery,
  useGetPatientQuery,
  useCreatePatientMutation,
  useUpdatePatientMutation,
  useGetPatientEmrQuery
} = patientsApi
