import { configureStore } from "@reduxjs/toolkit";
import authReducer from "@/features/auth/slices/authSlice";
import academicYearReducer from "@/features/academicYear/slices/academicYearSlice";
import { authApi } from "@/features/auth/api/authApi";
import { profileApi } from "@/features/profile/api/profileApi";
import { academicYearApi } from "@/features/academicYear/api/academicYearApi";
import { subjectsApi } from "@/features/subjects/api/subjectsApi";
import { classesApi } from "@/features/classes/api/classesApi";
import { gradeBandsApi } from "@/features/gradeBands/api/gradeBandsApi";
import { studentApi } from "@/features/students/api/studentApi";
import { teacherApi } from "@/features/teachers/api/teacherApi";
import { studentPortalApi } from "@/features/studentPortal/api/studentPortalApi";
import { teacherPortalApi } from "@/features/teacherPortal/api/teacherPortalApi";
import { dashboardApi } from "@/features/dashboard/api/dashboardApi";
import { markSheetsApi } from "@/features/markSheets/api/markSheetsApi";
import { reportsApi } from "@/features/reports/api/reportsApi";

export const store = configureStore({
   reducer: {
      auth: authReducer,
      academicYear: academicYearReducer,
      [authApi.reducerPath]: authApi.reducer,
      [profileApi.reducerPath]: profileApi.reducer,
      [academicYearApi.reducerPath]: academicYearApi.reducer,
      [subjectsApi.reducerPath]: subjectsApi.reducer,
      [classesApi.reducerPath]: classesApi.reducer,
      [gradeBandsApi.reducerPath]: gradeBandsApi.reducer,
      [studentApi.reducerPath]: studentApi.reducer,
      [teacherApi.reducerPath]: teacherApi.reducer,
      [studentPortalApi.reducerPath]: studentPortalApi.reducer,
      [teacherPortalApi.reducerPath]: teacherPortalApi.reducer,
      [dashboardApi.reducerPath]: dashboardApi.reducer,
      [markSheetsApi.reducerPath]: markSheetsApi.reducer,
      [reportsApi.reducerPath]: reportsApi.reducer,
   },
   middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(
         authApi.middleware,
         profileApi.middleware,
         academicYearApi.middleware,
         subjectsApi.middleware,
         classesApi.middleware,
         gradeBandsApi.middleware,
         studentApi.middleware,
         teacherApi.middleware,
         studentPortalApi.middleware,
         teacherPortalApi.middleware,
         dashboardApi.middleware,
         markSheetsApi.middleware,
         reportsApi.middleware
      ),
});
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
