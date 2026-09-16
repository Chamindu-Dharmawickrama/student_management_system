import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "@/app/store";
import { registerCacheReset } from "@/services/baseQuery";

const STORAGE_KEY = "sms.selectedAcademicYearId";

// UI preference, not a credential — localStorage is appropriate here (per
// §4.4 of the master context), unlike the access token.
function readPersistedYearId(): string | null {
   try {
      return localStorage.getItem(STORAGE_KEY);
   } catch {
      return null;
   }
}

interface AcademicYearState {
   selectedAcademicYearId: string | null;
}

const initialState: AcademicYearState = {
   selectedAcademicYearId: readPersistedYearId(),
};

const academicYearSlice = createSlice({
   name: "academicYear",
   initialState,
   reducers: {
      setSelectedAcademicYearId(state, action: PayloadAction<string | null>) {
         state.selectedAcademicYearId = action.payload;
         try {
            if (action.payload) {
               localStorage.setItem(STORAGE_KEY, action.payload);
            } else {
               localStorage.removeItem(STORAGE_KEY);
            }
         } catch {
            // ignore storage errors (e.g. private browsing)
         }
      },
      clearSelectedAcademicYear(state) {
         state.selectedAcademicYearId = null;
         try {
            localStorage.removeItem(STORAGE_KEY);
         } catch {
            // ignore
         }
      },
   },
});

export const { setSelectedAcademicYearId, clearSelectedAcademicYear } =
   academicYearSlice.actions;

export const selectSelectedAcademicYearId = (state: RootState) =>
   state.academicYear.selectedAcademicYearId;

export default academicYearSlice.reducer;

// Clear the selection on logout, same registry used by every API cache.
registerCacheReset((dispatch) => dispatch(clearSelectedAcademicYear()));
