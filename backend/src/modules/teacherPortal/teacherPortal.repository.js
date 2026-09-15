import { getPrisma } from "../../config/database.js";

// Students within a teacher's authorized class scope (§22) — rooted at
// User, same pattern as student.repository.js's admin list, so `id` stays
// the User id consistently across every API in this system.
export const findStudentsInClasses = async ({ classIds, page, limit }) => {
    const db = getPrisma();

    const where = { role: "STUDENT", studentProfile: { currentClassId: { in: classIds } } };

    const [items, total] = await Promise.all([
        db.user.findMany({
            where,
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                gender: true,
                studentProfile: {
                    select: {
                        admissionNumber: true,
                        currentClass: { select: { id: true, name: true } },
                    },
                },
            },
            orderBy: { firstName: "asc" },
            skip: (page - 1) * limit,
            take: limit,
        }),
        db.user.count({ where }),
    ]);

    return { items, total };
};
