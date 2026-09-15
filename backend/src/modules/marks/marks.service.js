import { AppError } from "../../utils/appError.js";
import { getPrisma } from "../../config/database.js";
import { resolveTeacherScope } from "../teacher/teacher.scope.js";
import { resolveStudentScope } from "../student/student.scope.js";
import { resolveGradeForMark } from "../gradeBand/gradeBand.service.js";
import {
    findStudentProfileByUserId,
    findExamWithYear,
    upsertDraftMarkSheetTx,
    createMarkTx,
    findMarkForTeacherById,
    updateMarkTx,
    findMarksForTeacherScope,
    findMarksForStudent,
} from "./marks.repository.js";
import { toMarkDTO } from "./marks.dto.js";

const paginationMeta = (page, limit, total) => ({ page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) });

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
    if (!exam.endDate) {
        throw new AppError("The exam period for this term has not been configured yet.", 409);
    }
    if (new Date() <= exam.endDate) {
        throw new AppError("Marks can only be entered after the exam period for this term has ended.", 409);
    }

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

            if (markSheet.status !== "DRAFT") {
                throw Object.assign(new Error("MARKSHEET_NOT_EDITABLE"), { code: "MARKSHEET_NOT_EDITABLE" });
            }

            return createMarkTx(tx, markSheet.id, {
                studentProfileId: student.id,
                marksObtained: effectiveMarksObtained,
                isAbsent: body.isAbsent,
                remarks: body.remarks,
                grade,
            });
        });
    } catch (err) {
        if (err.code === "MARKSHEET_NOT_EDITABLE") {
            throw new AppError("This mark sheet is no longer editable.", 409);
        }
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
    if (mark.markSheet.status !== "DRAFT") {
        throw new AppError("This mark sheet is no longer editable.", 409);
    }
    if (!mark.markSheet.exam.endDate) {
        throw new AppError("The exam period for this term has not been configured yet.", 409);
    }
    if (new Date() <= mark.markSheet.exam.endDate) {
        throw new AppError("Marks can only be updated after the exam period for this term has ended.", 409);
    }

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
