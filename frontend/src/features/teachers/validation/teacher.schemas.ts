import { z } from "zod";

export const createTeacherSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(100, "Max 100 characters"),
  lastName: z.string().min(1, "Last name is required").max(100, "Max 100 characters"),
  email: z.string().email("Invalid email").max(254, "Max 254 characters"),
  employeeNo: z.string().min(1, "Employee number is required").max(30, "Max 30 characters"),
  phone: z
    .string()
    .regex(/^\+?[0-9]{7,15}$/, "Must be a valid phone number (7-15 digits, optional + prefix)")
    .optional()
    .or(z.literal("")),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]),
  joinDate: z.string().refine((val) => {
    const date = new Date(val);
    const now = new Date();
    // allow joining today or in the past
    return date <= now;
  }, "Join date cannot be in the future"),
  subjectId: z.string().min(1, "Subject is required"),
  classIds: z.array(z.string()).optional().default([]),
  classTeacherOfId: z.string().optional(),
});

export type CreateTeacherFormValues = z.infer<typeof createTeacherSchema>;

export const updateTeacherSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  email: z.string().email().max(254).optional(),
  employeeNo: z.string().min(1).max(30).optional(),
  phone: z
    .string()
    .regex(/^\+?[0-9]{7,15}$/, "Must be a valid phone number (7-15 digits, optional + prefix)")
    .optional()
    .nullable()
    .or(z.literal("")),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
  joinDate: z.string().refine((val) => {
    const date = new Date(val);
    const now = new Date();
    return date <= now;
  }, "Join date cannot be in the future").optional(),
  subjectId: z.string().optional(),
  classIds: z.array(z.string()).optional(),
  classTeacherOfId: z.string().nullable().optional(),
});

export type UpdateTeacherFormValues = z.infer<typeof updateTeacherSchema>;
