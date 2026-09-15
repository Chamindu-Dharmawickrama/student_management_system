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

const employeeNo = z
    .string()
    .trim()
    .min(1, "Employee number is required.")
    .max(30, "Employee number is too long.");

const joinDate = z.coerce
    .date({ message: "Join date must be a valid date." })
    .refine((d) => d <= new Date(), "Join date cannot be in the future.");

export const createTeacherSchema = z.object({
    body: z.object({
        firstName: z.string().trim().min(1, "First name is required.").max(100),
        lastName: z.string().trim().min(1, "Last name is required.").max(100),
        email: sanitizedEmail,
        employeeNo,
        phone: phoneNumber,
        gender: genderEnum,
        joinDate,
        // Schema enforces exactly one active subject per teacher per academic
        // year (TeacherSubjectAssignment @@unique([teacherId, academicYearId])).
        subjectId: z.string().trim().min(1, "Subject is required."),
        // Which classes the teacher teaches that subject to — optional at
        // registration time, can be assigned later (§2).
        classIds: z.array(z.string().trim().min(1)).max(50).optional().default([]),
        // Optional class-teacher responsibility (§6/§9).
        classTeacherOfId: z.string().trim().min(1).optional(),
    }),
});

// GET /teachers — list query
export const listTeachersQuerySchema = z.object({
    query: z.object({
        page: z.coerce.number().int().min(1).optional().default(1),
        limit: z.coerce.number().int().min(1).max(100).optional().default(20),
        q: z.string().trim().min(1).max(150).optional(),
        subjectId: z.string().trim().min(1).optional(),
        classId: z.string().trim().min(1).optional(),
        classTeacherOnly: z.coerce.boolean().optional(),
        status: z.enum(["active", "inactive", "all"]).optional().default("all"),
    }),
});

// PATCH /teachers/:id — every field optional. classIds, when present,
// REPLACES the active teaching-assignment set (diff-synced, not appended).
// classTeacherOfId has three distinguishable states: absent = don't touch,
// null = remove class-teacher responsibility, a class id = assign/move it.
export const updateTeacherSchema = z.object({
    body: z
        .object({
            firstName: z.string().trim().min(1).max(100).optional(),
            lastName: z.string().trim().min(1).max(100).optional(),
            email: sanitizedEmail.optional(),
            employeeNo: employeeNo.optional(),
            phone: phoneNumber.optional(),
            gender: genderEnum.optional(),
            joinDate: joinDate.optional(),
            subjectId: z.string().trim().min(1).optional(),
            classIds: z.array(z.string().trim().min(1)).max(50).optional(),
            classTeacherOfId: z.string().trim().min(1).nullable().optional(),
        })
        .refine(
            (data) => Object.values(data).some((v) => v !== undefined),
            "At least one field must be provided.",
        ),
});
