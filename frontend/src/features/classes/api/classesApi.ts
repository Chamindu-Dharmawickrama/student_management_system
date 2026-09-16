import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth, registerCacheReset } from "@/services/baseQuery";
import type { ApiResponse, PaginatedResponse } from "@/types/api.types";
import type { Class, ClassDetailDTO } from "../types/classes.types";

export const classesApi = createApi({
  reducerPath: "classesApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Class"],
  endpoints: (build) => ({
    getClasses: build.query<
      PaginatedResponse<Class[]>,
      { page: number; limit: number; q?: string; academicYearId?: string; gradeLevel?: number; status?: "active" | "inactive" | "all" }
    >({
      query: (params) => ({
        url: "/classes",
        params,
      }),
      transformResponse: (response: ApiResponse<Class[]>) => ({
        data: response.data || [],
        meta: response.meta || { page: 1, limit: 10, total: 0, totalPages: 0 },
        success: response.success,
        message: response.message,
      }),
      providesTags: ["Class"],
    }),
    getClassById: build.query<ClassDetailDTO, string>({
      query: (id) => `/classes/${id}`,
      transformResponse: (response: ApiResponse<ClassDetailDTO>) => response.data!,
      providesTags: (_result, _error, id) => [{ type: "Class", id }],
    }),
    createClass: build.mutation<
      Class,
      { name: string; gradeLevel: number; academicYearId: string; isActive?: boolean }
    >({
      query: (body) => ({
        url: "/classes",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Class"],
    }),
    updateClass: build.mutation<
      Class,
      { id: string; body: { name?: string; gradeLevel?: number; academicYearId?: string; isActive?: boolean } }
    >({
      query: ({ id, body }) => ({
        url: `/classes/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        "Class",
        { type: "Class", id },
      ],
    }),
  }),
});

export const {
  useGetClassesQuery,
  useGetClassByIdQuery,
  useCreateClassMutation,
  useUpdateClassMutation,
} = classesApi;

registerCacheReset((dispatch) => dispatch(classesApi.util.resetApiState()));
