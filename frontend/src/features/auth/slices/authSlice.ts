import {
   createAsyncThunk,
   createSlice,
   type PayloadAction,
} from "@reduxjs/toolkit";
import type { ThunkDispatch, UnknownAction } from "@reduxjs/toolkit";
import type { BaseQueryApi } from "@reduxjs/toolkit/query";
import type { AuthState, AuthUser } from "../types/auth.types";
import { tokenService } from "@/services/tokenService";
import type { RootState } from "@/app/store";
import { decodeJwtPayload } from "@/shared/utils/jwtUtils";
import { rawBaseQuery } from "@/services/baseQuery";

let _sessionRestoreInFlight = false;

// rawBaseQuery expects a full BaseQueryApi even when called manually outside
// an actual RTK Query endpoint — this thunk isn't one, so build a minimal but
// correctly-typed stand-in instead of casting through `any`.
function toBaseQueryApi(
   dispatch: ThunkDispatch<unknown, unknown, UnknownAction>,
   getState: () => unknown,
): BaseQueryApi {
   return {
      dispatch,
      getState,
      extra: undefined,
      endpoint: "restoreSession",
      type: "query",
      signal: new AbortController().signal,
      abort: () => {},
   };
}

// get new access token using refresh token and restore the session
// this is used to restore the session when the user refreshes the page or opens the app for the first time
export const restoreSession = createAsyncThunk(
   "auth/restoreSession",
   async (_, { dispatch, getState, rejectWithValue }) => {
      // prevent double calls
      if (_sessionRestoreInFlight) {
         return rejectWithValue("Session restore already in progress");
      }

      _sessionRestoreInFlight = true;

      try {
         const api = toBaseQueryApi(dispatch, getState);
         const result = await rawBaseQuery(
            { url: "/auth/refresh", method: "POST" },
            api,
            {}
         );

         if (result.error) {
            // refresh failed -> logout locally
            dispatch(logout());
            // Logout from backend to ensure HTTP-only cookies (like refresh token) are cleared
            await rawBaseQuery(
               { url: "/auth/logout", method: "POST" },
               api,
               {}
            );
            return rejectWithValue("No valid session");
         }

         const payload = result.data as { data: { accessToken: string } };
         return payload.data.accessToken;
      } catch {
         return rejectWithValue("Network error during session restore");
      } finally {
         _sessionRestoreInFlight = false;
      }
   },
);

const initialState: AuthState = {
   user: null,
   isInitialized: false,
};

const authSlice = createSlice({
   name: "auth",
   initialState,
   reducers: {
      // store the access token and update the user state
      setCredentials(
         state,
         action: PayloadAction<{ user: AuthUser; accessToken: string }>,
      ) {
         state.user = action.payload.user;
         tokenService.setToken(action.payload.accessToken);
      },

      logout(state) {
         state.user = null;
         tokenService.clearToken();
      },

      updateUser(state, action: PayloadAction<Partial<AuthUser>>) {
         if (state.user) {
            state.user = { ...state.user, ...action.payload };
         }
      },
   },
   extraReducers: (builder) => {
      // Session restore succeeded — populate user from decoded JWT. The
      // refresh endpoint only returns an accessToken (no user object), so
      // email/photoUrl/authProvider/createdAt/updatedAt are left undefined
      // here; Topbar's GET /profile fetch fills them in moments later via
      // the `updateUser` reducer below.
      builder.addCase(restoreSession.fulfilled, (state, action) => {
         const accessToken = action.payload;
         tokenService.setToken(accessToken);
         const decoded = decodeJwtPayload(accessToken);
         if (decoded) {
            state.user = {
               id: decoded.sub,
               username: decoded.username,
               role: decoded.role,
               mustChangePassword: decoded.mustChangePassword,
            };
         }
         // Always mark initialized — even if decode somehow fails — so ProtectedRoute
         // never hangs on the spinner indefinitely.
         state.isInitialized = true;
      });

      // Session restore failed — mark initialized so the app doesn't hang on the splash screen
      builder.addCase(restoreSession.rejected, (state) => {
         state.user = null;
         state.isInitialized = true;
      });
   },
});

export const { setCredentials, logout, updateUser } = authSlice.actions;

// Selectors
export const selectUser = (state: RootState) => state.auth.user;
export const selectIsInitialized = (state: RootState) =>
   state.auth.isInitialized;
export const selectIsAuthenticated = (state: RootState) => !!state.auth.user;
export const selectIsAdmin = (state: RootState) =>
   state.auth.user?.role === "SCHOOL_ADMIN";
export const selectIsTeacher = (state: RootState) =>
   state.auth.user?.role === "TEACHER";
export const selectIsStudent = (state: RootState) =>
   state.auth.user?.role === "STUDENT";
export const selectMustChangePassword = (state: RootState) =>
   state.auth.user?.mustChangePassword ?? false;

export default authSlice.reducer;
