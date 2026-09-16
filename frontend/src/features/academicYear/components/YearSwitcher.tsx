import { Combobox } from "@/shared/components/ui";
import { useGetAcademicYearsQuery } from "../api/academicYearApi";
import { useSelectedAcademicYear } from "../hooks/useSelectedAcademicYear";

export function YearSwitcher() {
   const { data: years } = useGetAcademicYearsQuery();
   const { yearId, setYear, isLoading } = useSelectedAcademicYear();

   const options = (years ?? []).map((y) => ({
      value: y.id,
      label: y.isCurrent ? `${y.name} (current)` : y.name,
   }));

   return (
      <div className="w-44">
         <Combobox
            label="Year"
            options={options}
            value={yearId}
            onChange={(id) => id && setYear(id)}
            placeholder={isLoading ? "Loading…" : "Select year"}
            clearable={false}
            disabled={isLoading || options.length === 0}
         />
      </div>
   );
}
