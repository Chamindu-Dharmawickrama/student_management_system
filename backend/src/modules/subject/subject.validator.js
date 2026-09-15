import { z } from "zod";

const name = z.string().trim().min(1, "Subject name is required.").max(100, "Subject name is too long.");

// Subject codes are conventionally short uppercase abbreviations (e.g.
// "MATH") — normalized here so "math"/"Math"/"MATH" collapse to one value
// instead of silently coexisting as different codes (§5).
const code = z
    .string()
    .trim()
    .min(1)
    .max(20, "Subject code is too long.")
    .transform((v) => v.toUpperCase());

export const createSubjectSchema = z.object({
    body: z.object({
        name,
        code: code.optional(),
        isActive: z.boolean().optional().default(true),
    }),
});

export const updateSubjectSchema = z.object({
    body: z
        .object({
            name: name.optional(),
            code: code.nullable().optional(),
            isActive: z.boolean().optional(),
        })
        .refine(
            (data) => Object.values(data).some((v) => v !== undefined),
            "At least one field must be provided.",
        ),
});

export const listSubjectsQuerySchema = z.object({
    query: z.object({
        page: z.coerce.number().int().min(1).optional().default(1),
        limit: z.coerce.number().int().min(1).max(100).optional().default(20),
        q: z.string().trim().min(1).max(150).optional(),
        status: z.enum(["active", "inactive", "all"]).optional().default("all"),
    }),
});
