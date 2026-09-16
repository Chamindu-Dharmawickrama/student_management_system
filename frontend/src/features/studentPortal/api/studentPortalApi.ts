import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "@/services/baseQuery";
import type { ApiResponse, PaginatedResponse } from "@/types/api.types";
import type {
    StudentMeDto,
    StudentDashboardDto,
    MarkDto,
} from "../types/studentPortal.types";
import type { StudentTermReportDto } from "@/features/reports/types/reports.types";

interface GetStudentMarksParams {
    page?: number;
    limit?: number;
    subjectId?: string;
    academicYearId?: string;
    examId?: string;
    termId?: string;
}

export const studentPortalApi = createApi({
    reducerPath: "studentPortalApi",
    baseQuery: baseQueryWithReauth,
    tagTypes: ["StudentMe", "StudentDashboard", "StudentMarks", "StudentReport"],
    endpoints: (builder) => ({
        getStudentMe: builder.query<StudentMeDto, void>({
            query: () => "/student/me",
            transformResponse: (response: ApiResponse<StudentMeDto>) => response.data,
            providesTags: ["StudentMe"],
        }),
        getStudentDashboard: builder.query<StudentDashboardDto, void>({
            query: () => "/dashboard/student",
            transformResponse: (response: ApiResponse<StudentDashboardDto>) => response.data,
            providesTags: ["StudentDashboard"],
        }),
        getStudentMarks: builder.query<PaginatedResponse<MarkDto[]>, GetStudentMarksParams>({
            query: (params) => ({
                url: "/student/me/marks",
                params,
            }),
            transformResponse: (response: ApiResponse<PaginatedResponse<MarkDto[]>>) => response.data,
            providesTags: ["StudentMarks"],
        }),
        getStudentReport: builder.query<StudentTermReportDto, { studentId: string; termId: string }>({
            query: ({ studentId, termId }) => `/reports/student/${studentId}/term/${termId}?format=json`,
            transformResponse: (response: ApiResponse<StudentTermReportDto>) => response.data,
            providesTags: ["StudentReport"],
        }),
    }),
});

export const {
    useGetStudentMeQuery,
    useGetStudentDashboardQuery,
    useGetStudentMarksQuery,
    useGetStudentReportQuery,
    useLazyGetStudentReportQuery,
} = studentPortalApi;

import { registerCacheReset } from "@/services/baseQuery";
registerCacheReset((dispatch) => {
    dispatch(studentPortalApi.util.resetApiState());
});
