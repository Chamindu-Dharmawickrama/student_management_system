import { z } from "zod";

const marksObtainedSchema = z.coerce
    .number({ message: "Must be a number." })
    .min(0, "Marks cannot be negative.")
    .max(100, "Marks cannot exceed 100.");

// Validation for a single gradebook cell (or row) in the frontend.
// The backend enforces `marksObtained` is required unless `isAbsent` is true.
export const gradebookEntrySchema = z
    .object({
        studentId: z.string().trim().min(1, "Student is required."),
        isAbsent: z.boolean().optional().default(false),
        marksObtained: z.union([marksObtainedSchema, z.literal(""), z.nan()]).optional(),
        remarks: z.string().trim().max(500, "Remarks cannot exceed 500 characters.").optional(),
    })
    .refine(
        (data) => {
            if (data.isAbsent) return true;
            return typeof data.marksObtained === "number" && !isNaN(data.marksObtained);
        },
        {
            message: "Required unless absent.",
            path: ["marksObtained"],
        }
    );

export type GradebookEntryFormValues = z.infer<typeof gradebookEntrySchema>;
