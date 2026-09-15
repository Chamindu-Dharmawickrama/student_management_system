import { z } from "zod";

const format = z.enum(["json", "pdf", "excel"]).optional().default("json");

// GET /reports/student/:studentId/term/:termId
export const studentTermReportSchema = z.object({
    params: z.object({
        studentId: z.string().trim().min(1, "Student is required."),
        termId: z.string().trim().min(1, "Term is required."),
    }),
    query: z.object({ format }),
});

// GET /reports/class/:classId/exam/:examId
export const classExamReportSchema = z.object({
    params: z.object({
        classId: z.string().trim().min(1, "Class is required."),
        examId: z.string().trim().min(1, "Exam is required."),
    }),
    query: z.object({ format }),
});
