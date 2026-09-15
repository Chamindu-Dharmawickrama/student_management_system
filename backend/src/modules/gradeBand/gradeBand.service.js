import { AppError } from "../../utils/appError.js";
import {
    findGradeBandById,
    findAllGradeBands,
    findGradeBandsPaginated,
    createGradeBandRow,
    updateGradeBandRow,
    deleteGradeBandRow,
} from "./gradeBand.repository.js";
import { toGradeBandDTO } from "./gradeBand.dto.js";

const rangesOverlap = (aMin, aMax, bMin, bMax) => aMin <= bMax && bMin <= aMax;

// §29 — the new/edited range must not numerically overlap any OTHER
// existing band. `excludeId` lets update checks ignore the row being edited.
const assertNoOverlap = async (minMark, maxMark, excludeId) => {
    const bands = await findAllGradeBands();
    const conflict = bands.find(
        (b) => b.id !== excludeId && rangesOverlap(minMark, maxMark, b.minMark, b.maxMark),
    );
    if (conflict) {
        throw new AppError(
            `This range overlaps grade "${conflict.grade}" (${conflict.minMark}-${conflict.maxMark}).`,
            409,
        );
    }
};

export const createGradeBandService = async (data) => {
    await assertNoOverlap(data.minMark, data.maxMark);
    const band = await createGradeBandRow(data);
    return toGradeBandDTO(band);
};

export const listGradeBandsService = async (query) => {
    const { page, limit } = query;
    const { items, total } = await findGradeBandsPaginated({ page, limit });
    return {
        items: items.map(toGradeBandDTO),
        meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
    };
};

export const getGradeBandService = async (id) => {
    const band = await findGradeBandById(id);
    if (!band) {
        throw new AppError("Grade band not found.", 404);
    }
    return toGradeBandDTO(band);
};

export const updateGradeBandService = async (id, data) => {
    const existing = await findGradeBandById(id);
    if (!existing) {
        throw new AppError("Grade band not found.", 404);
    }

    const nextMin = data.minMark ?? existing.minMark;
    const nextMax = data.maxMark ?? existing.maxMark;
    if (data.minMark !== undefined || data.maxMark !== undefined) {
        await assertNoOverlap(nextMin, nextMax, id);
    }

    const band = await updateGradeBandRow(id, data);
    return toGradeBandDTO(band);
};

export const deleteGradeBandService = async (id) => {
    const existing = await findGradeBandById(id);
    if (!existing) {
        throw new AppError("Grade band not found.", 404);
    }
    await deleteGradeBandRow(id);
};

// §30/§31 — resolved once, at save time, and snapshotted into Mark.grade.
// Never called on read, so changing GradeBand configuration later never
// rewrites a mark that was already saved. Returns null (never throws) when
// there's no marksObtained to grade, or no band covers the value — an
// incomplete GradeBand configuration is an admin data-completeness issue,
// not a reason to block mark entry.
export const resolveGradeForMark = async (marksObtained) => {
    if (marksObtained === null || marksObtained === undefined) return null;

    const value = Number(marksObtained);
    const bands = await findAllGradeBands();
    const match = bands.find((b) => value >= b.minMark && value <= b.maxMark);
    return match?.grade ?? null;
};
