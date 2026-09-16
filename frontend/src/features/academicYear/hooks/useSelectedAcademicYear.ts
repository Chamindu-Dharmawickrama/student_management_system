import { useEffect, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { useGetAcademicYearsQuery } from "../api/academicYearApi";
import {
   selectCurrentYearId,
   setCurrentYearId,
} from "../slices/academicYearSlice";
import type { AcademicYearListItem } from "../types/academicYear.types";

export interface UseSelectedAcademicYearResult {
   year: AcademicYearListItem | null;
   yearId: string | null;
   setYear: (id: string) => void;
   isCurrent: boolean;
   /** True whenever the selected year isn't the current one — admin screens should disable writes. */
   isReadOnly: boolean;
   isLoading: boolean;
}

/**
 * The single source of truth for the admin-only global academic-year
 * context. Validates the persisted id against the fetched list on every
 * change — a deleted/renamed year (or a value from an older session) falls
 * back to the `isCurrent` year instead of wedging the UI.
 */
export function useSelectedAcademicYear(): UseSelectedAcademicYearResult {
   const dispatch = useAppDispatch();
   const { data: years, isLoading } = useGetAcademicYearsQuery();
   const persistedId = useAppSelector(selectCurrentYearId);

   const persistedYear = useMemo(
      () => years?.find((y) => y.id === persistedId) ?? null,
      [years, persistedId],
   );
   const currentYear = useMemo(
      () => years?.find((y) => y.isCurrent) ?? null,
      [years],
   );

   const year = persistedYear ?? currentYear;

   // The persisted id no longer exists in the fetched list — replace it with
   // the current year (or clear it) so it doesn't silently stay stale.
   useEffect(() => {
      if (!years) return;
      if (year && year.id !== persistedId) {
         dispatch(setCurrentYearId(year.id));
      }
   }, [years, year, persistedId, dispatch]);

   return {
      year,
      yearId: year?.id ?? null,
      setYear: (id: string) => dispatch(setCurrentYearId(id)),
      isCurrent: year?.isCurrent ?? false,
      isReadOnly: !!year && !year.isCurrent,
      isLoading,
   };
}
