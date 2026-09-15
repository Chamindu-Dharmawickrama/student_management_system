import { AppError } from "../../utils/appError.js";
import { getPrisma } from "../../config/database.js";
import { findExamDetailById, updateExamPeriodRow } from "./exam.repository.js";
import { reconcileExamMarkSheets } from "./markSheetReconciliation.js";

const toExamDetailDTO = (exam) => ({
    id: exam.id,
    name: exam.name,
    sequence: exam.sequence,
    startDate: exam.startDate,
    endDate: exam.endDate,
    // Convenience flag for the admin UI — mirrors the exact check
    // marks.service.js applies before allowing a teacher to write a mark.
    isEntryOpen: Boolean(exam.endDate) && new Date() > exam.endDate,
    term: {
        id: exam.term.id, name: exam.term.name, sequence: exam.term.sequence,
        startDate: exam.term.startDate, endDate: exam.term.endDate,
    },
    academicYear: exam.term.academicYear,
    markSheetCount: exam._count.markSheets,
});

export const getExamService = async (id) => {
    const exam = await findExamDetailById(id);
    if (!exam) {
        throw new AppError("Exam not found.", 404);
    }
    return toExamDetailDTO(exam);
};

// Sets the exam period for this term (§ user spec: "the system only needs
// to know the examination date range for each term"). Once endDate has
// passed, marks.service.js unlocks mark entry — no separate admin toggle.
export const updateExamPeriodService = async (id, { startDate, endDate }) => {
    const exam = await findExamDetailById(id);
    if (!exam) {
        throw new AppError("Exam not found.", 404);
    }

    if (startDate < exam.term.startDate || endDate > exam.term.endDate) {
        throw new AppError("The exam period must fall within its term's date range.", 400);
    }

    await updateExamPeriodRow(id, { startDate, endDate });
    return getExamService(id);
};

// POST /exams/:id/generate-marksheets (§35/§40) — thin wrapper that adds
// the audit record around the reconciliation engine.
export const generateMarkSheetsService = async (id, performedById) => {
    const result = await reconcileExamMarkSheets(id);

    const db = getPrisma();
    await db.auditLog.create({
        data: {
            action: "MARKSHEETS_GENERATED",
            entityType: "Exam",
            entityId: id,
            performedById,
            metadata: {
                markSheetsCreated: result.markSheetsCreated,
                marksCreated: result.marksCreated,
                unresolvedCount: result.unresolved.length,
            },
        },
    });

    return result;
};
