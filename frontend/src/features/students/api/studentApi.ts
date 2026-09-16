import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth, registerCacheReset } from "@/services/baseQuery";
import type { ApiResponse, PaginatedResponse } from "@/types/api.types";
import type {
  StudentListItemDTO,
  StudentDetailDTO,
  StudentCreateDTO,
  StudentUpdateDTO,
  StudentSubjectSelectionsUpdateDTO,
  StudentListFilters,
  StudentSubject,
} from "../types/student.types";

export const studentApi = createApi({
  reducerPath: "studentApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Student", "StudentSubjects"],
  endpoints: (builder) => ({
    getStudents: builder.query<PaginatedResponse<StudentListItemDTO[]>, StudentListFilters>({
      query: (params) => ({
        url: "/students",
        params,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: "Student" as const, id })),
              { type: "Student", id: "PARTIAL-LIST" },
            ]
          : [{ type: "Student", id: "PARTIAL-LIST" }],
    }),
    getStudentById: builder.query<ApiResponse<StudentDetailDTO>, string>({
      query: (id) => `/students/${id}`,
      providesTags: (_r, _e, id) => [{ type: "Student", id }],
    }),
    createStudent: builder.mutation<ApiResponse<StudentDetailDTO>, StudentCreateDTO>({
      query: (body) => ({
        url: "/students",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Student", id: "PARTIAL-LIST" }],
    }),
    updateStudent: builder.mutation<
      ApiResponse<StudentDetailDTO>,
      { id: string; data: StudentUpdateDTO }
    >({
      query: ({ id, data }) => ({
        url: `/students/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: "Student", id },
        { type: "Student", id: "PARTIAL-LIST" },
      ],
    }),
    deleteStudent: builder.mutation<ApiResponse<null>, string>({
      query: (id) => ({
        url: `/students/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (_r, _e, id) => [
        { type: "Student", id },
        { type: "Student", id: "PARTIAL-LIST" },
      ],
    }),
    getStudentSubjectSelections: builder.query<
      ApiResponse<StudentSubject[]>,
      { id: string; academicYearId: string }
    >({
      query: ({ id, academicYearId }) => ({
        url: `/students/${id}/subject-selections`,
        params: { academicYearId },
      }),
      providesTags: (_r, _e, { id }) => [{ type: "StudentSubjects", id }],
    }),
    updateStudentSubjectSelections: builder.mutation<
      ApiResponse<StudentSubject[]>,
      { id: string; data: StudentSubjectSelectionsUpdateDTO }
    >({
      query: ({ id, data }) => ({
        url: `/students/${id}/subject-selections`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: "StudentSubjects", id },
        { type: "Student", id },
      ],
    }),
  }),
});

export const {
  useGetStudentsQuery,
  useGetStudentByIdQuery,
  useCreateStudentMutation,
  useUpdateStudentMutation,
  useDeleteStudentMutation,
  useGetStudentSubjectSelectionsQuery,
  useUpdateStudentSubjectSelectionsMutation,
} = studentApi;

registerCacheReset((dispatch) => {
  dispatch(studentApi.util.resetApiState());
});

