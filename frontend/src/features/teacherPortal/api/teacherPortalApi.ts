import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth, registerCacheReset } from "@/services/baseQuery";
import type { ApiResponse, PaginatedResponse } from "@/types/api.types";
import type {
    TeacherDashboardDTO,
    TeacherProfileDTO,
    TeacherClassesDTO,
    TeacherStudentListItemDTO,
    MarkDTO,
    BulkMarksPayload,
    MarkSheetDTO
} from "../types/teacherPortal.types";

export const teacherPortalApi = createApi({
    reducerPath: "teacherPortalApi",
    baseQuery: baseQueryWithReauth,
    tagTypes: ["TeacherDashboard", "TeacherProfile", "TeacherClasses", "TeacherStudents", "TeacherMarks", "TeacherMarksheets"],
    endpoints: (builder) => ({
        getTeacherDashboard: builder.query<TeacherDashboardDTO, void>({
            query: () => "/dashboard/teacher",
            transformResponse: (response: ApiResponse<TeacherDashboardDTO>) => response.data,
            providesTags: ["TeacherDashboard"],
        }),
        getTeacherProfile: builder.query<TeacherProfileDTO, void>({
            query: () => "/teacher/me",
            transformResponse: (response: ApiResponse<TeacherProfileDTO>) => response.data,
            providesTags: ["TeacherProfile"],
        }),
        getTeacherClasses: builder.query<TeacherClassesDTO, void>({
            query: () => "/teacher/classes",
            transformResponse: (response: ApiResponse<TeacherClassesDTO>) => response.data,
            providesTags: ["TeacherClasses"],
        }),
        getTeacherStudents: builder.query<
            { items: TeacherStudentListItemDTO[]; meta: PaginatedResponse<TeacherStudentListItemDTO>["meta"] },
            { page?: number; limit?: number; classId?: string }
        >({
            query: (params) => ({
                url: "/teacher/students",
                params,
            }),
            transformResponse: (response: PaginatedResponse<TeacherStudentListItemDTO[]>) => ({
                items: response.data,
                meta: response.meta,
            }),
            providesTags: ["TeacherStudents"],
        }),
        getTeacherMarks: builder.query<
            { items: MarkDTO[]; meta: PaginatedResponse<MarkDTO>["meta"] },
            { page?: number; limit?: number; classId?: string; subjectId?: string; examId?: string; termId?: string; studentId?: string }
        >({
            query: (params) => ({
                url: "/teacher/marks",
                params,
            }),
            transformResponse: (response: PaginatedResponse<MarkDTO[]>) => ({
                items: response.data,
                meta: response.meta,
            }),
            providesTags: ["TeacherMarks"],
        }),
        bulkUpdateMarks: builder.mutation<
            { success: boolean; message: string; data: MarkSheetDTO },
            BulkMarksPayload
        >({
            query: (body) => ({
                url: "/teacher/marks/bulk",
                method: "POST",
                body,
            }),
            invalidatesTags: ["TeacherMarks", "TeacherMarksheets"],
            async onQueryStarted(_, { dispatch, queryFulfilled }) {
                try {
                    await queryFulfilled;
                    dispatch(teacherPortalApi.util.invalidateTags(["TeacherDashboard"]));
                } catch {
                    // Do nothing
                }
            }
        }),
        getTeacherMarksheets: builder.query<
            { items: MarkSheetDTO[]; meta: PaginatedResponse<MarkSheetDTO>["meta"] },
            { page?: number; limit?: number }
        >({
            query: (params) => ({
                url: "/marksheets",
                params,
            }),
            transformResponse: (response: PaginatedResponse<MarkSheetDTO[]>) => ({
                items: response.data,
                meta: response.meta,
            }),
            providesTags: ["TeacherMarksheets"],
        }),
        getTeacherMarksheetDetail: builder.query<MarkSheetDTO, string>({
            query: (id) => `/marksheets/${id}`,
            transformResponse: (response: ApiResponse<MarkSheetDTO>) => response.data,
            providesTags: (_result, _error, id) => [{ type: "TeacherMarksheets", id }],
        }),
        submitMarksheet: builder.mutation<MarkSheetDTO, string>({
            query: (id) => ({
                url: `/marksheets/${id}/submit`,
                method: "POST",
            }),
            transformResponse: (response: ApiResponse<MarkSheetDTO>) => response.data,
            invalidatesTags: (_result, _error, id) => [
                { type: "TeacherMarksheets", id },
                "TeacherMarksheets",
                "TeacherMarks"
            ],
        }),
    }),
});

export const {
    useGetTeacherDashboardQuery,
    useGetTeacherProfileQuery,
    useGetTeacherClassesQuery,
    useGetTeacherStudentsQuery,
    useGetTeacherMarksQuery,
    useBulkUpdateMarksMutation,
    useGetTeacherMarksheetsQuery,
    useGetTeacherMarksheetDetailQuery,
    useSubmitMarksheetMutation
} = teacherPortalApi;

// Register cache reset
registerCacheReset((dispatch) => dispatch(teacherPortalApi.util.resetApiState()));
