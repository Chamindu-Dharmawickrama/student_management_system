import { z } from "zod";

// Shared :id route-param schema for GET/PATCH/DELETE /<resource>/:id
// endpoints — avoids redefining the same three lines in every module.
export const idParamSchema = z.object({
    params: z.object({
        id: z.string().trim().min(1, "Id is required."),
    }),
});
