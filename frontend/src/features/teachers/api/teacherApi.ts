import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth, registerCacheReset } from "@/services/baseQuery";
import type { ApiResponse, PaginatedResponse } from "@/types/api.types";
import type {
  TeacherListItemDTO,
  TeacherDetailDTO,
  TeacherCreateDTO,
  TeacherUpdateDTO,
  TeacherListFilters,
} from "../types/teacher.types";

export const teacherApi = createApi({
  reducerPath: "teacherApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Teacher"],
  endpoints: (builder) => ({
    getTeachers: builder.query<PaginatedResponse<TeacherListItemDTO[]>, TeacherListFilters>({
      query: (params) => ({
        url: "/teachers",
        params,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: "Teacher" as const, id })),
              { type: "Teacher", id: "PARTIAL-LIST" },
            ]
          : [{ type: "Teacher", id: "PARTIAL-LIST" }],
    }),
    getTeacherById: builder.query<ApiResponse<TeacherDetailDTO>, string>({
      query: (id) => `/teachers/${id}`,
      providesTags: (_r, _e, id) => [{ type: "Teacher", id }],
    }),
    createTeacher: builder.mutation<ApiResponse<TeacherDetailDTO>, TeacherCreateDTO>({
      query: (body) => ({
        url: "/teachers",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Teacher", id: "PARTIAL-LIST" }],
    }),
    updateTeacher: builder.mutation<
      ApiResponse<TeacherDetailDTO>,
      { id: string; data: TeacherUpdateDTO }
    >({
      query: ({ id, data }) => ({
        url: `/teachers/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: "Teacher", id },
        { type: "Teacher", id: "PARTIAL-LIST" },
      ],
    }),
    deleteTeacher: builder.mutation<ApiResponse<null>, string>({
      query: (id) => ({
        url: `/teachers/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (_r, _e, id) => [
        { type: "Teacher", id },
        { type: "Teacher", id: "PARTIAL-LIST" },
      ],
    }),
  }),
});

export const {
  useGetTeachersQuery,
  useGetTeacherByIdQuery,
  useCreateTeacherMutation,
  useUpdateTeacherMutation,
  useDeleteTeacherMutation,
} = teacherApi;

registerCacheReset((dispatch) => {
  dispatch(teacherApi.util.resetApiState());
});

