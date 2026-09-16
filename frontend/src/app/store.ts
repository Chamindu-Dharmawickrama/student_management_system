import { configureStore } from "@reduxjs/toolkit";
import authReducer from "@/features/auth/slices/authSlice";
import academicYearReducer from "@/features/academicYear/slices/academicYearSlice";
import { authApi } from "@/features/auth/api/authApi";
import { profileApi } from "@/features/profile/api/profileApi";
import { academicYearApi } from "@/features/academicYear/api/academicYearApi";

export const store = configureStore({
   reducer: {
      auth: authReducer,
      academicYear: academicYearReducer,
      [authApi.reducerPath]: authApi.reducer,
      [profileApi.reducerPath]: profileApi.reducer,
      [academicYearApi.reducerPath]: academicYearApi.reducer,
   },
   middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(
         authApi.middleware,
         profileApi.middleware,
         academicYearApi.middleware,
      ),
});
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
