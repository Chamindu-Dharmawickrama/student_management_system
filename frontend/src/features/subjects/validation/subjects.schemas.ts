import { z } from "zod";

export const subjectSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  code: z.string().max(20, "Code is too long").optional().transform(v => v?.toUpperCase() || ""),
  isActive: z.boolean().optional(),
});

export type SubjectInput = z.infer<typeof subjectSchema>;
