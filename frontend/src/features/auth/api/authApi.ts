import { baseQueryWithReauth } from "@/services/baseQuery";
import type { ApiResponse } from "@/types/api.types";
import { createApi } from "@reduxjs/toolkit/query/react";
import type {
   AuthResponseData,
   ForgotPasswordRequest,
   LoginRequest,
   RegisterRequest,
   ResetPasswordRequest,
} from "../types/auth.types";
import { setCredentials, logout as logoutAction } from "../slices/authSlice";
import { profileApi } from "@/features/profile/api/profileApi";

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
            } catch (error) {}
         },
      }),

      // register API
      register: build.mutation<
         ApiResponse<{ message: string }>,
         RegisterRequest
      >({
         query: (body) => ({ url: "/auth/register", method: "POST", body }),
      }),

      // logout API
      logout: build.mutation<ApiResponse<null>, void>({
         query: () => ({ url: "/auth/logout", method: "POST" }),
         onQueryStarted: async (_, { dispatch, queryFulfilled }) => {
            // Clear auth state and ALL cached API data so the next user
            // never sees a previous user's notes/profile from the RTK Query cache.
            dispatch(logoutAction());
            dispatch(profileApi.util.resetApiState());
            try {
               await queryFulfilled;
            } catch (error) {}
         },
      }),

      // Logout all devices
      logoutAll: build.mutation<ApiResponse<null>, void>({
         query: () => ({ url: "/auth/logout-all", method: "POST" }),
         onQueryStarted: async (_, { dispatch, queryFulfilled }) => {
            // Clear auth state and ALL cached API data so the next user
            // never sees a previous user's notes/profile from the RTK Query cache.
            dispatch(logoutAction());
            dispatch(profileApi.util.resetApiState());
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
   useRegisterMutation,
   useLogoutMutation,
   useLogoutAllMutation,
   useForgotPasswordMutation,
   useResetPasswordMutation,
} = authApi;
