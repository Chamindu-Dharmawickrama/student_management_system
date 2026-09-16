import { z } from "zod";
import { USERNAME_CONSTRAINTS } from "@/constants/app.constants";

// Reusable field schemas 
const usernameField = z
   .string()
   .min(
      USERNAME_CONSTRAINTS.MIN,
      `Username must be at least ${USERNAME_CONSTRAINTS.MIN} characters`,
   )
   .max(
      USERNAME_CONSTRAINTS.MAX,
      `Username must be at most ${USERNAME_CONSTRAINTS.MAX} characters`,
   )
   .regex(
      USERNAME_CONSTRAINTS.PATTERN,
      "Only lowercase letters, numbers, and underscores allowed",
   )
   .transform((v) => v.toLowerCase());

const emailField = z
   .string()
   .min(1, "Email is required")
   .email("Enter a valid email address")
   .transform((v) => v.toLowerCase());

// Mirrors the backend's rejection of \x00 (NUL), \x08 (backspace), and
// \x1a (SUB) in password fields.
// eslint-disable-next-line no-control-regex
const NO_CONTROL_CHARS = /[\x00\x08\x1a]/;
function hasNoControlChars(value: string): boolean {
   return !NO_CONTROL_CHARS.test(value);
}

// Strong password — mirrors the backend's `strongPassword` Zod validator exactly
const strongPasswordField = z
   .string()
   .min(8, "Password must be at least 8 characters")
   .max(128, "Password is too long")
   .regex(/[A-Z]/, "Must contain at least one uppercase letter")
   .regex(/[a-z]/, "Must contain at least one lowercase letter")
   .regex(/\d/, "Must contain at least one number")
   .regex(/[^A-Za-z0-9]/, "Must contain at least one special character")
   .refine(hasNoControlChars, "Password contains invalid characters");

// Login — mirrors the backend's loginSchema exactly. The password field is
// deliberately vague ("Invalid credentials"), matching the backend's own
// wording, so client-side errors never hint at which field was wrong.
export const loginSchema = z.object({
   username: usernameField,
   password: z
      .string()
      .min(8, "Invalid credentials")
      .max(128, "Invalid credentials")
      .refine(hasNoControlChars, "Invalid credentials"),
});

export type LoginFormData = z.infer<typeof loginSchema>;

// Change password — mirrors the backend's changePasswordSchema.
export const changePasswordSchema = z
   .object({
      currentPassword: z.string().min(1, "Current password is required"),
      newPassword: strongPasswordField,
      confirmPassword: z.string().min(1, "Please confirm your new password"),
   })
   .refine((data) => data.newPassword === data.confirmPassword, {
      message: "Passwords do not match",
      path: ["confirmPassword"],
   })
   .refine((data) => data.newPassword !== data.currentPassword, {
      message: "New password must be different from your current password",
      path: ["newPassword"],
   });

export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

// Forgot password
export const forgotPasswordSchema = z.object({
   email: emailField,
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

// Reset password 
export const resetPasswordSchema = z
   .object({
      newPassword: strongPasswordField,
      confirmPassword: z.string().min(1, "Please confirm your password"),
   })
   .refine((data) => data.newPassword === data.confirmPassword, {
      message: "Passwords do not match",
      path: ["confirmPassword"],
   });

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

// Password strength helper (used by PasswordStrengthBar)
export interface PasswordStrength {
   score: number; // 0–5
   level: "weak" | "fair" | "good" | "strong";
   color: string;
}

// Password strength helper (used by PasswordStrengthBar)
export function getPasswordStrength(password: string): PasswordStrength {
   const checks = [
      password.length >= 8,
      /[A-Z]/.test(password),
      /[a-z]/.test(password),
      /\d/.test(password),
      /[^A-Za-z0-9]/.test(password),
   ];
   const score = checks.filter(Boolean).length;
   const level =
      score <= 1
         ? "weak"
         : score <= 3
           ? "fair"
           : score === 4
             ? "good"
             : "strong";
   const colorMap: Record<PasswordStrength["level"], string> = {
      weak: "var(--color-danger)",
      fair: "var(--color-warning)",
      good: "hsl(180, 60%, 50%)",
      strong: "var(--color-success)",
   };
   return { score, level, color: colorMap[level] };
}
