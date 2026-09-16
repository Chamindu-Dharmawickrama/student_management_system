import { baseQueryWithReauth, resetAllCaches } from "@/services/baseQuery";
import type { ApiResponse } from "@/types/api.types";
import { createApi } from "@reduxjs/toolkit/query/react";
import type {
   AuthResponseData,
   ChangePasswordRequest,
   ForgotPasswordRequest,
   LoginRequest,
   ResetPasswordRequest,
} from "../types/auth.types";
import { setCredentials, logout as logoutAction } from "../slices/authSlice";

export const authApi = createApi({
   reducerPath: "authApi",
   baseQuery: baseQueryWithReauth,
   endpoints: (build) => ({
      // login API
      login: build.mutation<ApiResponse<AuthResponseData>, LoginRequest>({
         query: (body) => ({ url: "/auth/login", method: "POST", body }),
         onQueryStarted: async (_, { dispatch, queryFulfilled }) => {
            try {
               // Wait until the API request finishes successfully.
               const { data } = await queryFulfilled;
               dispatch(
                  setCredentials({
                     user: data.data.user,
                     accessToken: data.data.accessToken,
                  }),
               );
            } catch {
               /* login failed — nothing to sync */
            }
         },
      }),

      // Change password — the only route that escapes mustChangePassword=true.
      // Returns the same { accessToken, user } shape as login, so the response
      // (with a fresh, mustChangePassword:false claim) is the single source of
      // truth for clearing the forced-change gate — not an optimistic local flag.
      changePassword: build.mutation<
         ApiResponse<AuthResponseData>,
         ChangePasswordRequest
      >({
         query: (body) => ({
            url: "/auth/change-password",
            method: "POST",
            body,
         }),
         onQueryStarted: async (_, { dispatch, queryFulfilled }) => {
            try {
               const { data } = await queryFulfilled;
               dispatch(
                  setCredentials({
                     user: data.data.user,
                     accessToken: data.data.accessToken,
                  }),
               );
            } catch {
               /* change-password failed — nothing to sync */
            }
         },
      }),

      // logout API
      logout: build.mutation<ApiResponse<null>, void>({
         query: () => ({ url: "/auth/logout", method: "POST" }),
         onQueryStarted: async (_, { dispatch, queryFulfilled }) => {
            // Clear auth state and ALL cached API data so the next user
            // never sees a previous user's data from any RTK Query cache.
            dispatch(logoutAction());
            resetAllCaches(dispatch);
            try {
               await queryFulfilled;
            } catch {
               /* best-effort */
            }
         },
      }),

      // Logout all devices
      logoutAll: build.mutation<ApiResponse<null>, void>({
         query: () => ({ url: "/auth/logout-all", method: "POST" }),
         onQueryStarted: async (_, { dispatch, queryFulfilled }) => {
            dispatch(logoutAction());
            resetAllCaches(dispatch);
            try {
               await queryFulfilled;
            } catch {
               /* best-effort */
            }
         },
      }),

      // Forgot password
      forgotPassword: build.mutation<ApiResponse<null>, ForgotPasswordRequest>({
         query: (body) => ({
            url: "/auth/forgot-password",
            method: "POST",
            body,
         }),
      }),

      // Reset password
      resetPassword: build.mutation<ApiResponse<null>, ResetPasswordRequest>({
         query: (body) => ({
            url: "/auth/reset-password",
            method: "POST",
            body,
         }),
      }),
   }),
});

export const {
   useLoginMutation,
   useChangePasswordMutation,
   useLogoutMutation,
   useLogoutAllMutation,
   useForgotPasswordMutation,
   useResetPasswordMutation,
} = authApi;
