import { baseApi } from "@/store/api"
import { QUERY_TAGS } from "@/constants/queryKeys"
export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation({
      query: (body) => ({ url: "/auth/login", method: "POST", body }),
      invalidatesTags: [QUERY_TAGS.AUTH]
    }),
    refresh: builder.mutation({
      query: (body) => ({ url: "/auth/refresh", method: "POST", body }),
      invalidatesTags: [QUERY_TAGS.AUTH]
    }),
    me: builder.query({
      query: () => "/auth/me",
      providesTags: [QUERY_TAGS.AUTH]
    }),
    logout: builder.mutation({
      query: (body) => ({ url: "/auth/logout", method: "POST", body }),
      invalidatesTags: [QUERY_TAGS.AUTH]
    }),
    forgotPassword: builder.mutation({
      query: (body) => ({ url: "/auth/forgot-password", method: "POST", body })
    }),
    resetPassword: builder.mutation({
      query: (body) => ({ url: "/auth/reset-password", method: "POST", body })
    }),
    verifyTwoFactor: builder.mutation({
      query: (body) => ({ url: "/auth/2fa/verify", method: "POST", body })
    }),
    setupTwoFactor: builder.mutation({
      query: () => ({ url: "/auth/2fa/setup", method: "POST" })
    }),
    enableTwoFactor: builder.mutation({
      query: (body) => ({ url: "/auth/2fa/enable", method: "POST", body }),
      invalidatesTags: [QUERY_TAGS.AUTH]
    }),
    sessions: builder.query({
      query: () => "/auth/sessions",
      providesTags: [QUERY_TAGS.AUTH]
    }),
    revokeSession: builder.mutation({
      query: (sessionId) => ({ url: `/auth/sessions/${sessionId}`, method: "DELETE" }),
      invalidatesTags: [QUERY_TAGS.AUTH]
    })
  })
})
export const {
  useLoginMutation,
  useRefreshMutation,
  useMeQuery,
  useLazyMeQuery,
  useLogoutMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useVerifyTwoFactorMutation,
  useSetupTwoFactorMutation,
  useEnableTwoFactorMutation,
  useSessionsQuery,
  useRevokeSessionMutation
} = authApi
