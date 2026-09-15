import { z } from "zod";

// PATCH /exams/:id — sets the exam period for this term. The system
// deliberately does not track a per-subject exam timetable, only this one
// date range; whether it falls within the parent term's own dates is
// checked in exam.service.js (needs the term row, not available here).
export const updateExamPeriodSchema = z.object({
    body: z
        .object({
            startDate: z.coerce.date({ message: "Start date must be a valid date." }),
            endDate: z.coerce.date({ message: "End date must be a valid date." }),
        })
        .refine((data) => data.startDate < data.endDate, {
            message: "Start date must be before end date.",
            path: ["endDate"],
        }),
});
