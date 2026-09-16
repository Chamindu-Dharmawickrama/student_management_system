import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth, registerCacheReset } from "@/services/baseQuery";
import type { ApiResponse, PaginatedResponse } from "@/types/api.types";
import type { MarkSheetDto } from "../types/markSheets.types";

export const markSheetsApi = createApi({
    reducerPath: "markSheetsApi",
    baseQuery: baseQueryWithReauth,
    tagTypes: ["MarkSheets", "MarkSheetDetail", "AdminDashboard"],
    endpoints: (builder) => ({
        getMarkSheets: builder.query<
            { items: MarkSheetDto[]; meta: PaginatedResponse<MarkSheetDto>["meta"] },
            { page?: number; limit?: number; examId?: string; termId?: string; classId?: string; subjectId?: string; status?: string; academicYearId?: string }
        >({
            query: (params) => ({
                url: "/marksheets",
                params,
            }),
            transformResponse: (response: PaginatedResponse<MarkSheetDto[]>) => ({
                items: response.data,
                meta: response.meta,
            }),
            providesTags: ["MarkSheets"],
        }),
        getMarkSheetDetail: builder.query<MarkSheetDto, string>({
            query: (id) => `/marksheets/${id}`,
            transformResponse: (response: ApiResponse<MarkSheetDto>) => response.data,
            providesTags: (_result, _error, id) => [{ type: "MarkSheetDetail", id }],
        }),
        approveMarkSheet: builder.mutation<MarkSheetDto, string>({
            query: (id) => ({
                url: `/marksheets/${id}/approve`,
                method: "POST",
            }),
            transformResponse: (response: ApiResponse<MarkSheetDto>) => response.data,
            invalidatesTags: (_result, _error, id) => [
                { type: "MarkSheetDetail", id },
                "MarkSheets",
                "AdminDashboard"
            ],
        }),
        rejectMarkSheet: builder.mutation<MarkSheetDto, { id: string; reason: string }>({
            query: ({ id, reason }) => ({
                url: `/marksheets/${id}/reject`,
                method: "POST",
                body: { reason },
            }),
            transformResponse: (response: ApiResponse<MarkSheetDto>) => response.data,
            invalidatesTags: (_result, _error, { id }) => [
                { type: "MarkSheetDetail", id },
                "MarkSheets",
                "AdminDashboard"
            ],
        }),
        lockMarkSheet: builder.mutation<MarkSheetDto, string>({
            query: (id) => ({
                url: `/marksheets/${id}/lock`,
                method: "POST",
            }),
            transformResponse: (response: ApiResponse<MarkSheetDto>) => response.data,
            invalidatesTags: (_result, _error, id) => [
                { type: "MarkSheetDetail", id },
                "MarkSheets",
                "AdminDashboard"
            ],
        }),
    }),
});

export const {
    useGetMarkSheetsQuery,
    useGetMarkSheetDetailQuery,
    useApproveMarkSheetMutation,
    useRejectMarkSheetMutation,
    useLockMarkSheetMutation,
} = markSheetsApi;

registerCacheReset((dispatch) => {
    dispatch(markSheetsApi.util.resetApiState());
});
