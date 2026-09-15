import { AppError } from "../../utils/appError.js";
import { getPrisma } from "../../config/database.js";
import {
    findAcademicYearById,
    findAcademicYearsPaginated,
    findAcademicYearDetailById,
    createAcademicYearTx,
    updateAcademicYearTx,
    findTermById,
    findTermsByAcademicYearId,
    findTermDetailById,
    updateTermRow,
} from "./academicYear.repository.js";
import { toAcademicYearListItemDTO, toAcademicYearDetailDTO, toTermListDTO, toTermDetailDTO } from "./academicYear.dto.js";

// Creates an Academic Year with its 3 Terms + 3 Exams auto-provisioned
// (§5/§6/§7) — the admin never creates a Term/Exam directly.
export const createAcademicYearService = async (data) => {
    const db = getPrisma();

    let academicYear;
    try {
        academicYear = await db.$transaction((tx) => createAcademicYearTx(tx, data));
    } catch (err) {
        if (err.code === "P2002") {
            throw new AppError("An academic year with this name already exists.", 409);
        }
        throw err;
    }

    return getAcademicYearService(academicYear.id);
};

export const listAcademicYearsService = async (query) => {
    const { page, limit, q, status } = query;

    const { items, total } = await findAcademicYearsPaginated({ page, limit, q, status });

    return {
        items: items.map(toAcademicYearListItemDTO),
        meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
    };
};

export const getAcademicYearService = async (id) => {
    const academicYear = await findAcademicYearDetailById(id);
    if (!academicYear) {
        throw new AppError("Academic year not found.", 404);
    }
    return toAcademicYearDetailDTO(academicYear);
};

// §4 "Activate/set the current academic year" — isCurrent:true clears
// every other year's flag in the same transaction (singleton, service-
// enforced — see academicYear.repository.js#clearOtherCurrentYearsTx).
export const updateAcademicYearService = async (id, data) => {
    const existing = await findAcademicYearById(id);
    if (!existing) {
        throw new AppError("Academic year not found.", 404);
    }

    const db = getPrisma();
    try {
        await db.$transaction((tx) => updateAcademicYearTx(tx, id, data));
    } catch (err) {
        if (err.code === "P2002") {
            throw new AppError("An academic year with this name already exists.", 409);
        }
        throw err;
    }

    return getAcademicYearService(id);
};

export const listTermsService = async (academicYearId) => {
    const academicYear = await findAcademicYearById(academicYearId);
    if (!academicYear) {
        throw new AppError("Academic year not found.", 404);
    }
    const terms = await findTermsByAcademicYearId(academicYearId);
    return terms.map(toTermListDTO);
};

export const getTermService = async (academicYearId, termId) => {
    const term = await findTermDetailById(termId);
    if (!term || term.academicYearId !== academicYearId) {
        throw new AppError("Term not found.", 404);
    }
    return toTermDetailDTO(term);
};

// Terms are never independently created/deleted — only their name/dates
// are editable (§6); `sequence`/`academicYearId` stay structural/immutable.
export const updateTermService = async (academicYearId, termId, data) => {
    const term = await findTermById(termId);
    if (!term || term.academicYearId !== academicYearId) {
        throw new AppError("Term not found.", 404);
    }

    await updateTermRow(termId, data);

    return getTermService(academicYearId, termId);
};
