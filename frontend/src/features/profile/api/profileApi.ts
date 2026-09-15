import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth, registerCacheReset } from "@/services/baseQuery";
import { updateUser, logout } from "@/features/auth/slices/authSlice";
import type { ApiResponse } from "@/types/api.types";
import type {
   ProfileResponse,
   UpdateProfileRequest,
} from "../types/profile.types";

export const profileApi = createApi({
   reducerPath: "profileApi",
   baseQuery: baseQueryWithReauth,
   tagTypes: ["Profile"],
   endpoints: (build) => ({
      //Get profile
      getProfile: build.query<ProfileResponse, void>({
         query: () => "/profile",
         transformResponse: (response: ApiResponse<ProfileResponse>) =>
            response.data,
         providesTags: ["Profile"],
         onQueryStarted: async (_, { dispatch, queryFulfilled }) => {
            try {
               const { data } = await queryFulfilled;
               // Sync profile changes (email, avatar) into the auth slice
               dispatch(
                  updateUser({ email: data.email, avatarUrl: data.avatarUrl }),
               );
            } catch {
               // ignore
            }
         },
      }),

      //Update profile
      updateProfile: build.mutation<ProfileResponse, UpdateProfileRequest>({
         query: (body) => ({ url: "/profile", method: "PATCH", body }),
         transformResponse: (response: ApiResponse<ProfileResponse>) =>
            response.data,
         invalidatesTags: ["Profile"],
         onQueryStarted: async (_, { dispatch, queryFulfilled }) => {
            try {
               const { data } = await queryFulfilled;
               dispatch(
                  updateUser({ email: data.email, avatarUrl: data.avatarUrl }),
               );
            } catch {
               // ignore
            }
         },
      }),

      //Delete account
      deleteAccount: build.mutation<void, void>({
         query: () => ({ url: "/profile", method: "DELETE" }),
         onQueryStarted: async (_, { dispatch, queryFulfilled }) => {
            try {
               await queryFulfilled;
               // Successfully deleted — clear ALL cached data before forcing logout
               // so the next user never sees this user's stale data.
               dispatch(profileApi.util.resetApiState());
               dispatch(logout());
            } catch {
               // ignore
            }
         },
      }),
   }),
});

export const {
   useGetProfileQuery,
   useUpdateProfileMutation,
   useDeleteAccountMutation,
} = profileApi;

// Register this API's cache-reset callback with baseQuery so the 401-forced-logout
// path can wipe stale data without creating a circular import.
registerCacheReset((dispatch) => dispatch(profileApi.util.resetApiState()));
