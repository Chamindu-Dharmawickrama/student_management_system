import { z } from "zod";

export const classSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  gradeLevel: z.coerce.number({
    
  }).int("Grade level must be an integer"),
  isActive: z.boolean().optional(),
});

export type ClassInput = z.infer<typeof classSchema>;
