import { getPrisma } from "../../config/database.js";

export const findCurrentAcademicYear = async () => {
    const db = getPrisma();
    return db.academicYear.findFirst({ where: { isCurrent: true } });
};

export const findAcademicYearById = async (id) => {
    const db = getPrisma();
    return db.academicYear.findUnique({ where: { id } });
};

// --- Admin dashboard -------------------------------------------------
// Counts below are school-wide (plain User.role/isActive counts), NOT
// scoped to the selected academic year — a school's staff/student
// headcount isn't naturally year-relative the way enrollment is. `classes`
// is the one count that IS year-scoped, since Class.academicYearId is
// mandatory on every row.

export const countStudents = async () => {
    const db = getPrisma();
    return db.user.count({ where: { role: "STUDENT" } });
};

export const countTeachers = async () => {
    const db = getPrisma();
    return db.user.count({ where: { role: "TEACHER" } });
};

export const countActiveStudents = async () => {
    const db = getPrisma();
    return db.user.count({ where: { role: "STUDENT", isActive: true } });
};

export const countInactiveStudents = async () => {
    const db = getPrisma();
    return db.user.count({ where: { role: "STUDENT", isActive: false } });
};

export const countActiveSubjects = async () => {
    const db = getPrisma();
    return db.subject.count({ where: { isActive: true } });
};

export const countClassesForYear = async (academicYearId) => {
    const db = getPrisma();
    return db.class.count({ where: { academicYearId } });
};

export const countPendingCredentialChanges = async () => {
    const db = getPrisma();
    return db.user.count({ where: { mustChangePassword: true } });
};

export const countUnconfiguredExamPeriods = async (academicYearId) => {
    const db = getPrisma();
    return db.exam.count({ where: { term: { academicYearId }, endDate: null } });
};

// Terms with their one exam's date range + a markSheet count via `_count` —
// used for the admin dashboard's `terms[]` and the `isEntryOpen` badge.
export const findTermsWithExamCounts = async (academicYearId) => {
    const db = getPrisma();
    return db.term.findMany({
        where: { academicYearId },
        orderBy: { sequence: "asc" },
        select: {
            id: true,
            name: true,
            sequence: true,
            startDate: true,
            endDate: true,
            exam: { select: { id: true, startDate: true, endDate: true, _count: { select: { markSheets: true } } } },
        },
    });
};

export const findRecentAuditLog = async (take = 10) => {
    const db = getPrisma();
    return db.auditLog.findMany({
        orderBy: { createdAt: "desc" },
        take,
        include: { performedBy: { select: { id: true, firstName: true, lastName: true } } },
    });
};

// --- Teacher dashboard -------------------------------------------------

export const findSubjectById = async (id) => {
    const db = getPrisma();
    return db.subject.findUnique({ where: { id }, select: { id: true, name: true } });
};

export const findClassesWithStudentCount = async (classIds) => {
    const db = getPrisma();
    return db.class.findMany({
        where: { id: { in: classIds } },
        select: { id: true, name: true, _count: { select: { currentStudents: true } } },
    });
};

export const findClassWithStudentCount = async (classId) => {
    const db = getPrisma();
    return db.class.findUnique({
        where: { id: classId },
        select: { id: true, name: true, _count: { select: { currentStudents: true } } },
    });
};

export const countStudentsInClasses = async (classIds) => {
    const db = getPrisma();
    if (classIds.length === 0) return 0;
    return db.studentProfile.count({ where: { currentClassId: { in: classIds } } });
};

export const findTermsWithExamGate = async (academicYearId) => {
    const db = getPrisma();
    return db.term.findMany({
        where: { academicYearId },
        orderBy: { sequence: "asc" },
        select: { id: true, name: true, sequence: true, exam: { select: { id: true, endDate: true } } },
    });
};

export const countPendingEntryForTeacher = async (teacherId) => {
    const db = getPrisma();
    return db.mark.count({
        where: { markSheet: { teacherId, status: { in: ["DRAFT", "REJECTED"] } }, marksObtained: null, isAbsent: false },
    });
};

// --- Student dashboard -------------------------------------------------

export const findClassById = async (id) => {
    const db = getPrisma();
    return db.class.findUnique({ where: { id }, select: { id: true, name: true } });
};

export const findActiveSubjectSelectionsForStudent = async (studentProfileId, academicYearId) => {
    const db = getPrisma();
    return db.studentSubjectSelection.findMany({
        where: { studentId: studentProfileId, academicYearId, isActive: true },
        select: { subject: { select: { id: true, name: true, code: true } } },
    });
};

export const findTermsForYear = async (academicYearId) => {
    const db = getPrisma();
    return db.term.findMany({
        where: { academicYearId },
        orderBy: { sequence: "asc" },
        select: { id: true, name: true, sequence: true, exam: { select: { id: true, endDate: true } } },
    });
};

// One query across every term's exam for this student — the service groups
// the rows by termId in memory rather than one query per term.
export const findMarksForStudentTerms = async (studentProfileId, termIds) => {
    const db = getPrisma();
    if (termIds.length === 0) return [];
    return db.mark.findMany({
        where: { studentId: studentProfileId, markSheet: { exam: { termId: { in: termIds } } } },
        select: {
            marksObtained: true,
            isAbsent: true,
            markSheet: { select: { status: true, subject: { select: { id: true, name: true } }, exam: { select: { termId: true } } } },
        },
    });
};
