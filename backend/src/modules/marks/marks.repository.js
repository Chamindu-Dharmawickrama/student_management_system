import { getPrisma } from "../../config/database.js";
import { STUDENT_VISIBLE_STATUSES } from "../markSheet/markSheet.status.js";

// Every mark-shaped query includes exactly this — enough for both the
// authorization check (markSheet.subjectId/classId/status) and the DTO
// (marks.dto.js#toMarkDTO), in one query, no follow-up fetch.
const MARK_INCLUDE = {
    student: {
        select: {
            userId: true,
            admissionNumber: true,
            user: { select: { firstName: true, lastName: true } },
        },
    },
    markSheet: {
        select: {
            id: true,
            status: true,
            subjectId: true,
            classId: true,
            subject: { select: { id: true, name: true } },
            class: { select: { id: true, name: true } },
            exam: {
                select: {
                    id: true,
                    name: true,
                    endDate: true,
                    term: {
                        select: { id: true, name: true, academicYear: { select: { id: true, name: true } } },
                    },
                },
            },
        },
    },
};

// Resolves the User-id-rooted `studentId` used everywhere in this API
// (matching GET /students, GET /teacher/students, etc.) to the
// StudentProfile row Mark.studentId actually references — the FK target
// and the public-facing id are different values (schema.prisma:362-364).
export const findStudentProfileByUserId = async (userId) => {
    const db = getPrisma();
    return db.studentProfile.findUnique({
        where: { userId },
        select: { id: true, currentClassId: true },
    });
};

// Batch version for bulk mark entry — one query for the whole entries array
// instead of N findStudentProfileByUserId calls.
export const findStudentProfilesByUserIds = async (userIds) => {
    const db = getPrisma();
    return db.studentProfile.findMany({
        where: { userId: { in: userIds } },
        select: { id: true, userId: true, currentClassId: true },
    });
};

// Exam + its academic year (via Term) — used to confirm marks are only
// entered for the current academic year, and that the exam's date range
// has actually ended (marks.service.js).
export const findExamWithYear = async (examId) => {
    const db = getPrisma();
    return db.exam.findUnique({
        where: { id: examId },
        select: { id: true, name: true, endDate: true, term: { select: { id: true, academicYearId: true } } },
    });
};

// Finds or creates the (DRAFT) MarkSheet for this exact subject+class+exam
// — the @@unique([subjectId, classId, examId]) constraint is what makes
// this safe under concurrent requests (two teachers can never end up with
// two mark sheets for the same subject/class/exam). Never overwrites an
// existing mark sheet's status/teacher — `update: {}` is a no-op when one
// already exists, so a mark sheet that has moved past DRAFT is returned
// as-is for the caller to reject on.
export const upsertDraftMarkSheetTx = async (tx, { subjectId, classId, examId, teacherId }) => {
    return tx.markSheet.upsert({
        where: { subjectId_classId_examId: { subjectId, classId, examId } },
        update: {},
        create: { subjectId, classId, examId, teacherId },
    });
};

// Creates a Mark inside an already-authorized, already-DRAFT MarkSheet.
// @@unique([markSheetId, studentId]) is the "one mark per student per
// assessment" backstop (§27) — a second attempt throws P2002.
export const createMarkTx = async (tx, markSheetId, { studentProfileId, marksObtained, isAbsent, remarks, grade }) => {
    return tx.mark.create({
        data: { markSheetId, studentId: studentProfileId, marksObtained, isAbsent, remarks, grade },
        include: MARK_INCLUDE,
    });
};

// Loads a mark with everything needed to re-verify teacher ownership
// dynamically at update time (§11) — never trust that markSheetId alone
// proves authorization.
export const findMarkForTeacherById = async (id) => {
    const db = getPrisma();
    return db.mark.findUnique({ where: { id }, include: MARK_INCLUDE });
};

export const updateMarkTx = async (tx, id, data) => {
    return tx.mark.update({ where: { id }, data, include: MARK_INCLUDE });
};

// Bulk entry (marks.service.js#createBulkMarksService): which of these
// (markSheetId, studentId) pairs already have a Mark row — read BEFORE the
// upserts run, so created/updated counts are accurate even though every row
// is written via one upsert call each.
export const findExistingMarksTx = async (tx, markSheetIds, studentProfileIds) => {
    return tx.mark.findMany({
        where: { markSheetId: { in: markSheetIds }, studentId: { in: studentProfileIds } },
        select: { markSheetId: true, studentId: true },
    });
};

// Bulk entry's per-row write — update semantics if a mark for this student
// on this sheet already exists, create otherwise. The @@unique([markSheetId,
// studentId]) constraint is what makes this atomic under the DB's own
// ON CONFLICT, same as the single-entry path's create-then-catch-P2002.
export const upsertMarkTx = async (tx, markSheetId, studentProfileId, { marksObtained, isAbsent, remarks, grade }) => {
    return tx.mark.upsert({
        where: { markSheetId_studentId: { markSheetId, studentId: studentProfileId } },
        update: { marksObtained, isAbsent, remarks, grade },
        create: { markSheetId, studentId: studentProfileId, marksObtained, isAbsent, remarks, grade },
        include: MARK_INCLUDE,
    });
};

// Teacher's scoped marks list (§21/§37): the two authorized read "lenses"
// — own subject across taught classes, OR (if class teacher) any subject
// for the responsible class — combined as one OR, with every client filter
// ANDed on top so an out-of-scope filter yields an empty result rather than
// needing a separate rejection branch (see teacher.scope.js's doc comment).
export const findMarksForTeacherScope = async ({ scope, filters, page, limit }) => {
    const db = getPrisma();
    const { subjectId: teacherSubjectId, teachingClassIds, classTeacherClassId } = scope;
    const { classId, subjectId, examId, termId, studentUserId } = filters;

    const scopeOr = [{ subjectId: teacherSubjectId, classId: { in: Array.from(teachingClassIds) } }];
    if (classTeacherClassId) scopeOr.push({ classId: classTeacherClassId });

    const where = {
        markSheet: {
            AND: [
                { OR: scopeOr },
                ...(classId ? [{ classId }] : []),
                ...(subjectId ? [{ subjectId }] : []),
                ...(examId ? [{ examId }] : []),
                ...(termId ? [{ exam: { termId } }] : []),
            ],
        },
        ...(studentUserId ? { student: { userId: studentUserId } } : {}),
    };

    const [items, total] = await Promise.all([
        db.mark.findMany({
            where,
            include: MARK_INCLUDE,
            orderBy: { createdAt: "desc" },
            skip: (page - 1) * limit,
            take: limit,
        }),
        db.mark.count({ where }),
    ]);

    return { items, total };
};

// Student's own marks — gated to results the student is actually meant to
// see: the mark has actually been entered (a value or isAbsent) AND its
// sheet has been through the approval workflow (APPROVED or LOCKED — see
// markSheet.status.js#STUDENT_VISIBLE_STATUSES). A teacher typing marks into
// a DRAFT sheet, or one still SUBMITTED/REJECTED, does not make them visible
// yet — only admin approval releases them.
export const findMarksForStudent = async ({ studentProfileId, filters, page, limit }) => {
    const db = getPrisma();
    const { subjectId, academicYearId, examId, termId } = filters;

    const where = {
        studentId: studentProfileId,
        OR: [{ isAbsent: true }, { marksObtained: { not: null } }],
        markSheet: {
            status: { in: Array.from(STUDENT_VISIBLE_STATUSES) },
            ...(subjectId ? { subjectId } : {}),
            ...(examId ? { examId } : {}),
            ...((academicYearId || termId)
                ? { exam: { ...(termId ? { termId } : {}), ...(academicYearId ? { term: { academicYearId } } : {}) } }
                : {}),
        },
    };

    const [items, total] = await Promise.all([
        db.mark.findMany({
            where,
            include: MARK_INCLUDE,
            orderBy: { createdAt: "desc" },
            skip: (page - 1) * limit,
            take: limit,
        }),
        db.mark.count({ where }),
    ]);

    return { items, total };
};
