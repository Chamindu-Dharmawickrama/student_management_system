import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth, registerCacheReset } from "@/services/baseQuery";
import type { ApiResponse, PaginatedResponse } from "@/types/api.types";
import type { Subject, SubjectDetailDTO } from "../types/subjects.types";

export const subjectsApi = createApi({
  reducerPath: "subjectsApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Subject"],
  endpoints: (build) => ({
    getSubjects: build.query<
      PaginatedResponse<Subject[]>,
      { page: number; limit: number; q?: string; status?: "active" | "inactive" | "all" }
    >({
      query: (params) => ({
        url: "/subjects",
        params,
      }),
      transformResponse: (response: ApiResponse<Subject[]>) => ({
        data: response.data,
        meta: response.meta!,
        success: response.success,
        message: response.message,
      }),
      providesTags: ["Subject"],
    }),
    getSubjectById: build.query<SubjectDetailDTO, string>({
      query: (id) => `/subjects/${id}`,
      transformResponse: (response: ApiResponse<SubjectDetailDTO>) => response.data!,
      providesTags: (_result, _error, id) => [{ type: "Subject", id }],
    }),
    createSubject: build.mutation<
      Subject,
      { name: string; code?: string; isActive?: boolean }
    >({
      query: (body) => ({
        url: "/subjects",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Subject"],
    }),
    updateSubject: build.mutation<
      Subject,
      { id: string; body: { name?: string; code?: string; isActive?: boolean } }
    >({
      query: ({ id, body }) => ({
        url: `/subjects/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        "Subject",
        { type: "Subject", id },
      ],
    }),
    deleteSubject: build.mutation<
      { success: boolean; message: string; data?: { deactivated: boolean } },
      string
    >({
      query: (id) => ({
        url: `/subjects/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Subject"],
    }),
  }),
});

export const {
  useGetSubjectsQuery,
  useGetSubjectByIdQuery,
  useCreateSubjectMutation,
  useUpdateSubjectMutation,
  useDeleteSubjectMutation,
} = subjectsApi;

registerCacheReset((dispatch) => dispatch(subjectsApi.util.resetApiState()));
