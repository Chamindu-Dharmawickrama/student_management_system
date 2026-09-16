import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth, registerCacheReset } from "@/services/baseQuery";
import type { ApiResponse } from "@/types/api.types";
import type { StudentTermReportDto, ClassReportDto } from "../types/reports.types";

export const reportsApi = createApi({
    reducerPath: "reportsApi",
    baseQuery: baseQueryWithReauth,
    tagTypes: ["Report"],
    endpoints: (builder) => ({
        getStudentTermReport: builder.query<StudentTermReportDto, { studentId: string; termId: string }>({
            query: ({ studentId, termId }) => ({
                url: `/reports/student/${studentId}/term/${termId}`,
                params: { format: "json" }
            }),
            transformResponse: (response: ApiResponse<StudentTermReportDto>) => response.data,
            providesTags: ["Report"],
        }),
        getClassExamReport: builder.query<ClassReportDto, { classId: string; examId: string }>({
            query: ({ classId, examId }) => ({
                url: `/reports/class/${classId}/exam/${examId}`,
                params: { format: "json" }
            }),
            transformResponse: (response: ApiResponse<ClassReportDto>) => response.data,
            providesTags: ["Report"],
        }),
    }),
});

export const {
    useGetStudentTermReportQuery,
    useGetClassExamReportQuery,
    useLazyGetStudentTermReportQuery,
    useLazyGetClassExamReportQuery,
} = reportsApi;

registerCacheReset((dispatch) => {
    dispatch(reportsApi.util.resetApiState());
});
