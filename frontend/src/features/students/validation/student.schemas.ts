import { z } from "zod";

export const createStudentSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(100, "Max 100 characters"),
  lastName: z.string().min(1, "Last name is required").max(100, "Max 100 characters"),
  email: z.string().email("Invalid email").max(254, "Max 254 characters"),
  admissionNumber: z.string().min(1, "Admission number is required").max(30, "Max 30 characters"),
  dateOfBirth: z.string().refine((val) => {
    const date = new Date(val);
    const now = new Date();
    const minDate = new Date();
    minDate.setFullYear(now.getFullYear() - 100);
    return date < now && date > minDate;
  }, "Must be a valid date in the past (within 100 years)"),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]),
  guardianName: z.string().max(150, "Max 150 characters").optional().or(z.literal("")),
  guardianPhone: z
    .string()
    .regex(/^\+?[0-9]{7,15}$/, "Must be a valid phone number (7-15 digits, optional + prefix)")
    .optional()
    .or(z.literal("")),
  academicYearId: z.string().min(1, "Academic year is required"),
  classId: z.string().min(1, "Class is required"),
  subjectIds: z.array(z.string()).max(50, "Maximum 50 subjects allowed").optional().default([]),
});

export type CreateStudentFormValues = z.infer<typeof createStudentSchema>;

export const updateStudentSchema = z
  .object({
    firstName: z.string().min(1).max(100).optional(),
    lastName: z.string().min(1).max(100).optional(),
    email: z.string().email().max(254).optional(),
    admissionNumber: z.string().min(1).max(30).optional(),
    dateOfBirth: z.string().refine((val) => {
      const date = new Date(val);
      const now = new Date();
      const minDate = new Date();
      minDate.setFullYear(now.getFullYear() - 100);
      return date < now && date > minDate;
    }, "Must be a valid date in the past (within 100 years)").optional(),
    gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
    guardianName: z.string().max(150).optional().nullable(),
    guardianPhone: z
      .string()
      .regex(/^\+?[0-9]{7,15}$/, "Must be a valid phone number (7-15 digits, optional + prefix)")
      .optional()
      .nullable()
      .or(z.literal("")),
    academicYearId: z.string().optional(),
    classId: z.string().optional(),
  })
  .refine(
    (data) => {
      // academicYearId and classId must be sent together or not at all
      const hasYear = !!data.academicYearId;
      const hasClass = !!data.classId;
      return hasYear === hasClass;
    },
    {
      message: "Academic year and class must be changed together",
      path: ["classId"], // attach error to classId
    }
  );

export type UpdateStudentFormValues = z.infer<typeof updateStudentSchema>;

export const subjectSelectionsSchema = z.object({
  academicYearId: z.string().min(1, "Academic year is required"),
  subjectIds: z.array(z.string()),
});

export type SubjectSelectionsFormValues = z.infer<typeof subjectSelectionsSchema>;
