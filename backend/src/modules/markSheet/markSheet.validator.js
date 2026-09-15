import { z } from "zod";

const pagination = {
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(20),
};

// GET /marksheets — TEACHER sees only their own (scope-derived); SCHOOL_ADMIN
// sees everything. Filters are ANDed onto whatever scope applies.
export const listMarkSheetsQuerySchema = z.object({
    query: z.object({
        ...pagination,
        examId: z.string().trim().min(1).optional(),
        termId: z.string().trim().min(1).optional(),
        classId: z.string().trim().min(1).optional(),
        subjectId: z.string().trim().min(1).optional(),
        academicYearId: z.string().trim().min(1).optional(),
        status: z.enum(["DRAFT", "SUBMITTED", "APPROVED", "REJECTED", "LOCKED"]).optional(),
    }),
});

// POST /marksheets/:id/reject
export const rejectMarkSheetSchema = z.object({
    body: z.object({
        reason: z.string().trim().min(1, "A rejection reason is required.").max(500),
    }),
});
