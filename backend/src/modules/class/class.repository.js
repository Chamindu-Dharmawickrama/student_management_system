import { getPrisma } from "../../config/database.js";

// find the single SchoolConfig row (singleton table) — used to validate
// the admin-supplied gradeLevel against the school's configured range.
export const findSchoolConfig = async () => {
    const db = getPrisma();
    return db.schoolConfig.findFirst();
};

export const findGradeLevelByLevel = async (level) => {
    const db = getPrisma();
    return db.gradeLevel.findUnique({ where: { level } });
};

export const createGradeLevelRow = async (level, name) => {
    const db = getPrisma();
    return db.gradeLevel.create({ data: { level, name } });
};

export const findAcademicYearById = async (id) => {
    const db = getPrisma();
    return db.academicYear.findUnique({ where: { id } });
};

export const findClassById = async (id) => {
    const db = getPrisma();
    return db.class.findUnique({ where: { id } });
};

// Case-insensitive uniqueness pre-check for a class name within its
// academic-year + grade-level context — the exact-case backstop is the
// existing `@@unique([academicYearId, gradeLevelId, name])` constraint.
export const findClassByNameInContextCI = async (academicYearId, gradeLevelId, name, excludeId) => {
    const db = getPrisma();
    return db.class.findFirst({
        where: {
            academicYearId,
            gradeLevelId,
            name: { equals: name, mode: "insensitive" },
            ...(excludeId ? { id: { not: excludeId } } : {}),
        },
        select: { id: true },
    });
};

const LIST_SELECT = {
    id: true,
    name: true,
    isActive: true,
    gradeLevel: { select: { id: true, level: true, name: true } },
    academicYear: { select: { id: true, name: true } },
    classTeacher: {
        select: { id: true, user: { select: { id: true, firstName: true, lastName: true } } },
    },
};

// Paginated, filterable class list for the admin dashboard table (§15/§16).
export const findClassesPaginated = async ({ page, limit, q, academicYearId, gradeLevel, status }) => {
    const db = getPrisma();

    const where = {
        ...(status === "active" ? { isActive: true } : status === "inactive" ? { isActive: false } : {}),
        ...(q ? { name: { contains: q, mode: "insensitive" } } : {}),
        ...(academicYearId ? { academicYearId } : {}),
        ...(gradeLevel ? { gradeLevel: { level: gradeLevel } } : {}),
    };

    const [items, total] = await Promise.all([
        db.class.findMany({
            where,
            select: LIST_SELECT,
            orderBy: [{ academicYear: { name: "desc" } }, { name: "asc" }],
            skip: (page - 1) * limit,
            take: limit,
        }),
        db.class.count({ where }),
    ]);

    return { items, total };
};

// Admin "view class" detail (§17) — class-teacher brief info, active
// teaching assignments (subject + teacher), and a student-count via
// `_count` rather than loading the full roster.
export const findClassDetailById = async (id) => {
    const db = getPrisma();
    return db.class.findUnique({
        where: { id },
        select: {
            ...LIST_SELECT,
            teachingAssignments: {
                where: { isActive: true },
                select: {
                    id: true,
                    subject: { select: { id: true, name: true } },
                    teacher: { select: { id: true, user: { select: { id: true, firstName: true, lastName: true } } } },
                },
            },
            _count: { select: { currentStudents: true } },
        },
    });
};

export const createClassRow = async ({ name, gradeLevelId, academicYearId, isActive }) => {
    const db = getPrisma();
    return db.class.create({ data: { name, gradeLevelId, academicYearId, isActive } });
};

export const updateClassRow = async (id, data) => {
    const db = getPrisma();
    return db.class.update({ where: { id }, data });
};

// Everything counted here is a Restrict-onDelete relation into Class
// (schema.prisma: StudentClassEnrollment.class, MarkSheet.class,
// Report.class) — any non-zero count means the class has real academic
// history and can never be hard-deleted, only deactivated.
export const countClassReferences = async (id) => {
    const db = getPrisma();
    const [enrollments, markSheets, reports] = await Promise.all([
        db.studentClassEnrollment.count({ where: { classId: id } }),
        db.markSheet.count({ where: { classId: id } }),
        db.report.count({ where: { classId: id } }),
    ]);
    return enrollments + markSheets + reports;
};

// Students whose *current* enrollment points at this class — the harder
// stop for deletion (§23): the admin must move them out first.
export const countCurrentlyEnrolledStudents = async (id) => {
    const db = getPrisma();
    return db.studentProfile.count({ where: { currentClassId: id } });
};

// Deactivates a class (§20/§21): the class can no longer be selected as an
// enrollment/teaching target (student.service.js / teacher.service.js both
// check `isActive`), every active TeachingAssignment for it is ended (not
// deleted — history stays intact), and its class-teacher slot is cleared —
// mirroring teacher.repository.js#deactivateTeacherTx from the other
// direction, and closing the authorization gap where resolveTeacherScope
// would otherwise keep granting mark-entry scope for a "removed" class.
export const deactivateClassTx = async (tx, id) => {
    await tx.class.update({ where: { id }, data: { isActive: false, classTeacherId: null } });
    await tx.teachingAssignment.updateMany({
        where: { classId: id, isActive: true },
        data: { isActive: false, endedAt: new Date() },
    });
};

export const hardDeleteClassRow = async (id) => {
    const db = getPrisma();
    return db.class.delete({ where: { id } });
};
