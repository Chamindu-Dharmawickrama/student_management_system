import bcrypt from "bcrypt";
import { AppError } from "../../utils/appError.js";
import { generateTemporaryPassword, generateUniqueUsername } from "../../utils/credentials.js";
import { sendInitialCredentials } from "../email/email.service.js";
import { getPrisma } from "../../config/database.js";
import { revokeAllUserRefreshTokens } from "../auth/auth.repository.js";
import { setUserInvalidateBefore } from "../../utils/tokenBlocklist.js";
import {
    findCurrentAcademicYear,
    findSubjectById,
    findClassesByIds,
    findClassById,
    findTeacherByEmployeeNo,
    findUserByEmail,
    createTeacherTx,
    findTeachersPaginated,
    findTeacherDetailById,
    updateTeacherTx,
    deactivateTeacherTx,
} from "./teacher.repository.js";
import { toTeacherDTO, toTeacherListItemDTO, toTeacherDetailDTO } from "./teacher.dto.js";

const SALT_ROUNDS = 12;

// Registers a teacher: validates the subject + (optional) class assignments
// against the current academic year, provisions a login account with a
// system-generated username + one-time password, records the teaching /
// class-teacher assignments, and enqueues the credential email — all as one
// transaction (§20/§22/§31).
export const registerTeacherService = async (data) => {
    const {
        firstName, lastName, email, employeeNo, phone, gender, joinDate,
        subjectId, classIds, classTeacherOfId,
    } = data;

    const academicYear = await findCurrentAcademicYear();
    if (!academicYear) {
        throw new AppError("No current academic year is configured. Contact a system administrator.", 400);
    }

    const subject = await findSubjectById(subjectId);
    if (!subject || !subject.isActive) {
        throw new AppError("The selected subject does not exist.", 404);
    }

    if (classIds.length > 0) {
        const classes = await findClassesByIds(classIds);
        if (classes.length !== classIds.length) {
            throw new AppError("One or more selected classes do not exist.", 404);
        }
        const inactive = classes.find((c) => !c.isActive);
        if (inactive) {
            throw new AppError("One or more selected classes are not active.", 400);
        }
        const wrongYear = classes.find((c) => c.academicYearId !== academicYear.id);
        if (wrongYear) {
            throw new AppError("All selected classes must belong to the current academic year.", 400);
        }
    }

    if (classTeacherOfId) {
        const targetClass = await findClassById(classTeacherOfId);
        if (!targetClass) {
            throw new AppError("The selected class-teacher class does not exist.", 404);
        }
        if (!targetClass.isActive) {
            throw new AppError("The selected class-teacher class is not active.", 400);
        }
        if (targetClass.academicYearId !== academicYear.id) {
            throw new AppError("The class-teacher class must belong to the current academic year.", 400);
        }
        if (targetClass.classTeacherId) {
            throw new AppError("This class already has an active class teacher.", 409);
        }
    }

    if (await findTeacherByEmployeeNo(employeeNo)) {
        throw new AppError("A teacher with this employee number already exists.", 409);
    }
    if (await findUserByEmail(email)) {
        throw new AppError("This email address is already in use.", 409);
    }

    const username = await generateUniqueUsername(employeeNo);
    const temporaryPassword = generateTemporaryPassword();
    const passwordHash = await bcrypt.hash(temporaryPassword, SALT_ROUNDS);

    const db = getPrisma();

    let teacher;
    try {
        teacher = await db.$transaction(async (tx) => {
            const created = await createTeacherTx(tx, {
                username,
                email,
                passwordHash,
                firstName,
                lastName,
                phone,
                gender,
                employeeNo,
                joinDate,
                subjectId,
                classIds,
                classTeacherOfId,
                academicYearId: academicYear.id,
            });

            console.log(`--- UserName: ${created.username}, password: ${temporaryPassword} ---`); // For debugging only; remove in production.

            await sendInitialCredentials(created, temporaryPassword, "TEACHER", tx);

            return created;
        });
    } catch (err) {
        if (err.code === "CLASS_TEACHER_CONFLICT") {
            throw new AppError("This class already has an active class teacher.", 409);
        }
        // Final backstop against a uniqueness race the pre-checks above missed.
        if (err.code === "P2002") {
            const field = err.meta?.target?.[0] ?? "field";
            throw new AppError(`This ${field} is already in use.`, 409);
        }
        throw err;
    }

    return toTeacherDTO(teacher);
};

// Admin dashboard teacher list — paginated + filterable (§12/§13/§14).
export const listTeachersService = async (query) => {
    const { page, limit, q, subjectId, classId, classTeacherOnly, status } = query;

    const currentAcademicYear = await findCurrentAcademicYear();

    const { items, total } = await findTeachersPaginated({
        page, limit, q, subjectId, classId, classTeacherOnly, status,
        currentAcademicYearId: currentAcademicYear?.id,
    });

    return {
        items: items.map(toTeacherListItemDTO),
        meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
    };
};

// Admin "view teacher" detail (§15).
export const getTeacherService = async (id) => {
    const teacher = await findTeacherDetailById(id);
    if (!teacher) {
        throw new AppError("Teacher not found.", 404);
    }
    return toTeacherDetailDTO(teacher);
};

// Admin teacher edit (§16/§17/§18/§19) — re-runs the same business
// validation as registration for any field that's actually being changed,
// all scoped to the current academic year (matching registration's own
// "use the current year automatically" rule).
export const updateTeacherService = async (id, data) => {
    const existing = await findTeacherDetailById(id);
    if (!existing) {
        throw new AppError("Teacher not found.", 404);
    }

    const currentAcademicYear = await findCurrentAcademicYear();
    if (!currentAcademicYear) {
        throw new AppError("No current academic year is configured. Contact a system administrator.", 400);
    }

    if (data.employeeNo !== undefined && data.employeeNo !== existing.teacherProfile.employeeNo) {
        if (await findTeacherByEmployeeNo(data.employeeNo)) {
            throw new AppError("A teacher with this employee number already exists.", 409);
        }
    }

    if (data.email !== undefined && data.email !== existing.email) {
        if (await findUserByEmail(data.email)) {
            throw new AppError("This email address is already in use.", 409);
        }
    }

    if (data.subjectId !== undefined) {
        const subject = await findSubjectById(data.subjectId);
        if (!subject || !subject.isActive) {
            throw new AppError("The selected subject does not exist.", 404);
        }
    }

    if (data.classIds !== undefined && data.classIds.length > 0) {
        const classes = await findClassesByIds(data.classIds);
        if (classes.length !== data.classIds.length) {
            throw new AppError("One or more selected classes do not exist.", 404);
        }
        const inactive = classes.find((c) => !c.isActive);
        if (inactive) {
            throw new AppError("One or more selected classes are not active.", 400);
        }
        const wrongYear = classes.find((c) => c.academicYearId !== currentAcademicYear.id);
        if (wrongYear) {
            throw new AppError("All selected classes must belong to the current academic year.", 400);
        }
    }

    if (data.classTeacherOfId) {
        const targetClass = await findClassById(data.classTeacherOfId);
        if (!targetClass) {
            throw new AppError("The selected class-teacher class does not exist.", 404);
        }
        if (!targetClass.isActive) {
            throw new AppError("The selected class-teacher class is not active.", 400);
        }
        if (targetClass.academicYearId !== currentAcademicYear.id) {
            throw new AppError("The class-teacher class must belong to the current academic year.", 400);
        }
    }

    const db = getPrisma();
    try {
        await db.$transaction((tx) => updateTeacherTx(tx, id, data, currentAcademicYear.id));
    } catch (err) {
        if (err.code === "CLASS_TEACHER_CONFLICT") {
            throw new AppError("This class already has an active class teacher.", 409);
        }
        if (err.code === "NO_SUBJECT_ASSIGNMENT") {
            throw new AppError("This teacher has no subject assignment for the current academic year yet — set subjectId first.", 400);
        }
        if (err.code === "P2002") {
            const field = err.meta?.target?.[0] ?? "field";
            throw new AppError(`This ${field} is already in use.`, 409);
        }
        throw err;
    }

    return getTeacherService(id);
};

// Admin teacher deactivation (§22/§23) — soft-deleted via User.isActive,
// never hard-deleted (a hard delete would be rejected by the DB anyway the
// moment the teacher owns a mark sheet or is a class teacher, since neither
// relation cascades). Ends every active assignment, clears the current
// year's class-teacher slot, and kills every existing session.
export const deactivateTeacherService = async (id, performedById) => {
    const existing = await findTeacherDetailById(id);
    if (!existing) {
        throw new AppError("Teacher not found.", 404);
    }
    if (!existing.isActive) {
        throw new AppError("This teacher is already deactivated.", 409);
    }

    const currentAcademicYear = await findCurrentAcademicYear();

    const db = getPrisma();
    await db.$transaction((tx) => deactivateTeacherTx(tx, id, performedById, currentAcademicYear?.id));

    await revokeAllUserRefreshTokens(id);
    await setUserInvalidateBefore(id);
};
