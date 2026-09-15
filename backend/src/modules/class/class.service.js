import { AppError } from "../../utils/appError.js";
import { getPrisma } from "../../config/database.js";
import {
    findSchoolConfig,
    findGradeLevelByLevel,
    createGradeLevelRow,
    findAcademicYearById,
    findClassById,
    findClassByNameInContextCI,
    findClassesPaginated,
    findClassDetailById,
    countClassReferences,
    countCurrentlyEnrolledStudents,
    createClassRow,
    updateClassRow,
    deactivateClassTx,
    hardDeleteClassRow,
} from "./class.repository.js";
import { toClassListItemDTO, toClassDetailDTO } from "./class.dto.js";

// GradeLevel is a small, near-static reference set (schema.prisma:226-233)
// — not an admin-authored entity with its own CRUD surface. Resolves the
// admin-supplied grade number against SchoolConfig's configured range
// (default 6-13 if no SchoolConfig row exists yet) and finds-or-creates
// the matching GradeLevel row.
const resolveGradeLevel = async (level) => {
    const config = await findSchoolConfig();
    const min = config?.minGradeLevel ?? 6;
    const max = config?.maxGradeLevel ?? 13;

    if (level < min || level > max) {
        throw new AppError(`Grade level must be between ${min} and ${max}.`, 400);
    }

    const existing = await findGradeLevelByLevel(level);
    if (existing) return existing;

    return createGradeLevelRow(level, `Grade ${level}`);
};

// Creates a class (§13/§14).
export const createClassService = async (data) => {
    const { name, gradeLevel, academicYearId, isActive } = data;

    const academicYear = await findAcademicYearById(academicYearId);
    if (!academicYear) {
        throw new AppError("The selected academic year does not exist.", 404);
    }

    const gradeLevelRow = await resolveGradeLevel(gradeLevel);

    if (await findClassByNameInContextCI(academicYearId, gradeLevelRow.id, name)) {
        throw new AppError("A class with this name already exists for this grade and academic year.", 409);
    }

    let klass;
    try {
        klass = await createClassRow({ name, gradeLevelId: gradeLevelRow.id, academicYearId, isActive });
    } catch (err) {
        if (err.code === "P2002") {
            throw new AppError("A class with this name already exists for this grade and academic year.", 409);
        }
        throw err;
    }

    return toClassDetailDTO({
        ...klass,
        gradeLevel: { id: gradeLevelRow.id, level: gradeLevelRow.level, name: gradeLevelRow.name },
        academicYear: { id: academicYear.id, name: academicYear.name },
        classTeacher: null,
        teachingAssignments: [],
        _count: { currentStudents: 0 },
    });
};

// Admin dashboard class list (§15/§16).
export const listClassesService = async (query) => {
    const { page, limit, q, academicYearId, gradeLevel, status } = query;

    const { items, total } = await findClassesPaginated({ page, limit, q, academicYearId, gradeLevel, status });

    return {
        items: items.map(toClassListItemDTO),
        meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
    };
};

// Admin "view class" detail (§17).
export const getClassService = async (id) => {
    const klass = await findClassDetailById(id);
    if (!klass) {
        throw new AppError("Class not found.", 404);
    }
    return toClassDetailDTO(klass);
};

// Admin class edit (§18/§19) — `name`/`isActive` are always editable;
// `academicYearId`/`gradeLevel` are structural identity fields and are
// rejected once the class has any enrollment/mark/report history, since
// silently moving a class that already has historical data into a
// different year/grade would misrepresent that history (§22).
export const updateClassService = async (id, data) => {
    const existing = await findClassById(id);
    if (!existing) {
        throw new AppError("Class not found.", 404);
    }

    const changingIdentity = data.academicYearId !== undefined || data.gradeLevel !== undefined;
    if (changingIdentity) {
        const referenceCount = await countClassReferences(id);
        if (referenceCount > 0) {
            throw new AppError(
                "Cannot change the academic year or grade of a class that already has enrollment or academic history.",
                409,
            );
        }
    }

    const nextAcademicYearId = data.academicYearId ?? existing.academicYearId;
    let nextGradeLevelId = existing.gradeLevelId;

    if (data.academicYearId !== undefined) {
        const academicYear = await findAcademicYearById(data.academicYearId);
        if (!academicYear) {
            throw new AppError("The selected academic year does not exist.", 404);
        }
    }
    if (data.gradeLevel !== undefined) {
        const gradeLevelRow = await resolveGradeLevel(data.gradeLevel);
        nextGradeLevelId = gradeLevelRow.id;
    }

    if (data.name !== undefined || changingIdentity) {
        const nextName = data.name ?? existing.name;
        if (await findClassByNameInContextCI(nextAcademicYearId, nextGradeLevelId, nextName, id)) {
            throw new AppError("A class with this name already exists for this grade and academic year.", 409);
        }
    }

    const updateData = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.academicYearId !== undefined) updateData.academicYearId = data.academicYearId;
    if (nextGradeLevelId !== existing.gradeLevelId) updateData.gradeLevelId = nextGradeLevelId;

    try {
        await updateClassRow(id, updateData);
    } catch (err) {
        if (err.code === "P2002") {
            throw new AppError("A class with this name already exists for this grade and academic year.", 409);
        }
        throw err;
    }

    return getClassService(id);
};

// Admin class removal (§20/§21/§23/§24/§25) — three tiers:
//   1. currently-enrolled students exist → reject; admin must move them first.
//   2. no current students, but historical enrollment/marks/reports exist →
//      deactivate (ends active TeachingAssignments, clears classTeacherId).
//   3. no references at all → hard delete (only TeachingAssignment cascades,
//      and there are none left to cascade by definition).
export const deleteClassService = async (id) => {
    const existing = await findClassById(id);
    if (!existing) {
        throw new AppError("Class not found.", 404);
    }
    if (!existing.isActive) {
        throw new AppError("This class is already deactivated.", 409);
    }

    const currentlyEnrolled = await countCurrentlyEnrolledStudents(id);
    if (currentlyEnrolled > 0) {
        throw new AppError(
            "Cannot remove a class with currently enrolled students — reassign them to another class first.",
            409,
        );
    }

    const referenceCount = await countClassReferences(id);

    const db = getPrisma();

    if (referenceCount > 0) {
        await db.$transaction((tx) => deactivateClassTx(tx, id));
        return { id, isActive: false, hardDeleted: false };
    }

    await hardDeleteClassRow(id);
    return { id, isActive: false, hardDeleted: true };
};
