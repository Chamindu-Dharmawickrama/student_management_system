import { Combobox } from "@/shared/components/ui";
import { Calendar } from "lucide-react";
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
      <div className="flex items-center gap-2.5 mr-2">
         <span className="hidden items-center gap-1.5 text-sm font-medium text-text-muted md:flex">
            <Calendar className="h-4 w-4" />
            <span>Academic Year</span>
         </span>
         <div className="w-40">
            <Combobox
               options={options}
               value={yearId}
               onChange={(id) => id && setYear(id)}
               placeholder={isLoading ? "Loading…" : "Select year"}
               clearable={false}
               disabled={isLoading || options.length === 0}
            />
         </div>
      </div>
   );
}
