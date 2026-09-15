import { resolveTeacherScope } from "../teacher/teacher.scope.js";
import { findSubjectById, findClassesByIds, findClassById } from "../teacher/teacher.repository.js";
import { findStudentsInClasses } from "./teacherPortal.repository.js";
import { toTeacherStudentListItemDTO } from "./teacherPortal.dto.js";

// GET /teacher/classes (§17/§18/§19) — the teacher's own subject, the
// classes they teach it to, and (if any) the one class they're responsible
// for as class teacher. Everything derived from resolveTeacherScope, not
// from the request.
export const getMyClassesService = async (userId) => {
    const scope = await resolveTeacherScope(userId);

    const [subject, teachingClasses, classTeacherClass] = await Promise.all([
        scope.subjectId ? findSubjectById(scope.subjectId) : null,
        scope.teachingClassIds.size > 0 ? findClassesByIds(Array.from(scope.teachingClassIds)) : [],
        scope.classTeacherClassId ? findClassById(scope.classTeacherClassId) : null,
    ]);

    return {
        subject: subject ? { id: subject.id, name: subject.name } : null,
        teachingClasses: teachingClasses.map((c) => ({ id: c.id, name: c.name })),
        classTeacherOf: classTeacherClass ? { id: classTeacherClass.id, name: classTeacherClass.name } : null,
    };
};

// GET /teacher/students (§20/§22) — authorized classes = teaching
// assignments + responsible class (read scope, wider than the write
// scope). An unauthorized `classId` filter narrows to an empty set rather
// than erroring, same policy as the marks list.
export const getMyStudentsService = async (userId, query) => {
    const scope = await resolveTeacherScope(userId);
    const { page, limit, classId } = query;

    const authorizedClassIds = new Set(scope.teachingClassIds);
    if (scope.classTeacherClassId) authorizedClassIds.add(scope.classTeacherClassId);

    const targetClassIds = classId
        ? (authorizedClassIds.has(classId) ? [classId] : [])
        : Array.from(authorizedClassIds);

    const { items, total } = await findStudentsInClasses({ classIds: targetClassIds, page, limit });

    return {
        items: items.map(toTeacherStudentListItemDTO),
        meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
    };
};
