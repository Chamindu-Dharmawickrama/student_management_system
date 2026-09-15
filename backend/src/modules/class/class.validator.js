import { z } from "zod";

const name = z.string().trim().min(1, "Class name is required.").max(20, "Class name is too long.");

// Grade range isn't statically known here — SchoolConfig.minGradeLevel/
// maxGradeLevel define it (default 6-13) — so only a plausible integer
// shape is checked at this layer; class.service.js validates the actual
// configured range.
const gradeLevel = z.coerce.number().int().min(1).max(20);

export const createClassSchema = z.object({
    body: z.object({
        name,
        gradeLevel,
        academicYearId: z.string().trim().min(1, "Academic year is required."),
        isActive: z.boolean().optional().default(true),
    }),
});

export const updateClassSchema = z.object({
    body: z
        .object({
            name: name.optional(),
            gradeLevel: gradeLevel.optional(),
            academicYearId: z.string().trim().min(1).optional(),
            isActive: z.boolean().optional(),
        })
        .refine(
            (data) => Object.values(data).some((v) => v !== undefined),
            "At least one field must be provided.",
        ),
});

export const listClassesQuerySchema = z.object({
    query: z.object({
        page: z.coerce.number().int().min(1).optional().default(1),
        limit: z.coerce.number().int().min(1).max(100).optional().default(20),
        q: z.string().trim().min(1).max(150).optional(),
        academicYearId: z.string().trim().min(1).optional(),
        gradeLevel: z.coerce.number().int().min(1).max(20).optional(),
        status: z.enum(["active", "inactive", "all"]).optional().default("all"),
    }),
});
