import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth, registerCacheReset } from "@/services/baseQuery";
import { updateUser } from "@/features/auth/slices/authSlice";
import type { ApiResponse } from "@/types/api.types";
import type { ProfileResponse } from "../types/profile.types";

// Self-service is password-change only (locked product decision) — this slice
// exposes GET /profile ONLY, for the one screen (AccountPage) that reads it.
// PATCH/DELETE /profile exist on the backend but are never wired to any UI.
export const profileApi = createApi({
   reducerPath: "profileApi",
   baseQuery: baseQueryWithReauth,
   tagTypes: ["Profile"],
   endpoints: (build) => ({
      getProfile: build.query<ProfileResponse, void>({
         query: () => "/profile",
         transformResponse: (response: ApiResponse<ProfileResponse>) =>
            response.data,
         providesTags: ["Profile"],
         onQueryStarted: async (_, { dispatch, queryFulfilled }) => {
            try {
               const { data } = await queryFulfilled;
               // Sync the fields /auth/refresh can't provide into the auth
               // slice so the rest of the app (Topbar, guards) sees a fully
               // populated AuthUser shortly after a page reload.
               dispatch(
                  updateUser({
                     email: data.email,
                     photoUrl: data.photoUrl,
                     authProvider: data.authProvider,
                     createdAt: data.createdAt,
                     updatedAt: data.updatedAt,
                  }),
               );
            } catch {
               // ignore
            }
         },
      }),
   }),
});

export const { useGetProfileQuery } = profileApi;

// Register this API's cache-reset callback with baseQuery so the 401-forced-logout
// path can wipe stale data without creating a circular import.
registerCacheReset((dispatch) => dispatch(profileApi.util.resetApiState()));
