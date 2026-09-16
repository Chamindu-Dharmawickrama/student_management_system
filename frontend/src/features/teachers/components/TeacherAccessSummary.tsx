import { Card } from "@/shared/components/ui";
import { ShieldCheck, AlertCircle } from "lucide-react";
import type { TeacherDetailDTO } from "../types/teacher.types";
import { useMemo } from "react";

interface TeacherAccessSummaryProps {
  teacher: TeacherDetailDTO;
  academicYearId: string;
}

export function TeacherAccessSummary({ teacher, academicYearId }: TeacherAccessSummaryProps) {
  const summary = useMemo(() => {
    // Filter by the selected academic year
    const activeSubject = teacher.currentSubjectAssignment?.academicYear.id === academicYearId 
      ? teacher.currentSubjectAssignment.subject 
      : null;

    const activeTeachingClasses = teacher.teachingAssignments
      .filter(ta => ta.academicYear.id === academicYearId)
      .map(ta => ta.class.name);

    const activeClassTeacherRoles = teacher.classTeacherOf
      .filter(ct => ct.academicYear.id === academicYearId)
      .map(ct => ct.name);

    const permissions = [];

    if (activeSubject && activeTeachingClasses.length > 0) {
      permissions.push(
        <span key="mark-entry">
          Can enter marks for <strong>{activeSubject.name}</strong> in{" "}
          <strong>{activeTeachingClasses.join(", ")}</strong>.
        </span>
      );
    } else if (activeSubject) {
      permissions.push(
        <span key="mark-entry-no-class" className="text-warning-600">
          Assigned to <strong>{activeSubject.name}</strong> but has no classes to enter marks for.
        </span>
      );
    }

    if (activeClassTeacherRoles.length > 0) {
      permissions.push(
        <span key="pastoral-care">
          Can view students in <strong>{activeClassTeacherRoles.join(", ")}</strong> as class teacher.
        </span>
      );
    }

    if (permissions.length === 0) {
      return (
        <p className="text-text-muted italic flex items-center gap-1">
          <AlertCircle className="h-4 w-4" />
          No active permissions for this academic year.
        </p>
      );
    }

    return (
      <ul className="space-y-1">
        {permissions.map((p, i) => (
          <li key={i}>{p}</li>
        ))}
      </ul>
    );
  }, [teacher, academicYearId]);

  return (
    <Card className="p-4 bg-primary-subtle border-primary-200">
      <div className="flex items-start gap-3">
        <ShieldCheck className="h-5 w-5 text-primary mt-0.5 shrink-0" />
        <div>
          <h4 className="text-sm font-semibold text-text-primary mb-1">Access Summary</h4>
          <div className="text-sm text-text-secondary">
            {summary}
          </div>
        </div>
      </div>
    </Card>
  );
}
