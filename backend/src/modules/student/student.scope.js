import { AppError } from "../../utils/appError.js";
import { findStudentProfileScopeData } from "./student.repository.js";

// Resolves the authenticated student's own scope from their user id only —
// every marks/profile query is then `where: { studentId: studentProfileId }`,
// so another student's data is never reachable regardless of what the
// request contains (§15/§32).
export const resolveStudentScope = async (userId) => {
    const profile = await findStudentProfileScopeData(userId);

    if (!profile) {
        throw new AppError("Student profile not found.", 404);
    }

    return {
        studentProfileId: profile.id,
        currentClassId: profile.currentClassId,
        currentAcademicYearId: profile.currentClass?.academicYearId ?? null,
    };
};
