import { getPrisma } from "../../config/database.js";

// find the single current academic year (AcademicYear.isCurrent)
export const findCurrentAcademicYear = async () => {
    const db = getPrisma();
    return db.academicYear.findFirst({ where: { isCurrent: true } });
};

// find an active subject by id
export const findSubjectById = async (id) => {
    const db = getPrisma();
    return db.subject.findUnique({ where: { id } });
};

// find multiple classes by id
export const findClassesByIds = async (ids) => {
    const db = getPrisma();
    return db.class.findMany({ where: { id: { in: ids } } });
};

// find a single class by id
export const findClassById = async (id) => {
    const db = getPrisma();
    return db.class.findUnique({ where: { id } });
};

// find a teacher profile by employee number (uniqueness pre-check)
export const findTeacherByEmployeeNo = async (employeeNo) => {
    const db = getPrisma();
    return db.teacherProfile.findUnique({
        where: { employeeNo },
        select: { id: true },
    });
};

// find a user by email (uniqueness pre-check — shared across all roles)
export const findUserByEmail = async (email) => {
    const db = getPrisma();
    return db.user.findUnique({ where: { email }, select: { id: true } });
};

const listSelect = (currentAcademicYearId) => ({
    id: true,
    firstName: true,
    lastName: true,
    email: true,
    phone: true,
    gender: true,
    isActive: true,
    mustChangePassword: true,
    createdAt: true,
    teacherProfile: {
        select: {
            id: true,
            employeeNo: true,
            joinedAt: true,
            subjectAssignments: {
                where: { isActive: true, ...(currentAcademicYearId ? { academicYearId: currentAcademicYearId } : {}) },
                select: { subject: { select: { id: true, name: true } } },
                take: 1,
            },
            classesAsClassTeacher: currentAcademicYearId
                ? { where: { academicYearId: currentAcademicYearId }, select: { id: true, name: true } }
                : { select: { id: true, name: true } },
        },
    },
});

// Paginated, filterable teacher list for the admin dashboard table
// (§12/§13/§14). One findMany + one count — subject/class-teacher summary
// info comes along via the select above, no N+1.
export const findTeachersPaginated = async ({
    page, limit, q, subjectId, classId, classTeacherOnly, status, currentAcademicYearId,
}) => {
    const db = getPrisma();

    const where = {
        role: "TEACHER",
        ...(status === "active" ? { isActive: true } : status === "inactive" ? { isActive: false } : {}),
        ...(q
            ? {
                  OR: [
                      { firstName: { contains: q, mode: "insensitive" } },
                      { lastName: { contains: q, mode: "insensitive" } },
                      { email: { contains: q, mode: "insensitive" } },
                      { teacherProfile: { employeeNo: { contains: q, mode: "insensitive" } } },
                  ],
              }
            : {}),
        // subjectId/classId/classTeacherOnly all filter through the
        // teacherProfile relation — merged into ONE key so they combine
        // (AND) instead of separate `teacherProfile:` spreads colliding and
        // silently dropping all but the last one.
        ...(subjectId || classId || classTeacherOnly
            ? {
                  teacherProfile: {
                      ...(subjectId ? { subjectAssignments: { some: { subjectId, isActive: true } } } : {}),
                      ...(classId ? { teachingAssignments: { some: { classId, isActive: true } } } : {}),
                      ...(classTeacherOnly ? { classesAsClassTeacher: { some: {} } } : {}),
                  },
              }
            : {}),
    };

    const [items, total] = await Promise.all([
        db.user.findMany({
            where,
            select: listSelect(currentAcademicYearId),
            orderBy: { createdAt: "desc" },
            skip: (page - 1) * limit,
            take: limit,
        }),
        db.user.count({ where }),
    ]);

    return { items, total };
};

// Full teacher detail for the admin "view teacher" page (§15).
export const findTeacherDetailById = async (id) => {
    const db = getPrisma();
    return db.user.findFirst({
        where: { id, role: "TEACHER" },
        select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            gender: true,
            isActive: true,
            mustChangePassword: true,
            createdAt: true,
            updatedAt: true,
            teacherProfile: {
                select: {
                    id: true,
                    employeeNo: true,
                    joinedAt: true,
                    subjectAssignments: {
                        where: { isActive: true },
                        select: {
                            subject: { select: { id: true, name: true } },
                            academicYear: { select: { id: true, name: true } },
                        },
                    },
                    teachingAssignments: {
                        where: { isActive: true },
                        select: {
                            id: true,
                            subject: { select: { id: true, name: true } },
                            class: { select: { id: true, name: true } },
                            academicYear: { select: { id: true, name: true } },
                        },
                    },
                    classesAsClassTeacher: {
                        select: { id: true, name: true, academicYear: { select: { id: true, name: true } } },
                    },
                },
            },
        },
    });
};

// Currently-active TeachingAssignment classIds for a teacher — the "before"
// side of the classIds diff-sync in updateTeacherTx.
export const findActiveTeachingAssignments = async (teacherId) => {
    const db = getPrisma();
    return db.teachingAssignment.findMany({
        where: { teacherId, isActive: true },
        select: { id: true, classId: true, subjectId: true },
    });
};

// Minimal data needed to resolve a teacher's authorization scope
// (teacher.scope.js#resolveTeacherScope) — this teacher's current-year
// subject, teaching-assignment classIds, and class-teacher class, in one
// query. `currentAcademicYearId` may be null (no current year configured),
// in which case nothing is scoped to it and the sets come back empty.
export const findTeacherProfileScopeData = async (userId, currentAcademicYearId) => {
    const db = getPrisma();
    return db.teacherProfile.findUnique({
        where: { userId },
        select: {
            id: true,
            subjectAssignments: {
                where: { isActive: true, academicYearId: currentAcademicYearId ?? "__none__" },
                select: { subjectId: true },
                take: 1,
            },
            teachingAssignments: {
                where: { isActive: true, academicYearId: currentAcademicYearId ?? "__none__" },
                select: { classId: true },
            },
            classesAsClassTeacher: {
                where: { academicYearId: currentAcademicYearId ?? "__none__" },
                select: { id: true },
            },
        },
    });
};

// Applies an admin edit to a teacher (§16/§17/§18/§19):
//   1. scalar User/TeacherProfile fields
//   2. a changed subjectId updates the current year's TeacherSubjectAssignment
//      in place and ends every active TeachingAssignment (they were tied to
//      the old subject — BR-17)
//   3. a supplied classIds array is diff-synced against the active
//      TeachingAssignment set — removed classes are ended (isActive:false,
//      endedAt), added ones create new rows; never a blind delete-and-recreate
//   4. classTeacherOfId (when the key is present) assigns/moves/clears the
//      single classTeacherId slot, re-checked for conflicts inside this tx
export const updateTeacherTx = async (tx, id, data, currentAcademicYearId) => {
    const { firstName, lastName, email, phone, gender, employeeNo, joinDate, subjectId, classIds, classTeacherOfId } = data;

    const teacherProfile = await tx.teacherProfile.findUnique({ where: { userId: id }, select: { id: true } });
    const teacherId = teacherProfile.id;

    const userUpdate = {};
    if (firstName !== undefined) userUpdate.firstName = firstName;
    if (lastName !== undefined) userUpdate.lastName = lastName;
    if (email !== undefined) userUpdate.email = email;
    if (phone !== undefined) userUpdate.phone = phone;
    if (gender !== undefined) userUpdate.gender = gender;

    const profileUpdate = {};
    if (employeeNo !== undefined) profileUpdate.employeeNo = employeeNo;
    if (joinDate !== undefined) profileUpdate.joinedAt = joinDate;

    const hasProfileUpdate = Object.keys(profileUpdate).length > 0;
    if (Object.keys(userUpdate).length > 0 || hasProfileUpdate) {
        await tx.user.update({
            where: { id },
            data: { ...userUpdate, ...(hasProfileUpdate ? { teacherProfile: { update: profileUpdate } } : {}) },
        });
    }

    let effectiveSubjectId;
    let subjectChanged = false;
    if (subjectId !== undefined) {
        const currentAssignment = await tx.teacherSubjectAssignment.findUnique({
            where: { teacherId_academicYearId: { teacherId, academicYearId: currentAcademicYearId } },
        });
        if (currentAssignment) {
            if (currentAssignment.subjectId !== subjectId) {
                await tx.teacherSubjectAssignment.update({
                    where: { id: currentAssignment.id },
                    data: { subjectId },
                });
                subjectChanged = true;
            }
        } else {
            await tx.teacherSubjectAssignment.create({
                data: { teacherId, subjectId, academicYearId: currentAcademicYearId },
            });
        }
        effectiveSubjectId = subjectId;
    }

    if (subjectChanged) {
        // The teacher no longer teaches the old subject — every active
        // teaching assignment tied to it must end, regardless of what
        // classIds says (a stale assignment must never keep pointing at a
        // subject the teacher isn't assigned to any more).
        await tx.teachingAssignment.updateMany({
            where: { teacherId, isActive: true },
            data: { isActive: false, endedAt: new Date() },
        });
    }

    const needsEffectiveSubject =
        (classIds !== undefined && classIds.length > 0) ||
        (classTeacherOfId !== undefined && classTeacherOfId !== null);

    if (needsEffectiveSubject && effectiveSubjectId === undefined) {
        // classIds / a new classTeacherOfId always resolve against the
        // teacher's CURRENT subject — look it up when this update didn't
        // also change subjectId.
        const currentAssignment = await tx.teacherSubjectAssignment.findUnique({
            where: { teacherId_academicYearId: { teacherId, academicYearId: currentAcademicYearId } },
        });
        if (!currentAssignment) {
            throw Object.assign(new Error("NO_SUBJECT_ASSIGNMENT"), { code: "NO_SUBJECT_ASSIGNMENT" });
        }
        effectiveSubjectId = currentAssignment.subjectId;
    }

    if (classIds !== undefined) {
        const active = await tx.teachingAssignment.findMany({
            where: { teacherId, isActive: true },
            select: { id: true, classId: true },
        });
        const activeClassIds = new Set(active.map((a) => a.classId));
        const desiredClassIds = new Set(classIds);

        const toEnd = active.filter((a) => !desiredClassIds.has(a.classId)).map((a) => a.id);
        const toAdd = classIds.filter((c) => !activeClassIds.has(c));

        if (toEnd.length > 0) {
            await tx.teachingAssignment.updateMany({
                where: { id: { in: toEnd } },
                data: { isActive: false, endedAt: new Date() },
            });
        }
        if (toAdd.length > 0) {
            await tx.teachingAssignment.createMany({
                data: toAdd.map((classId) => ({
                    teacherId,
                    subjectId: effectiveSubjectId,
                    classId,
                    academicYearId: currentAcademicYearId,
                })),
            });
        }
    }

    if (classTeacherOfId !== undefined) {
        // Scoped to the current academic year only — Class rows from past
        // years that still point classTeacherId at this teacher are
        // historical record and must never be touched here (OD-08: a
        // class-teacher assignment only ever applies for its one year).
        if (classTeacherOfId === null) {
            await tx.class.updateMany({
                where: { classTeacherId: teacherId, academicYearId: currentAcademicYearId },
                data: { classTeacherId: null },
            });
        } else {
            const targetClass = await tx.class.findUnique({ where: { id: classTeacherOfId } });
            if (targetClass.classTeacherId && targetClass.classTeacherId !== teacherId) {
                throw Object.assign(new Error("CLASS_TEACHER_CONFLICT"), { code: "CLASS_TEACHER_CONFLICT" });
            }
            if (targetClass.classTeacherId !== teacherId) {
                // Clear whichever CURRENT-YEAR class this teacher was previously
                // responsible for before assigning the new one — a teacher is
                // class teacher of at most one class per year (BR-11).
                await tx.class.updateMany({
                    where: { classTeacherId: teacherId, academicYearId: currentAcademicYearId },
                    data: { classTeacherId: null },
                });
                await tx.class.update({
                    where: { id: classTeacherOfId },
                    data: { classTeacherId: teacherId },
                });
            }

            // OD-08/§29: a class teacher must teach their own subject to
            // their responsible class — ensure the matching TeachingAssignment
            // exists (upsert reactivates a stale ended row, matching the
            // historized pattern used by the classIds sync above).
            await tx.teachingAssignment.upsert({
                where: {
                    teacherId_subjectId_classId_academicYearId: {
                        teacherId, subjectId: effectiveSubjectId, classId: classTeacherOfId, academicYearId: currentAcademicYearId,
                    },
                },
                update: { isActive: true, endedAt: null },
                create: { teacherId, subjectId: effectiveSubjectId, classId: classTeacherOfId, academicYearId: currentAcademicYearId },
            });
        }
    }

    return tx.user.findUnique({ where: { id } });
};

// Deactivates a teacher (§22/§23): the account can no longer log in, every
// active subject/teaching assignment is ended (not deleted — history stays
// intact), the CURRENT year's class-teacher responsibility is cleared so
// that class never points at a deactivated teacher (past-year class-teacher
// history is left untouched — it's a completed academic year, not something
// that needs a replacement), and the action is audit-logged.
export const deactivateTeacherTx = async (tx, id, performedById, currentAcademicYearId) => {
    const teacherProfile = await tx.teacherProfile.findUnique({ where: { userId: id }, select: { id: true } });
    const teacherId = teacherProfile.id;

    await tx.user.update({ where: { id }, data: { isActive: false } });

    await tx.teacherSubjectAssignment.updateMany({
        where: { teacherId, isActive: true },
        data: { isActive: false, endedAt: new Date() },
    });
    await tx.teachingAssignment.updateMany({
        where: { teacherId, isActive: true },
        data: { isActive: false, endedAt: new Date() },
    });
    if (currentAcademicYearId) {
        await tx.class.updateMany({
            where: { classTeacherId: teacherId, academicYearId: currentAcademicYearId },
            data: { classTeacherId: null },
        });
    }

    await tx.auditLog.create({
        data: { action: "TEACHER_DEACTIVATED", entityType: "Teacher", entityId: id, performedById },
    });
};

// Creates the User + TeacherProfile + TeacherSubjectAssignment +
// TeachingAssignment rows (and, optionally, the class-teacher assignment)
// for a newly registered teacher, all within the caller's transaction
// (§20/§22). The classTeacherOfId null-check is re-verified here, inside
// the transaction, to close the check-then-set race (§9) — the
// @@unique([academicYearId, classTeacherId]) constraint is the DB-level
// backstop if two registrations still race.
export const createTeacherTx = async (tx, {
    username, email, passwordHash, firstName, lastName, gender,
    employeeNo, phone, joinDate, subjectId, classIds, classTeacherOfId, academicYearId,
}) => {
    // OD-08/§29: a class teacher must teach their own subject to their
    // responsible class — auto-include it in the teaching-assignment set
    // rather than allowing (or rejecting) a class-teacher slot with no
    // matching TeachingAssignment.
    const effectiveClassIds = classTeacherOfId
        ? Array.from(new Set([...classIds, classTeacherOfId]))
        : classIds;

    const teacherUser = await tx.user.create({
        data: {
            username,
            email,
            password: passwordHash,
            role: "TEACHER",
            mustChangePassword: true,
            firstName,
            lastName,
            phone,
            gender,
            teacherProfile: {
                create: {
                    employeeNo,
                    joinedAt: joinDate,
                    subjectAssignments: {
                        create: {
                            subjectId,
                            academicYearId,
                        },
                    },
                    teachingAssignments: {
                        create: effectiveClassIds.map((classId) => ({
                            subjectId,
                            classId,
                            academicYearId,
                        })),
                    },
                },
            },
        },
        include: { teacherProfile: true },
    });

    if (classTeacherOfId) {
        const currentClass = await tx.class.findUnique({ where: { id: classTeacherOfId } });
        if (currentClass.classTeacherId) {
            throw Object.assign(new Error("CLASS_TEACHER_CONFLICT"), { code: "CLASS_TEACHER_CONFLICT" });
        }
        await tx.class.update({
            where: { id: classTeacherOfId },
            data: { classTeacherId: teacherUser.teacherProfile.id },
        });
    }

    return teacherUser;
};
