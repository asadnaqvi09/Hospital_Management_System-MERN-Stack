import { baseApi } from "@/store/api"
import { QUERY_TAGS } from "@/constants/queryKeys"
export const aiApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    symptomCheck: builder.mutation({
      query: (body) => ({ url: "/ai/symptom-check", method: "POST", body }),
      invalidatesTags: [QUERY_TAGS.AI]
    }),
    getSymptomResult: builder.query({
      query: (id) => `/ai/symptom-check/${id}`,
      providesTags: [QUERY_TAGS.AI]
    }),
    drugInteraction: builder.mutation({
      query: (body) => ({ url: "/ai/drug-interactions", method: "POST", body })
    }),
    noShowPrediction: builder.mutation({
      query: (body) => ({ url: "/ai/no-show-prediction", method: "POST", body })
    })
  })
})
export const {
  useSymptomCheckMutation,
  useGetSymptomResultQuery,
  useDrugInteractionMutation,
  useNoShowPredictionMutation
} = aiApi
