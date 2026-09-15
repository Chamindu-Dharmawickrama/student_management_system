import { getPrisma } from "../../config/database.js";

// Case-insensitive uniqueness pre-checks (§5: "Mathematics"/"mathematics"/
// "MATHEMATICS" must be treated as the same subject) — Postgres' default
// collation compares `name`/`code` case-sensitively, so the `@unique`
// columns alone only catch exact-case duplicates. `excludeId` lets update
// checks ignore the row being edited.
export const findSubjectByNameCI = async (name, excludeId) => {
    const db = getPrisma();
    return db.subject.findFirst({
        where: { name: { equals: name, mode: "insensitive" }, ...(excludeId ? { id: { not: excludeId } } : {}) },
        select: { id: true },
    });
};

export const findSubjectByCodeCI = async (code, excludeId) => {
    const db = getPrisma();
    return db.subject.findFirst({
        where: { code: { equals: code, mode: "insensitive" }, ...(excludeId ? { id: { not: excludeId } } : {}) },
        select: { id: true },
    });
};

export const findSubjectById = async (id) => {
    const db = getPrisma();
    return db.subject.findUnique({ where: { id } });
};

// Paginated, filterable subject list for the admin dashboard table (§6).
export const findSubjectsPaginated = async ({ page, limit, q, status }) => {
    const db = getPrisma();

    const where = {
        ...(status === "active" ? { isActive: true } : status === "inactive" ? { isActive: false } : {}),
        ...(q
            ? {
                  OR: [
                      { name: { contains: q, mode: "insensitive" } },
                      { code: { contains: q, mode: "insensitive" } },
                  ],
              }
            : {}),
    };

    const [items, total] = await Promise.all([
        db.subject.findMany({
            where,
            orderBy: { name: "asc" },
            skip: (page - 1) * limit,
            take: limit,
        }),
        db.subject.count({ where }),
    ]);

    return { items, total };
};

// Admin "view subject" detail (§7) — counts, not full lists, of active
// teachers/teaching assignments, in the same query as the subject itself.
export const findSubjectDetailById = async (id) => {
    const db = getPrisma();
    return db.subject.findUnique({
        where: { id },
        include: {
            _count: {
                select: {
                    teacherSubjectAssignments: { where: { isActive: true } },
                    teachingAssignments: { where: { isActive: true } },
                },
            },
        },
    });
};

export const createSubjectRow = async ({ name, code, isActive }) => {
    const db = getPrisma();
    return db.subject.create({ data: { name, code, isActive } });
};

export const updateSubjectRow = async (id, data) => {
    const db = getPrisma();
    return db.subject.update({ where: { id }, data });
};

// One query, every reference the delete rule cares about (§10/§11) — any
// non-zero count means the subject has been used and must be deactivated,
// never hard-deleted (Subject's own doc comment: "BR-05: deactivate, never
// physically delete once referenced").
export const countSubjectReferences = async (id) => {
    const db = getPrisma();
    const [teacherSubjectAssignments, teachingAssignments, studentSubjectSelections, markSheets] = await Promise.all([
        db.teacherSubjectAssignment.count({ where: { subjectId: id } }),
        db.teachingAssignment.count({ where: { subjectId: id } }),
        db.studentSubjectSelection.count({ where: { subjectId: id } }),
        db.markSheet.count({ where: { subjectId: id } }),
    ]);
    return teacherSubjectAssignments + teachingAssignments + studentSubjectSelections + markSheets;
};

export const deactivateSubjectRow = async (id) => {
    const db = getPrisma();
    return db.subject.update({ where: { id }, data: { isActive: false } });
};

export const hardDeleteSubjectRow = async (id) => {
    const db = getPrisma();
    return db.subject.delete({ where: { id } });
};
