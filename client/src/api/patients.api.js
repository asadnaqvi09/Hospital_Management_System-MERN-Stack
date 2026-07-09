import { baseApi } from "@/store/api"
import { QUERY_TAGS } from "@/constants/queryKeys"

export const patientsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMyPatientProfile: builder.query({
      query: () => "/patients/me",
      providesTags: [QUERY_TAGS.PATIENTS]
    }),
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
    }),
    getPatientAllergies: builder.query({
      query: (patientId) => `/patients/${patientId}/allergies`,
      providesTags: (result, error, patientId) => [{ type: QUERY_TAGS.PATIENTS, id: `${patientId}:allergies` }]
    }),
    addPatientAllergy: builder.mutation({
      query: ({ patientId, ...body }) => ({ url: `/patients/${patientId}/allergies`, method: "POST", body }),
      invalidatesTags: (result, error, { patientId }) => [{ type: QUERY_TAGS.PATIENTS, id: `${patientId}:allergies` }]
    }),
    removePatientAllergy: builder.mutation({
      query: ({ patientId, allergyId }) => ({
        url: `/patients/${patientId}/allergies/${allergyId}`,
        method: "DELETE"
      }),
      invalidatesTags: (result, error, { patientId }) => [{ type: QUERY_TAGS.PATIENTS, id: `${patientId}:allergies` }]
    }),
    getPatientConditions: builder.query({
      query: (patientId) => `/patients/${patientId}/conditions`,
      providesTags: (result, error, patientId) => [{ type: QUERY_TAGS.PATIENTS, id: `${patientId}:conditions` }]
    }),
    addPatientCondition: builder.mutation({
      query: ({ patientId, ...body }) => ({ url: `/patients/${patientId}/conditions`, method: "POST", body }),
      invalidatesTags: (result, error, { patientId }) => [{ type: QUERY_TAGS.PATIENTS, id: `${patientId}:conditions` }]
    }),
    updatePatientCondition: builder.mutation({
      query: ({ patientId, conditionId, ...body }) => ({
        url: `/patients/${patientId}/conditions/${conditionId}`,
        method: "PATCH",
        body
      }),
      invalidatesTags: (result, error, { patientId }) => [{ type: QUERY_TAGS.PATIENTS, id: `${patientId}:conditions` }]
    }),
    getPatientDocuments: builder.query({
      query: (patientId) => `/patients/${patientId}/documents`,
      providesTags: (result, error, patientId) => [{ type: QUERY_TAGS.PATIENTS, id: `${patientId}:documents` }]
    }),
    uploadPatientDocument: builder.mutation({
      query: ({ patientId, file, title }) => {
        const formData = new FormData()
        formData.append("file", file)
        if (title) formData.append("title", title)
        return { url: `/patients/${patientId}/documents`, method: "POST", body: formData }
      },
      invalidatesTags: (result, error, { patientId }) => [{ type: QUERY_TAGS.PATIENTS, id: `${patientId}:documents` }]
    })
  })
})

export const {
  useGetMyPatientProfileQuery,
  useGetPatientsQuery,
  useGetPatientQuery,
  useCreatePatientMutation,
  useGetPatientEmrQuery,
  useGetPatientVitalsQuery,
  useRecordPatientVitalsMutation,
  useGetPatientAllergiesQuery,
  useAddPatientAllergyMutation,
  useRemovePatientAllergyMutation,
  useGetPatientConditionsQuery,
  useAddPatientConditionMutation,
  useUpdatePatientConditionMutation,
  useGetPatientDocumentsQuery,
  useUploadPatientDocumentMutation
} = patientsApi
