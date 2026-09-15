import { getPrisma } from "../../config/database.js";

export const findAcademicYearById = async (id) => {
    const db = getPrisma();
    return db.academicYear.findUnique({ where: { id } });
};

export const findAcademicYearsPaginated = async ({ page, limit, q, status }) => {
    const db = getPrisma();

    const where = {
        ...(status === "current" ? { isCurrent: true } : {}),
        ...(q ? { name: { contains: q, mode: "insensitive" } } : {}),
    };

    const [items, total] = await Promise.all([
        db.academicYear.findMany({
            where,
            orderBy: { startDate: "desc" },
            skip: (page - 1) * limit,
            take: limit,
        }),
        db.academicYear.count({ where }),
    ]);

    return { items, total };
};

const TERM_WITH_EXAM_SELECT = {
    id: true,
    name: true,
    sequence: true,
    startDate: true,
    endDate: true,
    exam: { select: { id: true, name: true, sequence: true, startDate: true, endDate: true } },
};

// Admin "view academic year" detail — its 3 terms, each with its one exam,
// in one query.
export const findAcademicYearDetailById = async (id) => {
    const db = getPrisma();
    return db.academicYear.findUnique({
        where: { id },
        include: {
            terms: { orderBy: { sequence: "asc" }, select: TERM_WITH_EXAM_SELECT },
        },
    });
};

// Unsets isCurrent on every OTHER academic year — the singleton invariant
// isn't DB-enforced (no partial unique index), so the service clears the
// old "current" year before setting a new one, same pattern already used
// for Class.classTeacherId.
export const clearOtherCurrentYearsTx = async (tx, exceptId) => {
    await tx.academicYear.updateMany({
        where: { isCurrent: true, ...(exceptId ? { id: { not: exceptId } } : {}) },
        data: { isCurrent: false },
    });
};

// Creates the AcademicYear + its 3 Terms + their 3 Exams in one transaction
// (§5/§6/§7) — the admin never manually creates a Term or Exam.
export const createAcademicYearTx = async (tx, { name, startDate, endDate, isCurrent }) => {
    if (isCurrent) {
        await clearOtherCurrentYearsTx(tx, null);
    }

    const academicYear = await tx.academicYear.create({
        data: { name, startDate, endDate, isCurrent },
    });

    const totalMs = endDate.getTime() - startDate.getTime();
    const spanMs = Math.floor(totalMs / 3);

    for (let sequence = 1; sequence <= 3; sequence++) {
        const termStart = new Date(startDate.getTime() + spanMs * (sequence - 1));
        const termEnd = sequence === 3 ? endDate : new Date(startDate.getTime() + spanMs * sequence);

        const term = await tx.term.create({
            data: {
                academicYearId: academicYear.id,
                name: `Term ${sequence}`,
                sequence,
                startDate: termStart,
                endDate: termEnd,
            },
        });

        await tx.exam.create({
            data: {
                termId: term.id,
                name: `Term Test ${sequence}`,
                sequence,
                // startDate/endDate intentionally left unset — the admin
                // configures the exam period later via PATCH /exams/:id,
                // once the school finalizes it (§ user spec).
            },
        });
    }

    return academicYear;
};

export const updateAcademicYearTx = async (tx, id, data) => {
    if (data.isCurrent === true) {
        await clearOtherCurrentYearsTx(tx, id);
    }
    return tx.academicYear.update({ where: { id }, data });
};

export const findTermById = async (id) => {
    const db = getPrisma();
    return db.term.findUnique({ where: { id } });
};

export const findTermsByAcademicYearId = async (academicYearId) => {
    const db = getPrisma();
    return db.term.findMany({
        where: { academicYearId },
        orderBy: { sequence: "asc" },
        select: TERM_WITH_EXAM_SELECT,
    });
};

export const findTermDetailById = async (id) => {
    const db = getPrisma();
    return db.term.findUnique({ where: { id }, select: { academicYearId: true, ...TERM_WITH_EXAM_SELECT } });
};

export const updateTermRow = async (id, data) => {
    const db = getPrisma();
    return db.term.update({ where: { id }, data });
};
