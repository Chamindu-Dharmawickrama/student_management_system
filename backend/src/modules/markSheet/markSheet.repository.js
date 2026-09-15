import { getPrisma } from "../../config/database.js";

// Enough for both the list and detail views — subject/class/exam(+term)/
// teacher(+user names)/approvedBy, one query, no follow-up fetch. Mirrors
// marks.repository.js#MARK_INCLUDE.
const MARKSHEET_DETAIL_INCLUDE = {
    subject: { select: { id: true, name: true } },
    class: { select: { id: true, name: true } },
    exam: {
        select: {
            id: true,
            name: true,
            term: { select: { id: true, name: true, sequence: true } },
        },
    },
    teacher: {
        select: {
            id: true,
            user: { select: { id: true, firstName: true, lastName: true } },
        },
    },
    approvedBy: { select: { id: true, firstName: true, lastName: true } },
};

export const findMarkSheetById = async (id) => {
    const db = getPrisma();
    return db.markSheet.findUnique({ where: { id }, include: MARKSHEET_DETAIL_INCLUDE });
};

// Paginated, filterable mark-sheet list — `where` already carries whatever
// scope restriction the service decided on (teacher OR-scope vs. admin
// unrestricted), with client filters ANDed on top by the caller.
export const findMarkSheetsPaginated = async ({ where, page, limit }) => {
    const db = getPrisma();
    const [items, total] = await Promise.all([
        db.markSheet.findMany({
            where,
            include: MARKSHEET_DETAIL_INCLUDE,
            orderBy: { createdAt: "desc" },
            skip: (page - 1) * limit,
            take: limit,
        }),
        db.markSheet.count({ where }),
    ]);
    return { items, total };
};

// Completion stats for one sheet — total students on it, how many are
// absent, and how many have been entered at all (value or absent). `pending`
// is derived by the caller (total - entered) rather than a third query.
export const findMarkStatsForSheet = async (markSheetId) => {
    const db = getPrisma();
    const [totalStudents, absent, entered] = await Promise.all([
        db.mark.count({ where: { markSheetId } }),
        db.mark.count({ where: { markSheetId, isAbsent: true } }),
        db.mark.count({ where: { markSheetId, OR: [{ isAbsent: true }, { marksObtained: { not: null } }] } }),
    ]);
    return { totalStudents, absent, entered, pending: totalStudents - entered };
};

// Backs the "submit requires completeness" gate — a mark is still a
// placeholder when it has neither a value nor the absent flag.
export const countMarksIncomplete = async (markSheetId) => {
    const db = getPrisma();
    return db.mark.count({ where: { markSheetId, marksObtained: null, isAbsent: false } });
};

// One generic setter for all four transitions — the caller supplies exactly
// the fields that change for that transition (see markSheet.service.js).
export const updateMarkSheetStatusTx = async (tx, id, data) => {
    return tx.markSheet.update({ where: { id }, data, include: MARKSHEET_DETAIL_INCLUDE });
};

// Status counts for a scope (admin: whole year; teacher: their own sheets) —
// normalized in the service/dto layer to {draft,submitted,approved,rejected,
// locked} since groupBy only returns statuses that actually have rows.
// Exported for reuse by the dashboard module (dashboard -> markSheet is the
// one cross-module import here, one-directional).
export const groupMarkSheetCountsByStatus = async (where) => {
    const db = getPrisma();
    return db.markSheet.groupBy({ by: ["status"], where, _count: true });
};

export const normalizeMarkSheetStatusCounts = (groups) => {
    const counts = { draft: 0, submitted: 0, approved: 0, rejected: 0, locked: 0 };
    const keyByStatus = { DRAFT: "draft", SUBMITTED: "submitted", APPROVED: "approved", REJECTED: "rejected", LOCKED: "locked" };
    for (const group of groups) {
        const key = keyByStatus[group.status];
        if (key) counts[key] = group._count;
    }
    return counts;
};
