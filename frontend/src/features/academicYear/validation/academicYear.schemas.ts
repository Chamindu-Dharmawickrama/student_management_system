import { z } from "zod";

const dateString = z.string().refine(
  (val) => {
    const d = new Date(val);
    return !isNaN(d.getTime());
  },
  { message: "Invalid date" }
);

export const createAcademicYearSchema = z
  .object({
    name: z.string().min(1, "Name is required").max(100, "Name is too long"),
    startDate: dateString,
    endDate: dateString,
    isCurrent: z.boolean().optional(),
  })
  .refine(
    (data) => {
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);
      return start < end;
    },
    {
      message: "End date must be after start date",
      path: ["endDate"],
    }
  );

export type CreateAcademicYearInput = z.infer<typeof createAcademicYearSchema>;

export const updateTermSchema = z
  .object({
    name: z.string().min(1, "Name is required").max(100, "Name is too long").optional(),
    startDate: dateString.optional(),
    endDate: dateString.optional(),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        const start = new Date(data.startDate);
        const end = new Date(data.endDate);
        return start < end;
      }
      return true;
    },
    {
      message: "End date must be after start date",
      path: ["endDate"],
    }
  );

export type UpdateTermInput = z.infer<typeof updateTermSchema>;

export const updateExamSchema = z
  .object({
    startDate: dateString,
    endDate: dateString,
  })
  .refine(
    (data) => {
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);
      return start < end;
    },
    {
      message: "End date must be after start date",
      path: ["endDate"],
    }
  );

export type UpdateExamInput = z.infer<typeof updateExamSchema>;
