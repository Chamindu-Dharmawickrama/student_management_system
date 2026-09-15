import { z } from "zod";

const grade = z.string().trim().min(1, "Grade is required.").max(10, "Grade is too long.");
const mark = z.coerce.number().int().min(0).max(100);

export const createGradeBandSchema = z.object({
    body: z
        .object({
            grade,
            minMark: mark,
            maxMark: mark,
            gradePoint: z.coerce.number().min(0).max(10).optional(),
            isPassing: z.boolean().optional().default(true),
            description: z.string().trim().max(255).optional(),
        })
        .refine((data) => data.minMark <= data.maxMark, {
            message: "minMark must not be greater than maxMark.",
            path: ["maxMark"],
        }),
});

export const updateGradeBandSchema = z.object({
    body: z
        .object({
            grade: grade.optional(),
            minMark: mark.optional(),
            maxMark: mark.optional(),
            gradePoint: z.coerce.number().min(0).max(10).nullable().optional(),
            isPassing: z.boolean().optional(),
            description: z.string().trim().max(255).nullable().optional(),
        })
        .refine((data) => Object.values(data).some((v) => v !== undefined), "At least one field must be provided.")
        .refine(
            (data) => !(data.minMark !== undefined && data.maxMark !== undefined) || data.minMark <= data.maxMark,
            { message: "minMark must not be greater than maxMark.", path: ["maxMark"] },
        ),
});

export const listGradeBandsQuerySchema = z.object({
    query: z.object({
        page: z.coerce.number().int().min(1).optional().default(1),
        limit: z.coerce.number().int().min(1).max(100).optional().default(20),
    }),
});
