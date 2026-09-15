import { getPrisma } from "../../config/database.js";

// find an academic year by id
export const findAcademicYearById = async (id) => {
    const db = getPrisma();
    return db.academicYear.findUnique({ where: { id } });
};

// find a class by id
export const findClassById = async (id) => {
    const db = getPrisma();
    return db.class.findUnique({ where: { id } });
};

// find a student profile by admission number (uniqueness pre-check)
export const findStudentByAdmissionNumber = async (admissionNumber) => {
    const db = getPrisma();
    return db.studentProfile.findUnique({
        where: { admissionNumber },
        select: { id: true },
    });
};

// find a user by email (uniqueness pre-check — shared across all roles)
export const findUserByEmail = async (email) => {
    const db = getPrisma();
    return db.user.findUnique({ where: { email }, select: { id: true } });
};

// find an active subject by id (uniqueness/existence pre-check)
export const findSubjectById = async (id) => {
    const db = getPrisma();
    return db.subject.findUnique({ where: { id } });
};

// find a student's StudentProfile id from their User id
export const findStudentProfileId = async (userId) => {
    const db = getPrisma();
    return db.studentProfile.findUnique({ where: { userId }, select: { id: true } });
};

// A student's active subject selections for one academic year (§9) — the
// authoritative source for exam/mark eligibility, never inferred from
// GradeLevelSubjects, teaching assignments, or the student's class (§17).
export const findActiveSubjectSelections = async (studentProfileId, academicYearId) => {
    const db = getPrisma();
    return db.studentSubjectSelection.findMany({
        where: { studentId: studentProfileId, academicYearId, isActive: true },
        select: { id: true, subject: { select: { id: true, name: true, code: true } } },
    });
};

// Replaces a student's active subject-selection set for one academic year
// with `subjectIds` — diff-synced (deactivate removed, create added, leave
// unchanged alone), mirroring teacher.repository.js#updateTeacherTx's
// classIds sync. StudentSubjectSelection has no `endedAt` column, so
// isActive:false is the model's full "removed" state.
export const syncSubjectSelectionsTx = async (tx, studentProfileId, academicYearId, subjectIds) => {
    const active = await tx.studentSubjectSelection.findMany({
        where: { studentId: studentProfileId, academicYearId, isActive: true },
        select: { id: true, subjectId: true },
    });

    const activeSubjectIds = new Set(active.map((s) => s.subjectId));
    const desiredSubjectIds = new Set(subjectIds);

    const toDeactivate = active.filter((s) => !desiredSubjectIds.has(s.subjectId)).map((s) => s.id);
    const toAdd = subjectIds.filter((s) => !activeSubjectIds.has(s));

    if (toDeactivate.length > 0) {
        await tx.studentSubjectSelection.updateMany({
            where: { id: { in: toDeactivate } },
            data: { isActive: false },
        });
    }
    if (toAdd.length > 0) {
        // A previously-deactivated selection for this exact (student,
        // subject, year) can't just be re-created — the unique constraint
        // is on the triple regardless of isActive — so reactivate it if one
        // exists, otherwise create it fresh.
        for (const subjectId of toAdd) {
            await tx.studentSubjectSelection.upsert({
                where: { studentId_subjectId_academicYearId: { studentId: studentProfileId, subjectId, academicYearId } },
                update: { isActive: true },
                create: { studentId: studentProfileId, subjectId, academicYearId },
            });
        }
    }
};

// Minimal data needed to resolve a student's authorization scope
// (student.scope.js#resolveStudentScope) — their StudentProfile id, current
// class, and that class's academic year, in one query.
export const findStudentProfileScopeData = async (userId) => {
    const db = getPrisma();
    return db.studentProfile.findUnique({
        where: { userId },
        select: {
            id: true,
            currentClassId: true,
            currentClass: { select: { academicYearId: true } },
        },
    });
};

const LIST_SELECT = {
    id: true,
    firstName: true,
    lastName: true,
    email: true,
    gender: true,
    isActive: true,
    mustChangePassword: true,
    createdAt: true,
    studentProfile: {
        select: {
            admissionNumber: true,
            currentClass: {
                select: { id: true, name: true, academicYear: { select: { id: true, name: true } } },
            },
        },
    },
};

// Paginated, filterable student list for the admin dashboard table (§4/§5/§6).
// One findMany + one count — no N+1 (currentClass/academicYear come along
// via the select above in the same query).
export const findStudentsPaginated = async ({ page, limit, q, academicYearId, classId, gender, status }) => {
    const db = getPrisma();

    const where = {
        role: "STUDENT",
        ...(status === "active" ? { isActive: true } : status === "inactive" ? { isActive: false } : {}),
        ...(gender ? { gender } : {}),
        ...(q
            ? {
                  OR: [
                      { firstName: { contains: q, mode: "insensitive" } },
                      { lastName: { contains: q, mode: "insensitive" } },
                      { email: { contains: q, mode: "insensitive" } },
                      { studentProfile: { admissionNumber: { contains: q, mode: "insensitive" } } },
                  ],
              }
            : {}),
        // classId/academicYearId both filter through the studentProfile
        // relation — merged into ONE key so neither silently overwrites the
        // other (two separate `studentProfile:` spreads would collide).
        ...(classId || academicYearId
            ? {
                  studentProfile: {
                      ...(classId ? { currentClassId: classId } : {}),
                      ...(academicYearId ? { currentClass: { academicYearId } } : {}),
                  },
              }
            : {}),
    };

    const [items, total] = await Promise.all([
        db.user.findMany({
            where,
            select: LIST_SELECT,
            orderBy: { createdAt: "desc" },
            skip: (page - 1) * limit,
            take: limit,
        }),
        db.user.count({ where }),
    ]);

    return { items, total };
};

// Full student detail for the admin "view student" page (§7). Includes
// enrollment history (not just the current row) so the frontend can render
// academic progression without a second request.
export const findStudentDetailById = async (id) => {
    const db = getPrisma();
    return db.user.findFirst({
        where: { id, role: "STUDENT" },
        select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            email: true,
            dateOfBirth: true,
            gender: true,
            isActive: true,
            mustChangePassword: true,
            createdAt: true,
            updatedAt: true,
            studentProfile: {
                select: {
                    admissionNumber: true,
                    admissionDate: true,
                    guardianName: true,
                    guardianPhone: true,
                    currentClass: {
                        select: { id: true, name: true, academicYear: { select: { id: true, name: true } } },
                    },
                    enrollments: {
                        orderBy: { enrolledAt: "desc" },
                        select: {
                            id: true,
                            isCurrent: true,
                            enrolledAt: true,
                            leftAt: true,
                            class: { select: { id: true, name: true } },
                            academicYear: { select: { id: true, name: true } },
                        },
                    },
                    // Active subject selections (§9) — shown per academic year,
                    // same breadth as enrollmentHistory below, rather than
                    // assuming "current year only".
                    subjectSelections: {
                        where: { isActive: true },
                        orderBy: { selectedAt: "desc" },
                        select: {
                            id: true,
                            selectedAt: true,
                            subject: { select: { id: true, name: true, code: true } },
                            academicYear: { select: { id: true, name: true } },
                        },
                    },
                },
            },
        },
    });
};

// Applies an admin edit to a student: scalar User/StudentProfile fields,
// plus — only when both academicYearId and classId are supplied — an
// enrollment change that ends the current StudentClassEnrollment row and
// creates a new one, preserving history rather than overwriting it (§11).
export const updateStudentTx = async (tx, id, data) => {
    const {
        firstName, lastName, email, dateOfBirth, gender,
        admissionNumber, guardianName, guardianPhone, academicYearId, classId,
    } = data;

    const userUpdate = {};
    if (firstName !== undefined) userUpdate.firstName = firstName;
    if (lastName !== undefined) userUpdate.lastName = lastName;
    if (email !== undefined) userUpdate.email = email;
    if (dateOfBirth !== undefined) userUpdate.dateOfBirth = dateOfBirth;
    if (gender !== undefined) userUpdate.gender = gender;

    const profileUpdate = {};
    if (admissionNumber !== undefined) profileUpdate.admissionNumber = admissionNumber;
    if (guardianName !== undefined) profileUpdate.guardianName = guardianName;
    if (guardianPhone !== undefined) profileUpdate.guardianPhone = guardianPhone;

    if (classId !== undefined && academicYearId !== undefined) {
        profileUpdate.currentClassId = classId;
    }

    const hasProfileUpdate = Object.keys(profileUpdate).length > 0;
    if (Object.keys(userUpdate).length > 0 || hasProfileUpdate) {
        await tx.user.update({
            where: { id },
            data: {
                ...userUpdate,
                ...(hasProfileUpdate ? { studentProfile: { update: profileUpdate } } : {}),
            },
        });
    }

    if (classId !== undefined && academicYearId !== undefined) {
        const studentProfile = await tx.studentProfile.findUnique({ where: { userId: id }, select: { id: true } });
        await tx.studentClassEnrollment.updateMany({
            where: { studentId: studentProfile.id, isCurrent: true },
            data: { isCurrent: false, leftAt: new Date() },
        });
        await tx.studentClassEnrollment.create({
            data: { studentId: studentProfile.id, classId, academicYearId, isCurrent: true },
        });
    }

    return tx.user.findUnique({ where: { id } });
};

// Deactivates a student (§20/§21): the account can no longer log in, the
// current enrollment is ended (not deleted — history stays intact), and the
// action is recorded in the audit log (AuditLog's own doc comment names
// "STUDENT_DEACTIVATED" as the intended value).
export const deactivateStudentTx = async (tx, id, performedById) => {
    const studentProfile = await tx.studentProfile.findUnique({ where: { userId: id }, select: { id: true } });

    await tx.user.update({ where: { id }, data: { isActive: false } });

    await tx.studentClassEnrollment.updateMany({
        where: { studentId: studentProfile.id, isCurrent: true },
        data: { isCurrent: false, leftAt: new Date() },
    });

    await tx.studentProfile.update({ where: { userId: id }, data: { currentClassId: null } });

    await tx.auditLog.create({
        data: { action: "STUDENT_DEACTIVATED", entityType: "Student", entityId: id, performedById },
    });
};

// Creates the User + StudentProfile + StudentClassEnrollment rows — and,
// when the admin entered them on the same registration form, the initial
// StudentSubjectSelection rows — all within the caller's transaction
// (§20/§22). Nested directly in the one create (not a separate sync call):
// a brand-new student has no prior selections to diff against, so there's
// nothing to reconcile, just rows to create.
export const createStudentTx = (tx, {
    username, email, passwordHash, firstName, lastName, dateOfBirth, gender,
    admissionNumber, guardianName, guardianPhone, classId, academicYearId, subjectIds = [],
}) => {
    return tx.user.create({
        data: {
            username,
            email,
            password: passwordHash,
            role: "STUDENT",
            mustChangePassword: true,
            firstName,
            lastName,
            dateOfBirth,
            gender,
            studentProfile: {
                create: {
                    admissionNumber,
                    guardianName,
                    guardianPhone,
                    currentClassId: classId,
                    enrollments: {
                        create: {
                            classId,
                            academicYearId,
                            isCurrent: true,
                        },
                    },
                    subjectSelections: {
                        create: subjectIds.map((subjectId) => ({ subjectId, academicYearId })),
                    },
                },
            },
        },
        include: { studentProfile: { include: { subjectSelections: { include: { subject: true } } } } },
    });
};
