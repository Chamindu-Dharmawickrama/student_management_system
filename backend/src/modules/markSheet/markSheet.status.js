import { AppError } from "../../utils/appError.js";

// The MarkSheet approval workflow's state machine (OD-05):
//   DRAFT -> SUBMITTED -> APPROVED | REJECTED -> LOCKED (terminal)
//   REJECTED -> SUBMITTED (teacher fixes it and resubmits)
// This is the single source of truth for what transitions are legal —
// markSheet.service.js drives the workflow off it, and marks.service.js
// (single + bulk mark entry) imports EDITABLE_MARKSHEET_STATUSES from here
// rather than duplicating the DRAFT/REJECTED check. One-directional import:
// marks -> markSheet, never the reverse.
export const MARKSHEET_TRANSITIONS = {
    DRAFT: ["SUBMITTED"],
    SUBMITTED: ["APPROVED", "REJECTED"],
    REJECTED: ["SUBMITTED"],
    APPROVED: ["LOCKED"],
    LOCKED: [],
};

// A mark sheet only accepts writes (create/update/bulk) while it's DRAFT or
// REJECTED — once SUBMITTED, a teacher can no longer silently edit it out
// from under the approval workflow.
export const EDITABLE_MARKSHEET_STATUSES = new Set(["DRAFT", "REJECTED"]);

// A mark only becomes visible to its student once the sheet has been
// reviewed and released — APPROVED or LOCKED. See
// marks.repository.js#findMarksForStudent.
export const STUDENT_VISIBLE_STATUSES = new Set(["APPROVED", "LOCKED"]);

export const assertMarkSheetEditable = (status) => {
    if (!EDITABLE_MARKSHEET_STATUSES.has(status)) {
        throw new AppError("This mark sheet has been submitted and can no longer be edited.", 409);
    }
};

export const assertTransitionAllowed = (currentStatus, targetStatus) => {
    const allowed = MARKSHEET_TRANSITIONS[currentStatus] ?? [];
    if (!allowed.includes(targetStatus)) {
        throw new AppError(
            `Cannot move this mark sheet from ${currentStatus} to ${targetStatus}.`,
            409,
            { currentStatus, targetStatus },
        );
    }
};
