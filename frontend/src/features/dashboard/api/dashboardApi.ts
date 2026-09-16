import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "@/services/baseQuery";
import type { ApiResponse } from "@/types/api.types";
import type { AdminDashboardDto } from "../types/dashboard.types";
import { registerCacheReset } from "@/services/baseQuery";

export const dashboardApi = createApi({
    reducerPath: "dashboardApi",
    baseQuery: baseQueryWithReauth,
    tagTypes: ["AdminDashboard"],
    endpoints: (builder) => ({
        getAdminDashboard: builder.query<AdminDashboardDto, { academicYearId?: string }>({
            query: (params) => ({
                url: "/dashboard/admin",
                params,
            }),
            transformResponse: (response: ApiResponse<AdminDashboardDto>) => response.data,
            providesTags: ["AdminDashboard"],
        }),
    }),
});

export const { useGetAdminDashboardQuery } = dashboardApi;

registerCacheReset((dispatch) => {
    dispatch(dashboardApi.util.resetApiState());
});
