import { baseApi } from "@/store/api"
import { QUERY_TAGS } from "@/constants/queryKeys"
export const usersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getUsers: builder.query({
      query: (params) => ({ url: "/users", params }),
      providesTags: [QUERY_TAGS.USERS]
    }),
    getUser: builder.query({
      query: (id) => `/users/${id}`,
      providesTags: (result, error, id) => [{ type: QUERY_TAGS.USERS, id }]
    }),
    createUser: builder.mutation({
      query: (body) => ({ url: "/users", method: "POST", body }),
      invalidatesTags: [QUERY_TAGS.USERS]
    }),
    updateUser: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/users/${id}`, method: "PATCH", body }),
      invalidatesTags: [QUERY_TAGS.USERS]
    }),
    changeUserRole: builder.mutation({
      query: ({ id, role }) => ({ url: `/users/${id}/role`, method: "PATCH", body: { role } }),
      invalidatesTags: [QUERY_TAGS.USERS]
    }),
    deactivateUser: builder.mutation({
      query: (id) => ({ url: `/users/${id}/deactivate`, method: "PATCH" }),
      invalidatesTags: [QUERY_TAGS.USERS]
    }),
    activateUser: builder.mutation({
      query: (id) => ({ url: `/users/${id}/activate`, method: "PATCH" }),
      invalidatesTags: [QUERY_TAGS.USERS]
    })
  })
})
export const {
  useGetUsersQuery,
  useGetUserQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useChangeUserRoleMutation,
  useDeactivateUserMutation,
  useActivateUserMutation
} = usersApi
