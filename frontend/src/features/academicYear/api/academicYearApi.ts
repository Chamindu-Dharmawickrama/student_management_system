import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth, registerCacheReset } from "@/services/baseQuery";
import type { ApiResponse } from "@/types/api.types";
import type { AcademicYearListItem } from "../types/academicYear.types";

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
   }),
});

export const { useGetAcademicYearsQuery } = academicYearApi;

registerCacheReset((dispatch) =>
   dispatch(academicYearApi.util.resetApiState()),
);
