import { z } from "zod";

const sanitizedUsername = z
    .string()
    .trim()
    .toLowerCase()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username must be at most 20 characters")
    .regex(
        /^[a-z0-9_]+$/,
        "Username can only contain lowercase letters, numbers, and underscores",
    );

const sanitizedEmail = z
    .string()
    .trim()
    .toLowerCase()
    .email("Must be a valid email address")
    .max(254, "Email is too long");


export const updateProfileSchema = z.object({
    body: z
        .object({
            username: sanitizedUsername.optional(),
            email: sanitizedEmail.optional(),
            // avatarUrl: null clears the avatar; a URL string sets a new one.
            avatarUrl: z
                .string()
                .url("Must be a valid URL")
                .max(2048, "URL is too long")
                .nullable()
                .optional(),
        })
        .refine(
            (data) =>
                data.username !== undefined ||
                data.email !== undefined ||
                data.avatarUrl !== undefined,
            "At least one field (username, email, or avatarUrl) must be provided.",
        ),
});
