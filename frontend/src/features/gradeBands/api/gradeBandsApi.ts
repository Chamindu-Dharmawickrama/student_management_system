import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth, registerCacheReset } from "@/services/baseQuery";
import type { ApiResponse } from "@/types/api.types";
import type { GradeBand } from "../types/gradeBands.types";
import type { PaginatedResponse } from "@/types/api.types";

export const gradeBandsApi = createApi({
  reducerPath: "gradeBandsApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["GradeBand"],
  endpoints: (build) => ({
    getGradeBands: build.query<
      PaginatedResponse<GradeBand[]>,
      { page: number; limit: number }
    >({
      query: (params) => ({
        url: "/grade-bands",
        params,
      }),
      transformResponse: (response: ApiResponse<GradeBand[]>) => ({
        data: response.data || [],
        meta: response.meta || { page: 1, limit: 10, total: 0, totalPages: 0 },
        success: response.success,
        message: response.message,
      }),
      providesTags: ["GradeBand"],
    }),
    createGradeBand: build.mutation<
      GradeBand,
      { grade: string; minMark: number; maxMark: number; gradePoint?: number; isPassing?: boolean; description?: string }
    >({
      query: (body) => ({
        url: "/grade-bands",
        method: "POST",
        body,
      }),
      invalidatesTags: ["GradeBand"],
    }),
    updateGradeBand: build.mutation<
      GradeBand,
      { id: string; body: { grade?: string; minMark?: number; maxMark?: number; gradePoint?: number; isPassing?: boolean; description?: string } }
    >({
      query: ({ id, body }) => ({
        url: `/grade-bands/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["GradeBand"],
    }),
    deleteGradeBand: build.mutation<
      { success: boolean; message: string },
      string
    >({
      query: (id) => ({
        url: `/grade-bands/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["GradeBand"],
    }),
  }),
});

export const {
  useGetGradeBandsQuery,
  useCreateGradeBandMutation,
  useUpdateGradeBandMutation,
  useDeleteGradeBandMutation,
} = gradeBandsApi;

registerCacheReset((dispatch) => dispatch(gradeBandsApi.util.resetApiState()));
