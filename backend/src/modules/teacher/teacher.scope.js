import { AppError } from "../../utils/appError.js";
import { findCurrentAcademicYear, findTeacherProfileScopeData } from "./teacher.repository.js";

// Resolves the authenticated teacher's authorization scope, server-side,
// from their user id only — never from client-supplied ids (§31/§44).
//
//   subjectId          — this year's TeacherSubjectAssignment.subjectId
//                         (a teacher has exactly one, §3.1), or null if
//                         they have none yet.
//   teachingClassIds    — this year's active TeachingAssignment classIds.
//                         This IS the write scope (§20): entering/updating
//                         marks is only ever authorized against this set.
//   classTeacherClassId — this year's responsible class, or null. Grants
//                         an EXTRA read-only scope (§7/§20): all subjects'
//                         marks for that one class.
export const resolveTeacherScope = async (userId) => {
    const currentAcademicYear = await findCurrentAcademicYear();
    const profile = await findTeacherProfileScopeData(userId, currentAcademicYear?.id ?? null);

    if (!profile) {
        throw new AppError("Teacher profile not found.", 404);
    }

    return {
        teacherId: profile.id,
        subjectId: profile.subjectAssignments[0]?.subjectId ?? null,
        teachingClassIds: new Set(profile.teachingAssignments.map((a) => a.classId)),
        classTeacherClassId: profile.classesAsClassTeacher[0]?.id ?? null,
        currentAcademicYearId: currentAcademicYear?.id ?? null,
    };
};
