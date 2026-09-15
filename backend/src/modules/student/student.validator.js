import { z } from "zod";
import { sanitizedEmail } from "../auth/auth.validator.js";

const genderEnum = z.enum(["MALE", "FEMALE", "OTHER"], {
    message: "Gender must be one of MALE, FEMALE, or OTHER.",
});

// E.164-ish: optional leading +, 7-15 digits — matches the loose convention
// used elsewhere in this codebase (no existing phone validator to reuse).
const phoneNumber = z
    .string()
    .trim()
    .regex(/^\+?[0-9]{7,15}$/, "Must be a valid phone number.");

const pastDate = (label) =>
    z.coerce
        .date({ message: `${label} must be a valid date.` })
        .refine((d) => d <= new Date(), `${label} cannot be in the future.`)
        .refine(
            (d) => d >= new Date(Date.now() - 100 * 365.25 * 24 * 60 * 60 * 1000),
            `${label} is not a plausible date.`,
        );

const admissionNumber = z
    .string()
    .trim()
    .min(1, "Admission number is required.")
    .max(30, "Admission number is too long.");

export const createStudentSchema = z.object({
    body: z.object({
        firstName: z.string().trim().min(1, "First name is required.").max(100),
        lastName: z.string().trim().min(1, "Last name is required.").max(100),
        email: sanitizedEmail,
        admissionNumber,
        dateOfBirth: pastDate("Date of birth"),
        gender: genderEnum,
        guardianName: z.string().trim().max(150).optional(),
        guardianPhone: phoneNumber.optional(),
        academicYearId: z.string().trim().min(1, "Academic year is required."),
        classId: z.string().trim().min(1, "Class is required."),
        // Optional — the subjects this student is taking for academicYearId,
        // entered on the same registration form. Can also be set/changed
        // later via PUT /students/:id/subject-selections.
        subjectIds: z.array(z.string().trim().min(1)).max(50).optional().default([]),
    }),
});

// GET /students — list query
export const listStudentsQuerySchema = z.object({
    query: z.object({
        page: z.coerce.number().int().min(1).optional().default(1),
        limit: z.coerce.number().int().min(1).max(100).optional().default(20),
        q: z.string().trim().min(1).max(150).optional(),
        academicYearId: z.string().trim().min(1).optional(),
        classId: z.string().trim().min(1).optional(),
        gender: genderEnum.optional(),
        status: z.enum(["active", "inactive", "all"]).optional().default("all"),
    }),
});

// PATCH /students/:id — every field optional; an enrollment change
// (academicYearId + classId) must be submitted as a pair, never half of one.
export const updateStudentSchema = z.object({
    body: z
        .object({
            firstName: z.string().trim().min(1).max(100).optional(),
            lastName: z.string().trim().min(1).max(100).optional(),
            email: sanitizedEmail.optional(),
            admissionNumber: admissionNumber.optional(),
            dateOfBirth: pastDate("Date of birth").optional(),
            gender: genderEnum.optional(),
            guardianName: z.string().trim().max(150).nullable().optional(),
            guardianPhone: phoneNumber.nullable().optional(),
            academicYearId: z.string().trim().min(1).optional(),
            classId: z.string().trim().min(1).optional(),
        })
        .refine(
            (data) => (data.academicYearId === undefined) === (data.classId === undefined),
            {
                message: "academicYearId and classId must be submitted together.",
                path: ["classId"],
            },
        )
        .refine(
            (data) => Object.values(data).some((v) => v !== undefined),
            "At least one field must be provided.",
        ),
});

// GET /students/:id/subject-selections
export const listSubjectSelectionsQuerySchema = z.object({
    query: z.object({
        academicYearId: z.string().trim().min(1, "Academic year is required."),
    }),
});

// PUT /students/:id/subject-selections — replaces the student's ENTIRE
// active selection set for the given year (diff-synced, not appended) —
// same shape/semantics as teacher.validator.js's classIds.
export const setSubjectSelectionsSchema = z.object({
    body: z.object({
        academicYearId: z.string().trim().min(1, "Academic year is required."),
        subjectIds: z.array(z.string().trim().min(1)).max(50),
    }),
});
