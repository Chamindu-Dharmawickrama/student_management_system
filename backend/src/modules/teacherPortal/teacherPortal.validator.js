import { z } from "zod";

// GET /teacher/students — classId, if given, is validated against the
// teacher's authorized scope in teacherPortal.service.js, not here.
export const listMyStudentsQuerySchema = z.object({
    query: z.object({
        page: z.coerce.number().int().min(1).optional().default(1),
        limit: z.coerce.number().int().min(1).max(100).optional().default(20),
        classId: z.string().trim().min(1).optional(),
    }),
});
