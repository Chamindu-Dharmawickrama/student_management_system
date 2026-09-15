import { z } from "zod";

const name = z.string().trim().min(1, "Academic year name is required.").max(50, "Name is too long.");
const dateField = (label) => z.coerce.date({ message: `${label} must be a valid date.` });

export const createAcademicYearSchema = z.object({
    body: z
        .object({
            name,
            startDate: dateField("Start date"),
            endDate: dateField("End date"),
            isCurrent: z.boolean().optional().default(false),
        })
        .refine((data) => data.startDate < data.endDate, {
            message: "Start date must be before end date.",
            path: ["endDate"],
        }),
});

export const updateAcademicYearSchema = z.object({
    body: z
        .object({
            name: name.optional(),
            startDate: dateField("Start date").optional(),
            endDate: dateField("End date").optional(),
            isCurrent: z.boolean().optional(),
        })
        .refine((data) => Object.values(data).some((v) => v !== undefined), "At least one field must be provided.")
        .refine(
            (data) => !(data.startDate && data.endDate) || data.startDate < data.endDate,
            { message: "Start date must be before end date.", path: ["endDate"] },
        ),
});

export const listAcademicYearsQuerySchema = z.object({
    query: z.object({
        page: z.coerce.number().int().min(1).optional().default(1),
        limit: z.coerce.number().int().min(1).max(100).optional().default(20),
        q: z.string().trim().min(1).max(150).optional(),
        status: z.enum(["current", "all"]).optional().default("all"),
    }),
});

// Nested Term routes: /academic-years/:id/terms/:termId
export const termIdParamSchema = z.object({
    params: z.object({
        id: z.string().trim().min(1, "Academic year id is required."),
        termId: z.string().trim().min(1, "Term id is required."),
    }),
});

export const updateTermSchema = z.object({
    body: z
        .object({
            name: z.string().trim().min(1).max(50).optional(),
            startDate: dateField("Start date").optional(),
            endDate: dateField("End date").optional(),
        })
        .refine((data) => Object.values(data).some((v) => v !== undefined), "At least one field must be provided.")
        .refine(
            (data) => !(data.startDate && data.endDate) || data.startDate < data.endDate,
            { message: "Start date must be before end date.", path: ["endDate"] },
        ),
});
