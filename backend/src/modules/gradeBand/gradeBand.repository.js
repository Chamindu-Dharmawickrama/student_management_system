import { getPrisma } from "../../config/database.js";

export const findGradeBandById = async (id) => {
    const db = getPrisma();
    return db.gradeBand.findUnique({ where: { id } });
};

// All bands, ordered by range — used both for the overlap check and for
// resolving a mark's grade (gradeBand.service.js#resolveGradeForMark).
// The table is small (a handful of rows, school-wide) so loading it whole
// is cheap and simpler than a per-mark range query.
export const findAllGradeBands = async () => {
    const db = getPrisma();
    return db.gradeBand.findMany({ orderBy: { minMark: "asc" } });
};

export const findGradeBandsPaginated = async ({ page, limit }) => {
    const db = getPrisma();
    const [items, total] = await Promise.all([
        db.gradeBand.findMany({ orderBy: { minMark: "asc" }, skip: (page - 1) * limit, take: limit }),
        db.gradeBand.count(),
    ]);
    return { items, total };
};

export const createGradeBandRow = async (data) => {
    const db = getPrisma();
    return db.gradeBand.create({ data });
};

export const updateGradeBandRow = async (id, data) => {
    const db = getPrisma();
    return db.gradeBand.update({ where: { id }, data });
};

// Nothing FKs into GradeBand (Mark.grade is a plain string snapshot, not a
// relation — schema.prisma:469) so this is always a safe plain delete.
export const deleteGradeBandRow = async (id) => {
    const db = getPrisma();
    return db.gradeBand.delete({ where: { id } });
};
