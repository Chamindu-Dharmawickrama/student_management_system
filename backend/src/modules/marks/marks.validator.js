import { z } from "zod";

const marksObtained = z.coerce.number().min(0, "Marks cannot be negative.").max(100, "Marks cannot exceed 100.");

const pagination = {
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(20),
};

// POST /teacher/marks — deliberately NO subjectId/classId/teacherId here
// (§9/§23): the subject is always the authenticated teacher's own subject
// and the class is always derived from the student's current enrollment,
// resolved server-side in marks.service.js — never trusted from the client.
export const createMarkSchema = z.object({
    body: z
        .object({
            studentId: z.string().trim().min(1, "Student is required."),
            examId: z.string().trim().min(1, "Exam is required."),
            isAbsent: z.boolean().optional().default(false),
            marksObtained: marksObtained.optional(),
            remarks: z.string().trim().max(500).optional(),
        })
        .refine((data) => data.isAbsent || data.marksObtained !== undefined, {
            message: "marksObtained is required unless isAbsent is true.",
            path: ["marksObtained"],
        }),
});

// PATCH /teacher/marks/:markId
export const updateMarkSchema = z.object({
    body: z
        .object({
            isAbsent: z.boolean().optional(),
            marksObtained: marksObtained.optional(),
            remarks: z.string().trim().max(500).nullable().optional(),
        })
        .refine(
            (data) => Object.values(data).some((v) => v !== undefined),
            "At least one field must be provided.",
        ),
});

// GET /teacher/marks — filters are ANDed onto the teacher's authorized
// scope server-side (marks.repository.js), never used to expand it (§21).
export const teacherMarksQuerySchema = z.object({
    query: z.object({
        ...pagination,
        classId: z.string().trim().min(1).optional(),
        subjectId: z.string().trim().min(1).optional(),
        examId: z.string().trim().min(1).optional(),
        termId: z.string().trim().min(1).optional(),
        studentId: z.string().trim().min(1).optional(),
    }),
});

// GET /student/me/marks — narrows the student's own marks only.
// `termId` lets the student view marks for one term at a time (the school
// has 3 terms per academic year, each with exactly one exam).
export const studentMarksQuerySchema = z.object({
    query: z.object({
        ...pagination,
        subjectId: z.string().trim().min(1).optional(),
        academicYearId: z.string().trim().min(1).optional(),
        examId: z.string().trim().min(1).optional(),
        termId: z.string().trim().min(1).optional(),
    }),
});
