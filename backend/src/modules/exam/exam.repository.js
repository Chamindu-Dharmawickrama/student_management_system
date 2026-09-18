import { getPrisma } from "../../config/database.js";

export const findExamById = async (id) => {
    const db = getPrisma();
    return db.exam.findUnique({ where: { id } });
};

// Admin "view exam" detail — term/academicYear context (incl. the term's
// own date range, needed to validate a new exam period falls within it) +
// a MarkSheet count so the admin can see at a glance whether generation has
// run (§40).
export const findExamDetailById = async (id) => {
    const db = getPrisma();
    return db.exam.findUnique({
        where: { id },
        include: {
            term: {
                select: {
                    id: true, name: true, sequence: true, startDate: true, endDate: true,
                    academicYear: { select: { id: true, name: true, isCurrent: true } },
                },
            },
            _count: { select: { markSheets: true } },
        },
    });
};

export const updateExamPeriodRow = async (id, { startDate, endDate }) => {
    const db = getPrisma();
    return db.exam.update({ where: { id }, data: { startDate, endDate } });
};

// --- Reconciliation data access (exam/markSheetReconciliation.js) ---

export const findExamWithTermYear = async (id) => {
    const db = getPrisma();
    return db.exam.findUnique({
        where: { id },
        select: { id: true, term: { select: { id: true, academicYearId: true } } },
    });
};

// Every StudentClassEnrollment row for the year, across still-active
// classes only, newest first — the caller reduces this to one row per
// studentId (the first occurrence) to get "which class each student was
// actually in for this specific year" (§18/§19), never
// StudentProfile.currentClassId.
export const findEnrollmentsForYear = async (academicYearId) => {
    const db = getPrisma();
    return db.studentClassEnrollment.findMany({
        where: { academicYearId, class: { isActive: true } },
        orderBy: { enrolledAt: "desc" },
        select: { studentId: true, classId: true },
    });
};

export const findActiveSubjectSelectionsForStudents = async (academicYearId, studentIds) => {
    const db = getPrisma();
    return db.studentSubjectSelection.findMany({
        where: { academicYearId, isActive: true, studentId: { in: studentIds } },
        select: { studentId: true, subjectId: true },
    });
};

// All active teaching assignments for the year in one query — used to
// build a (classId,subjectId) → teacherId map in memory rather than
// querying per group (§41 query-efficiency).
export const findActiveTeachingAssignmentsForYear = async (academicYearId) => {
    const db = getPrisma();
    return db.teachingAssignment.findMany({
        where: { academicYearId, isActive: true },
        select: { classId: true, subjectId: true, teacherId: true },
    });
};

// Race-safe bulk insert (§45): the DB's own
// @@unique([subjectId, classId, examId]) is what actually prevents
// duplicates under concurrent generation runs — skipDuplicates makes the
// already-existing ones a silent no-op instead of an error, and `.count`
// on the result tells the caller exactly how many were newly created.
export const createMissingMarkSheetsTx = async (tx, rows) => {
    if (rows.length === 0) return { count: 0 };
    return tx.markSheet.createMany({ data: rows, skipDuplicates: true });
};

// Same race-safe pattern, backed by @@unique([markSheetId, studentId]).
export const createMissingMarksTx = async (tx, rows) => {
    if (rows.length === 0) return { count: 0 };
    return tx.mark.createMany({ data: rows, skipDuplicates: true });
};
