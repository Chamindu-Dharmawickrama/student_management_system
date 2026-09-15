import { AppError } from "../../utils/appError.js";
import {
    findSubjectByNameCI,
    findSubjectByCodeCI,
    findSubjectById,
    findSubjectsPaginated,
    findSubjectDetailById,
    createSubjectRow,
    updateSubjectRow,
    countSubjectReferences,
    deactivateSubjectRow,
    hardDeleteSubjectRow,
} from "./subject.repository.js";
import { toSubjectListItemDTO, toSubjectDetailDTO } from "./subject.dto.js";

// Creates a subject — case-insensitive name/code uniqueness (§5), exact-case
// `@unique` columns in the schema are the final backstop against a race.
export const createSubjectService = async (data) => {
    const { name, code, isActive } = data;

    if (await findSubjectByNameCI(name)) {
        throw new AppError("A subject with this name already exists.", 409);
    }
    if (code && (await findSubjectByCodeCI(code))) {
        throw new AppError("A subject with this code already exists.", 409);
    }

    let subject;
    try {
        subject = await createSubjectRow({ name, code, isActive });
    } catch (err) {
        if (err.code === "P2002") {
            const field = err.meta?.target?.[0] ?? "field";
            throw new AppError(`A subject with this ${field} already exists.`, 409);
        }
        throw err;
    }

    return toSubjectDetailDTO({ ...subject, _count: { teacherSubjectAssignments: 0, teachingAssignments: 0 } });
};

// Admin dashboard subject list (§6).
export const listSubjectsService = async (query) => {
    const { page, limit, q, status } = query;

    const { items, total } = await findSubjectsPaginated({ page, limit, q, status });

    return {
        items: items.map(toSubjectListItemDTO),
        meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
    };
};

// Admin "view subject" detail (§7).
export const getSubjectService = async (id) => {
    const subject = await findSubjectDetailById(id);
    if (!subject) {
        throw new AppError("Subject not found.", 404);
    }
    return toSubjectDetailDTO(subject);
};

// Admin subject edit (§8/§9) — name/code uniqueness re-checked only when
// actually changing. Renaming a subject never breaks the relationships
// pointing at its id, so no dependency check is needed here (unlike Class).
export const updateSubjectService = async (id, data) => {
    const existing = await findSubjectById(id);
    if (!existing) {
        throw new AppError("Subject not found.", 404);
    }

    if (data.name !== undefined && data.name !== existing.name) {
        if (await findSubjectByNameCI(data.name, id)) {
            throw new AppError("A subject with this name already exists.", 409);
        }
    }
    if (data.code !== undefined && data.code !== null && data.code !== existing.code) {
        if (await findSubjectByCodeCI(data.code, id)) {
            throw new AppError("A subject with this code already exists.", 409);
        }
    }

    try {
        await updateSubjectRow(id, data);
    } catch (err) {
        if (err.code === "P2002") {
            const field = err.meta?.target?.[0] ?? "field";
            throw new AppError(`A subject with this ${field} already exists.`, 409);
        }
        throw err;
    }

    return getSubjectService(id);
};

// Admin subject removal (§10/§11) — deactivate (never hard-delete) once a
// subject has ever been referenced by a teacher, assignment, selection, or
// mark sheet; hard-delete only when it has no references at all, per
// Subject's own schema comment ("BR-05: deactivate, never physically
// delete once referenced").
export const deleteSubjectService = async (id) => {
    const existing = await findSubjectById(id);
    if (!existing) {
        throw new AppError("Subject not found.", 404);
    }
    if (!existing.isActive) {
        throw new AppError("This subject is already deactivated.", 409);
    }

    const referenceCount = await countSubjectReferences(id);

    if (referenceCount > 0) {
        await deactivateSubjectRow(id);
        return { id, isActive: false, hardDeleted: false };
    }

    await hardDeleteSubjectRow(id);
    return { id, isActive: false, hardDeleted: true };
};
