import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth, registerCacheReset } from "@/services/baseQuery";
import type { ApiResponse } from "@/types/api.types";
import type {
  AcademicYearListItem,
  AcademicYearDetail,
  ExamDetailDTO,
} from "../types/academicYear.types";

export interface PaginatedResponse<T> {
  data: T;
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// SCHOOL_ADMIN only. Used here just to drive the global YearSwitcher — a
// dropdown of years never needs real pagination, so we fetch a generous
// single page instead of building out paging for a combobox. Prompt 04's
// full admin Academic Years CRUD screen can add paginated/mutating endpoints
// to this same slice later.
export const academicYearApi = createApi({
   reducerPath: "academicYearApi",
   baseQuery: baseQueryWithReauth,
   tagTypes: ["AcademicYear"],
   endpoints: (build) => ({
      getAcademicYears: build.query<AcademicYearListItem[], void>({
         query: () => "/academic-years?status=all&limit=100",
         transformResponse: (
            response: ApiResponse<AcademicYearListItem[]>,
         ) => response.data,
         providesTags: ["AcademicYear"],
      }),
      getAcademicYearsPaginated: build.query<
         PaginatedResponse<AcademicYearListItem[]>,
         { page: number; limit: number; status: "all" | "current" }
      >({
         query: (params) => ({
            url: "/academic-years",
            params,
         }),
         transformResponse: (response: ApiResponse<AcademicYearListItem[]>) => ({
            data: response.data || [],
            meta: response.meta || { page: 1, limit: 10, total: 0, totalPages: 0 },
         }),
         providesTags: ["AcademicYear"],
      }),
      getAcademicYearById: build.query<AcademicYearDetail, string>({
         query: (id) => `/academic-years/${id}`,
         transformResponse: (response: ApiResponse<AcademicYearDetail>) =>
            response.data!,
         providesTags: (_result, _error, id) => [{ type: "AcademicYear", id }],
      }),
      createAcademicYear: build.mutation<
         AcademicYearDetail,
         { name: string; startDate: string; endDate: string; isCurrent?: boolean }
      >({
         query: (body) => ({
            url: "/academic-years",
            method: "POST",
            body,
         }),
         invalidatesTags: ["AcademicYear"],
      }),
      updateTerm: build.mutation<
         void,
         {
            academicYearId: string;
            termId: string;
            body: { name?: string; startDate?: string; endDate?: string };
         }
      >({
         query: ({ academicYearId, termId, body }) => ({
            url: `/academic-years/${academicYearId}/terms/${termId}`,
            method: "PATCH",
            body,
         }),
         invalidatesTags: (_result, _error, { academicYearId }) => [
            { type: "AcademicYear", id: academicYearId },
         ],
      }),
      getExamById: build.query<ExamDetailDTO, string>({
         query: (id) => `/exams/${id}`,
         transformResponse: (response: ApiResponse<ExamDetailDTO>) =>
            response.data!,
         providesTags: (_result, _error, id) => [{ type: "AcademicYear", id }], // Tie to AcademicYear tag for simplicity
      }),
      updateExam: build.mutation<
         void,
         { id: string; body: { startDate: string; endDate: string } }
      >({
         query: ({ id, body }) => ({
            url: `/exams/${id}`,
            method: "PATCH",
            body,
         }),
         // Invalidate the year so the term timeline updates, and the exam detail itself
         invalidatesTags: (_result, _error, { id }) => [
            "AcademicYear",
            { type: "AcademicYear", id },
         ],
      }),
      generateMarksheets: build.mutation<
         { success: boolean; message: string },
         string
      >({
         query: (id) => ({
            url: `/exams/${id}/generate-marksheets`,
            method: "POST",
         }),
         invalidatesTags: (_result, _error, id) => [
            { type: "AcademicYear", id },
         ],
      }),
   }),
});

export const {
   useGetAcademicYearsQuery,
   useGetAcademicYearsPaginatedQuery,
   useGetAcademicYearByIdQuery,
   useCreateAcademicYearMutation,
   useUpdateTermMutation,
   useGetExamByIdQuery,
   useUpdateExamMutation,
   useGenerateMarksheetsMutation,
} = academicYearApi;

registerCacheReset((dispatch) =>
   dispatch(academicYearApi.util.resetApiState()),
);
