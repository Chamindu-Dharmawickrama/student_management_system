import { z } from "zod";

// GET /dashboard/admin?academicYearId= — defaults to the current year when
// omitted (dashboard.service.js).
export const adminDashboardQuerySchema = z.object({
    query: z.object({
        academicYearId: z.string().trim().min(1).optional(),
    }),
});
