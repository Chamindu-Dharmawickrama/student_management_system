import { AppError } from "../../utils/appError.js";
import { getPrisma } from "../../config/database.js";
import { resolveTeacherScope } from "../teacher/teacher.scope.js";
import {
    findMarkSheetById,
    findMarkSheetsPaginated,
    findMarkStatsForSheet,
    countMarksIncomplete,
    updateMarkSheetStatusTx,
} from "./markSheet.repository.js";
import { assertTransitionAllowed } from "./markSheet.status.js";
import { toMarkSheetDTO } from "./markSheet.dto.js";

const paginationMeta = (page, limit, total) => ({ page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) });

// A teacher's READ scope for mark sheets is the same union used for marks
// (teacher.scope.js): their own subject across taught classes, plus (if
// class teacher) any subject for their responsible class.
const teacherScopeWhere = (scope) => {
    const scopeOr = [{ subjectId: scope.subjectId, classId: { in: Array.from(scope.teachingClassIds) } }];
    if (scope.classTeacherClassId) scopeOr.push({ classId: scope.classTeacherClassId });
    return { OR: scopeOr };
};

const canReadMarkSheet = (markSheet, scope) =>
    (markSheet.subjectId === scope.subjectId && scope.teachingClassIds.has(markSheet.classId)) ||
    markSheet.classId === scope.classTeacherClassId;

export const listMarkSheetsService = async (user, query) => {
    const { page, limit, examId, termId, classId, subjectId, academicYearId, status } = query;

    let scopeWhere = {};
    if (user.role === "TEACHER") {
        const scope = await resolveTeacherScope(user.id);
        scopeWhere = teacherScopeWhere(scope);
    }

    const where = {
        AND: [
            scopeWhere,
            ...(examId ? [{ examId }] : []),
            ...(termId ? [{ exam: { termId } }] : []),
            ...(classId ? [{ classId }] : []),
            ...(subjectId ? [{ subjectId }] : []),
            ...(academicYearId ? [{ exam: { term: { academicYearId } } }] : []),
            ...(status ? [{ status }] : []),
        ],
    };

    const { items, total } = await findMarkSheetsPaginated({ where, page, limit });
    const withStats = await Promise.all(
        items.map(async (markSheet) => toMarkSheetDTO(markSheet, await findMarkStatsForSheet(markSheet.id))),
    );

    return { items: withStats, meta: paginationMeta(page, limit, total) };
};

export const getMarkSheetDetailService = async (user, id) => {
    const markSheet = await findMarkSheetById(id);
    if (!markSheet) {
        throw new AppError("Mark sheet not found.", 404);
    }

    if (user.role === "TEACHER") {
        const scope = await resolveTeacherScope(user.id);
        if (!canReadMarkSheet(markSheet, scope)) {
            throw new AppError("You are not authorized to view this mark sheet.", 403);
        }
    }

    const stats = await findMarkStatsForSheet(id);
    return toMarkSheetDTO(markSheet, stats);
};

// POST /marksheets/:id/submit — DRAFT/REJECTED -> SUBMITTED. Ownership here
// is stricter than read scope: submitting is "my sheet", checked against
// markSheet.teacherId directly (not the read-scope union).
export const submitMarkSheetService = async (teacherUserId, id) => {
    const scope = await resolveTeacherScope(teacherUserId);
    const markSheet = await findMarkSheetById(id);
    if (!markSheet) {
        throw new AppError("Mark sheet not found.", 404);
    }
    if (markSheet.teacher.id !== scope.teacherId) {
        throw new AppError("You are not authorized to submit this mark sheet.", 403);
    }

    assertTransitionAllowed(markSheet.status, "SUBMITTED");

    const outstanding = await countMarksIncomplete(id);
    if (outstanding > 0) {
        throw new AppError(
            `${outstanding} student(s) on this sheet still need a mark or an absent flag before it can be submitted.`,
            409,
            { outstanding },
        );
    }

    const db = getPrisma();
    const updated = await db.$transaction(async (tx) => {
        const row = await updateMarkSheetStatusTx(tx, id, { status: "SUBMITTED", submittedAt: new Date() });
        await tx.auditLog.create({ data: { action: "MARKSHEET_SUBMITTED", entityType: "MarkSheet", entityId: id, performedById: teacherUserId } });
        return row;
    });

    return toMarkSheetDTO(updated, await findMarkStatsForSheet(id));
};

// POST /marksheets/:id/approve — SUBMITTED -> APPROVED (admin).
export const approveMarkSheetService = async (adminUserId, id) => {
    const markSheet = await findMarkSheetById(id);
    if (!markSheet) {
        throw new AppError("Mark sheet not found.", 404);
    }
    assertTransitionAllowed(markSheet.status, "APPROVED");

    const db = getPrisma();
    const updated = await db.$transaction(async (tx) => {
        const row = await updateMarkSheetStatusTx(tx, id, { status: "APPROVED", approvedById: adminUserId, approvedAt: new Date() });
        await tx.auditLog.create({ data: { action: "MARKSHEET_APPROVED", entityType: "MarkSheet", entityId: id, performedById: adminUserId } });
        return row;
    });

    return toMarkSheetDTO(updated, await findMarkStatsForSheet(id));
};

// POST /marksheets/:id/reject — SUBMITTED -> REJECTED (admin). Clears any
// prior approval bookkeeping so a rejected sheet never carries a stale
// approvedById/approvedAt from a previous cycle.
export const rejectMarkSheetService = async (adminUserId, id, reason) => {
    const markSheet = await findMarkSheetById(id);
    if (!markSheet) {
        throw new AppError("Mark sheet not found.", 404);
    }
    assertTransitionAllowed(markSheet.status, "REJECTED");

    const db = getPrisma();
    const updated = await db.$transaction(async (tx) => {
        const row = await updateMarkSheetStatusTx(tx, id, { status: "REJECTED", rejectionReason: reason, approvedById: null, approvedAt: null });
        await tx.auditLog.create({ data: { action: "MARKSHEET_REJECTED", entityType: "MarkSheet", entityId: id, performedById: adminUserId, metadata: { reason } } });
        return row;
    });

    return toMarkSheetDTO(updated, await findMarkStatsForSheet(id));
};

// POST /marksheets/:id/lock — APPROVED -> LOCKED (admin), terminal.
export const lockMarkSheetService = async (adminUserId, id) => {
    const markSheet = await findMarkSheetById(id);
    if (!markSheet) {
        throw new AppError("Mark sheet not found.", 404);
    }
    assertTransitionAllowed(markSheet.status, "LOCKED");

    const db = getPrisma();
    const updated = await db.$transaction(async (tx) => {
        const row = await updateMarkSheetStatusTx(tx, id, { status: "LOCKED" });
        await tx.auditLog.create({ data: { action: "MARKSHEET_LOCKED", entityType: "MarkSheet", entityId: id, performedById: adminUserId } });
        return row;
    });

    return toMarkSheetDTO(updated, await findMarkStatsForSheet(id));
};
