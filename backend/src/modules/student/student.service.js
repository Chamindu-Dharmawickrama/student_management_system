import bcrypt from "bcrypt";
import { AppError } from "../../utils/appError.js";
import { generateTemporaryPassword, generateUniqueUsername } from "../../utils/credentials.js";
import { sendInitialCredentials } from "../email/email.service.js";
import { getPrisma } from "../../config/database.js";
import { revokeAllUserRefreshTokens } from "../auth/auth.repository.js";
import { setUserInvalidateBefore } from "../../utils/tokenBlocklist.js";
import {
    findAcademicYearById,
    findClassById,
    findStudentByAdmissionNumber,
    findUserByEmail,
    findSubjectById,
    findStudentProfileId,
    findActiveSubjectSelections,
    syncSubjectSelectionsTx,
    createStudentTx,
    findStudentsPaginated,
    findStudentDetailById,
    updateStudentTx,
    deactivateStudentTx,
} from "./student.repository.js";
import { toStudentDTO, toStudentListItemDTO, toStudentDetailDTO } from "./student.dto.js";

const SALT_ROUNDS = 12;

// Registers a student: validates the enrollment target, provisions a login
// account with a system-generated username + one-time password, records the
// enrollment, and enqueues the credential email — all as one transaction so
// a failure never leaves an unusable half-registered account (§20/§22/§30).
export const registerStudentService = async (data) => {
    const {
        firstName, lastName, email, admissionNumber, dateOfBirth, gender,
        guardianName, guardianPhone, academicYearId, classId, subjectIds,
    } = data;

    const academicYear = await findAcademicYearById(academicYearId);
    if (!academicYear) {
        throw new AppError("The selected academic year does not exist.", 404);
    }

    const targetClass = await findClassById(classId);
    if (!targetClass) {
        throw new AppError("The selected class does not exist.", 404);
    }
    if (!targetClass.isActive) {
        throw new AppError("The selected class is not active.", 400);
    }
    if (targetClass.academicYearId !== academicYearId) {
        throw new AppError("The selected class does not belong to the selected academic year.", 400);
    }

    // §9/§17 — subjects selected right here on the registration form are
    // validated exactly like a standalone PUT .../subject-selections call.
    const uniqueSubjectIds = Array.from(new Set(subjectIds));
    for (const subjectId of uniqueSubjectIds) {
        const subject = await findSubjectById(subjectId);
        if (!subject || !subject.isActive) {
            throw new AppError(`Subject ${subjectId} does not exist or is not active.`, 404);
        }
    }

    if (await findStudentByAdmissionNumber(admissionNumber)) {
        throw new AppError("A student with this admission number already exists.", 409);
    }
    if (await findUserByEmail(email)) {
        throw new AppError("This email address is already in use.", 409);
    }

    const username = await generateUniqueUsername(admissionNumber);
    const temporaryPassword = generateTemporaryPassword();
    const passwordHash = await bcrypt.hash(temporaryPassword, SALT_ROUNDS);

    const db = getPrisma();

    let student;
    try {
        student = await db.$transaction(async (tx) => {
            const created = await createStudentTx(tx, {
                username,
                email,
                passwordHash,
                firstName,
                lastName,
                dateOfBirth,
                gender,
                admissionNumber,
                guardianName,
                guardianPhone,
                classId,
                academicYearId,
                subjectIds: uniqueSubjectIds,
            });

            await sendInitialCredentials(created, temporaryPassword, "STUDENT", tx);

            return created;
        });
    } catch (err) {
        // Final backstop against a uniqueness race the pre-checks above missed.
        if (err.code === "P2002") {
            const field = err.meta?.target?.[0] ?? "field";
            throw new AppError(`This ${field} is already in use.`, 409);
        }
        throw err;
    }

    return toStudentDTO(student);
};

// Admin dashboard student list — paginated + filterable (§4/§5/§6).
export const listStudentsService = async (query) => {
    const { page, limit, q, academicYearId, classId, gender, status } = query;

    const { items, total } = await findStudentsPaginated({ page, limit, q, academicYearId, classId, gender, status });

    return {
        items: items.map(toStudentListItemDTO),
        meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
    };
};

// Admin "view student" detail (§7).
export const getStudentService = async (id) => {
    const student = await findStudentDetailById(id);
    if (!student) {
        throw new AppError("Student not found.", 404);
    }
    return toStudentDetailDTO(student);
};

// Admin student edit (§8/§9/§10/§11) — re-runs the same business validation
// as registration for any field that's actually being changed.
export const updateStudentService = async (id, data) => {
    const existing = await findStudentDetailById(id);
    if (!existing) {
        throw new AppError("Student not found.", 404);
    }

    if (data.admissionNumber !== undefined && data.admissionNumber !== existing.studentProfile.admissionNumber) {
        if (await findStudentByAdmissionNumber(data.admissionNumber)) {
            throw new AppError("A student with this admission number already exists.", 409);
        }
    }

    if (data.email !== undefined && data.email !== existing.email) {
        if (await findUserByEmail(data.email)) {
            throw new AppError("This email address is already in use.", 409);
        }
    }

    if (data.academicYearId !== undefined && data.classId !== undefined) {
        const academicYear = await findAcademicYearById(data.academicYearId);
        if (!academicYear) {
            throw new AppError("The selected academic year does not exist.", 404);
        }
        const targetClass = await findClassById(data.classId);
        if (!targetClass) {
            throw new AppError("The selected class does not exist.", 404);
        }
        if (!targetClass.isActive) {
            throw new AppError("The selected class is not active.", 400);
        }
        if (targetClass.academicYearId !== data.academicYearId) {
            throw new AppError("The selected class does not belong to the selected academic year.", 400);
        }
    }

    const db = getPrisma();
    try {
        await db.$transaction((tx) => updateStudentTx(tx, id, data));
    } catch (err) {
        if (err.code === "P2002") {
            const field = err.meta?.target?.[0] ?? "field";
            throw new AppError(`This ${field} is already in use.`, 409);
        }
        throw err;
    }

    return getStudentService(id);
};

// Admin student deactivation (§20/§21) — the account is soft-deleted
// (User.isActive=false), never hard-deleted, so academic history is never
// destroyed. Kills every existing session, same as
// profile.service.js#deleteProfileService does for self-delete.
export const deactivateStudentService = async (id, performedById) => {
    const existing = await findStudentDetailById(id);
    if (!existing) {
        throw new AppError("Student not found.", 404);
    }
    if (!existing.isActive) {
        throw new AppError("This student is already deactivated.", 409);
    }

    const db = getPrisma();
    await db.$transaction((tx) => deactivateStudentTx(tx, id, performedById));

    await revokeAllUserRefreshTokens(id);
    await setUserInvalidateBefore(id);
};

// GET /students/:id/subject-selections — the authoritative source of exam/
// mark eligibility for that student+year (§9), never inferred from
// GradeLevelSubjects or the student's class (§17).
export const getStudentSubjectSelectionsService = async (id, academicYearId) => {
    const existing = await findStudentDetailById(id);
    if (!existing) {
        throw new AppError("Student not found.", 404);
    }
    const academicYear = await findAcademicYearById(academicYearId);
    if (!academicYear) {
        throw new AppError("The selected academic year does not exist.", 404);
    }

    const profile = await findStudentProfileId(id);
    const selections = await findActiveSubjectSelections(profile.id, academicYearId);

    return selections.map((s) => ({ id: s.id, subject: s.subject }));
};

// PUT /students/:id/subject-selections — replaces the student's active
// selection set for one academic year (diff-synced, §25/§27: never
// silently deletes historical marks/marksheets that already reference a
// removed subject — only StudentSubjectSelection.isActive changes here).
export const setStudentSubjectSelectionsService = async (id, data) => {
    const existing = await findStudentDetailById(id);
    if (!existing) {
        throw new AppError("Student not found.", 404);
    }

    const academicYear = await findAcademicYearById(data.academicYearId);
    if (!academicYear) {
        throw new AppError("The selected academic year does not exist.", 404);
    }

    const uniqueSubjectIds = Array.from(new Set(data.subjectIds));
    for (const subjectId of uniqueSubjectIds) {
        const subject = await findSubjectById(subjectId);
        if (!subject || !subject.isActive) {
            throw new AppError(`Subject ${subjectId} does not exist or is not active.`, 404);
        }
    }

    const profile = await findStudentProfileId(id);
    const db = getPrisma();
    await db.$transaction((tx) => syncSubjectSelectionsTx(tx, profile.id, data.academicYearId, uniqueSubjectIds));

    return getStudentSubjectSelectionsService(id, data.academicYearId);
};
