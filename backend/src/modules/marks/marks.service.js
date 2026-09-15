import { AppError } from "../../utils/appError.js";
import { getPrisma } from "../../config/database.js";
import { resolveTeacherScope } from "../teacher/teacher.scope.js";
import { resolveStudentScope } from "../student/student.scope.js";
import { resolveGradeForMark, resolveGradeFromBands } from "../gradeBand/gradeBand.service.js";
import { findAllGradeBands } from "../gradeBand/gradeBand.repository.js";
import { findActiveSubjectSelectionsForStudents } from "../exam/exam.repository.js";
import { assertMarkSheetEditable } from "../markSheet/markSheet.status.js";
import {
    findStudentProfileByUserId,
    findStudentProfilesByUserIds,
    findExamWithYear,
    upsertDraftMarkSheetTx,
    createMarkTx,
    findMarkForTeacherById,
    updateMarkTx,
    findMarksForTeacherScope,
    findMarksForStudent,
    findExistingMarksTx,
    upsertMarkTx,
} from "./marks.repository.js";
import { toMarkDTO } from "./marks.dto.js";

const paginationMeta = (page, limit, total) => ({ page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) });

// The exam-period gate is identical for single and bulk entry (and for
// update, modulo the verb in the message) — §9/§23/§24: marks can only be
// written once the exam's date range has actually ended.
const assertExamPeriodEnded = (exam, actionVerb = "entered") => {
    if (!exam.endDate) {
        throw new AppError("The exam period for this term has not been configured yet.", 409);
    }
    if (new Date() <= exam.endDate) {
        throw new AppError(`Marks can only be ${actionVerb} after the exam period for this term has ended.`, 409);
    }
};

// Enters a mark (§9/§10/§23/§24). The subject is always the teacher's own
// (from scope, never the request body) and the class is always the
// student's current enrollment — resolved server-side, then cross-checked
// against the teacher's teaching assignments before anything is written.
export const createMarkService = async (teacherUserId, body) => {
    const scope = await resolveTeacherScope(teacherUserId);
    if (!scope.subjectId) {
        throw new AppError("You have no active subject assignment for the current academic year.", 400);
    }

    const exam = await findExamWithYear(body.examId);
    if (!exam) {
        throw new AppError("Exam not found.", 404);
    }
    if (!scope.currentAcademicYearId || exam.term.academicYearId !== scope.currentAcademicYearId) {
        throw new AppError("Marks can only be entered for the current academic year.", 400);
    }
    assertExamPeriodEnded(exam, "entered");

    const student = await findStudentProfileByUserId(body.studentId);
    if (!student) {
        throw new AppError("Student not found.", 404);
    }
    if (!student.currentClassId) {
        throw new AppError("This student is not currently enrolled in a class.", 400);
    }
    if (!scope.teachingClassIds.has(student.currentClassId)) {
        throw new AppError("You do not teach this class.", 403);
    }

    const effectiveMarksObtained = body.isAbsent ? null : body.marksObtained;
    const grade = await resolveGradeForMark(effectiveMarksObtained);

    const db = getPrisma();
    let mark;
    try {
        mark = await db.$transaction(async (tx) => {
            const markSheet = await upsertDraftMarkSheetTx(tx, {
                subjectId: scope.subjectId,
                classId: student.currentClassId,
                examId: body.examId,
                teacherId: scope.teacherId,
            });

            assertMarkSheetEditable(markSheet.status);

            return createMarkTx(tx, markSheet.id, {
                studentProfileId: student.id,
                marksObtained: effectiveMarksObtained,
                isAbsent: body.isAbsent,
                remarks: body.remarks,
                grade,
            });
        });
    } catch (err) {
        if (err.code === "P2002") {
            throw new AppError("A mark for this student already exists for this assessment — use update instead.", 409);
        }
        throw err;
    }

    return toMarkDTO(mark);
};

// Updates a mark (§11/§25). Ownership is re-derived from the teacher's
// CURRENT scope every time, not from who originally entered it — a teacher
// who has since lost that class/subject can no longer edit it, and one who
// has since gained it can.
export const updateMarkService = async (teacherUserId, markId, body) => {
    const scope = await resolveTeacherScope(teacherUserId);

    const mark = await findMarkForTeacherById(markId);
    if (!mark) {
        throw new AppError("Mark not found.", 404);
    }

    if (mark.markSheet.subjectId !== scope.subjectId || !scope.teachingClassIds.has(mark.markSheet.classId)) {
        throw new AppError("You are not authorized to modify this mark.", 403);
    }
    assertMarkSheetEditable(mark.markSheet.status);
    assertExamPeriodEnded(mark.markSheet.exam, "updated");

    const data = {};
    if (body.isAbsent !== undefined) data.isAbsent = body.isAbsent;
    if (body.marksObtained !== undefined) data.marksObtained = body.marksObtained;
    if (body.remarks !== undefined) data.remarks = body.remarks;
    if (data.isAbsent === true) data.marksObtained = null;

    // Recompute the grade snapshot whenever the EFFECTIVE marksObtained/
    // isAbsent changes — using the merged old+new values, not just
    // whatever happened to be in this particular PATCH body (§30).
    if (body.isAbsent !== undefined || body.marksObtained !== undefined) {
        const effectiveIsAbsent = data.isAbsent ?? mark.isAbsent;
        const effectiveMarksObtained = effectiveIsAbsent ? null : (data.marksObtained ?? mark.marksObtained);
        data.grade = await resolveGradeForMark(effectiveMarksObtained);
    }

    const db = getPrisma();
    const updated = await db.$transaction((tx) => updateMarkTx(tx, markId, data));

    return toMarkDTO(updated);
};

// Bulk mark entry (Prompt 01 Capability A) — a whole class's worth of marks
// in one request. Subject is always scope.subjectId (fixed for the whole
// batch, exactly like single-entry); class is derived per-student from
// their current enrollment, so one batch spanning students in different
// classes touches multiple MarkSheets (one per distinct class). "Atomic,
// all-or-nothing" means: if ANY sheet touched by this batch isn't writable,
// or ANY student fails authorization, NONE of the sheets receive any write —
// never a partial commit across classes.
export const createBulkMarksService = async (teacherUserId, { examId, entries }) => {
    const scope = await resolveTeacherScope(teacherUserId);
    if (!scope.subjectId) {
        throw new AppError("You have no active subject assignment for the current academic year.", 400);
    }

    const exam = await findExamWithYear(examId);
    if (!exam) {
        throw new AppError("Exam not found.", 404);
    }
    if (!scope.currentAcademicYearId || exam.term.academicYearId !== scope.currentAcademicYearId) {
        throw new AppError("Marks can only be entered for the current academic year.", 400);
    }
    assertExamPeriodEnded(exam, "entered");

    const profiles = await findStudentProfilesByUserIds(entries.map((e) => e.studentId));
    const profileByUserId = new Map(profiles.map((p) => [p.userId, p]));

    // Pass 1 — validate every entry against enrollment + write scope. Never
    // write anything until every entry in the batch has been checked.
    const notFound = [];
    const outOfScope = [];
    const scopedEntries = [];
    for (const entry of entries) {
        const profile = profileByUserId.get(entry.studentId);
        if (!profile || !profile.currentClassId) {
            notFound.push(entry.studentId);
            continue;
        }
        if (!scope.teachingClassIds.has(profile.currentClassId)) {
            outOfScope.push(entry.studentId);
            continue;
        }
        scopedEntries.push({ entry, profile });
    }

    // Pass 2 — of what's left, confirm each student has actually selected
    // this subject this year (§9's authoritative eligibility source), one
    // batched query rather than one per student.
    const subjectNotSelected = [];
    let validEntries = scopedEntries;
    if (scopedEntries.length > 0) {
        const selections = await findActiveSubjectSelectionsForStudents(
            scope.currentAcademicYearId,
            scopedEntries.map(({ profile }) => profile.id),
        );
        const selectedProfileIds = new Set(
            selections.filter((s) => s.subjectId === scope.subjectId).map((s) => s.studentId),
        );
        validEntries = [];
        for (const item of scopedEntries) {
            if (selectedProfileIds.has(item.profile.id)) {
                validEntries.push(item);
            } else {
                subjectNotSelected.push(item.entry.studentId);
            }
        }
    }

    if (notFound.length > 0 || outOfScope.length > 0 || subjectNotSelected.length > 0) {
        const failures = [
            ...notFound.map((studentId) => ({ studentId, reason: "Student not found or not currently enrolled in a class." })),
            ...outOfScope.map((studentId) => ({ studentId, reason: "You do not teach this student's class." })),
            ...subjectNotSelected.map((studentId) => ({ studentId, reason: "This student has not selected your subject for this academic year." })),
        ];
        const statusCode = notFound.length > 0 ? 404 : outOfScope.length > 0 ? 403 : 409;
        const preview = failures.slice(0, 5).map((f) => `${f.studentId} (${f.reason})`).join(", ");
        const suffix = failures.length > 5 ? ", ..." : "";
        throw new AppError(
            `${failures.length} student(s) failed validation: ${preview}${suffix}`,
            statusCode,
            { failures },
        );
    }

    const bands = await findAllGradeBands();
    const classIds = new Set(validEntries.map(({ profile }) => profile.currentClassId));

    const db = getPrisma();
    const { created, updated, marks } = await db.$transaction(async (tx) => {
        const markSheetIdForClass = new Map();
        for (const classId of classIds) {
            const markSheet = await upsertDraftMarkSheetTx(tx, {
                subjectId: scope.subjectId,
                classId,
                examId,
                teacherId: scope.teacherId,
            });
            assertMarkSheetEditable(markSheet.status);
            markSheetIdForClass.set(classId, markSheet.id);
        }

        const markSheetIds = Array.from(markSheetIdForClass.values());
        const studentProfileIds = validEntries.map(({ profile }) => profile.id);
        const existing = await findExistingMarksTx(tx, markSheetIds, studentProfileIds);
        const existingKeys = new Set(existing.map((m) => `${m.markSheetId}|${m.studentId}`));

        let createdCount = 0;
        let updatedCount = 0;
        const rows = [];
        for (const { entry, profile } of validEntries) {
            const markSheetId = markSheetIdForClass.get(profile.currentClassId);
            const key = `${markSheetId}|${profile.id}`;
            if (existingKeys.has(key)) {
                updatedCount += 1;
            } else {
                createdCount += 1;
            }

            const effectiveMarksObtained = entry.isAbsent ? null : entry.marksObtained;
            const grade = resolveGradeFromBands(effectiveMarksObtained, bands);
            const row = await upsertMarkTx(tx, markSheetId, profile.id, {
                marksObtained: effectiveMarksObtained,
                isAbsent: entry.isAbsent,
                remarks: entry.remarks,
                grade,
            });
            rows.push(row);
        }

        return { created: createdCount, updated: updatedCount, marks: rows };
    });

    return { created, updated, marks: marks.map(toMarkDTO) };
};

// Teacher's scoped marks list (§21/§37).
export const listTeacherMarksService = async (teacherUserId, query) => {
    const scope = await resolveTeacherScope(teacherUserId);
    const { page, limit, classId, subjectId, examId, termId, studentId } = query;

    const { items, total } = await findMarksForTeacherScope({
        scope,
        filters: { classId, subjectId, examId, termId, studentUserId: studentId },
        page,
        limit,
    });

    return { items: items.map(toMarkDTO), meta: paginationMeta(page, limit, total) };
};

// Student's own marks list — a mark shows up once it's actually been
// entered (see marks.repository.js#findMarksForStudent). Filterable by
// `termId` so the student can view each of the 3 terms' marks separately.
export const listStudentMarksService = async (studentUserId, query) => {
    const scope = await resolveStudentScope(studentUserId);
    const { page, limit, subjectId, academicYearId, examId, termId } = query;

    const { items, total } = await findMarksForStudent({
        studentProfileId: scope.studentProfileId,
        filters: { subjectId, academicYearId, examId, termId },
        page,
        limit,
    });

    return { items: items.map(toMarkDTO), meta: paginationMeta(page, limit, total) };
};
