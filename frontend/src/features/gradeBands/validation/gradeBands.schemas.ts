import { z } from "zod";

export const gradeBandSchema = z.object({
  grade: z.string().min(1, "Grade is required").max(10, "Grade is too long"),
  minMark: z.coerce.number({
    
  }).int("Must be an integer").min(0, "Cannot be less than 0").max(100, "Cannot be greater than 100"),
  maxMark: z.coerce.number({
    
  }).int("Must be an integer").min(0, "Cannot be less than 0").max(100, "Cannot be greater than 100"),
  gradePoint: z.coerce.number().min(0, "Must be >= 0").max(10, "Must be <= 10").optional(),
  isPassing: z.boolean().optional(),
  description: z.string().max(255, "Description is too long").optional(),
}).refine(data => data.minMark <= data.maxMark, {
  message: "Min mark must be less than or equal to max mark",
  path: ["minMark"],
});

export type GradeBandInput = z.infer<typeof gradeBandSchema>;
