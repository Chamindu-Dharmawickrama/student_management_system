import { z } from "zod";

const sanitizedUsername = z
    .string()
    .trim()
    .toLowerCase()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be at most 20 characters')
    .regex(
        /^[a-z0-9_]+$/,
        'Username can only contain lowercase letters, numbers, and underscores'
    );

// Exported so other modules (e.g. student/teacher registration) validate
// emails and passwords with the exact same rules instead of redefining them.
export const strongPassword = z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password is too long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/\d/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character')
    // Block null bytes and common injection sequences at the schema layer
    .refine(
        (val) => !/[\x00\x08\x1a]/.test(val),
        'Password contains invalid characters'
    );

export const sanitizedEmail = z
    .string()
    .trim()
    .toLowerCase()
    .email('Must be a valid email address')
    .max(254, 'Email is too long');

// login schema
export const loginSchema = z.object({
    body: z.object({
        username: sanitizedUsername,
        password: z
            .string()
            .min(8, 'Invalid credentials')
            .max(128, 'Invalid credentials')
            .refine(
                (val) => !/[\x00\x08\x1a]/.test(val),
                'Invalid credentials'
            ),
    })
});


// forgot password schema
export const forgotPasswordSchema = z.object({
    body: z.object({
        email: z
            .string()
            .email('Must be a valid email address')
            .max(254, 'Email is too long'),
    }),
});

// reset password schema
export const resetPasswordSchema = z.object({
    body: z.object({
        token: z
            .string()
            .min(1, 'Reset token is required')
            .max(128, 'Invalid reset token format'),

        newPassword: strongPassword,
    }),
});

// change password schema — serves both the mandatory first-login change
// and a later voluntary change (see auth.service.js#changePasswordService)
export const changePasswordSchema = z.object({
    body: z.object({
        currentPassword: z
            .string()
            .min(1, 'Current password is required')
            .max(128, 'Invalid current password'),
        newPassword: strongPassword,
    }),
});


