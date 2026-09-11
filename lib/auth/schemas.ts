import * as z from "zod";

export type { FormState } from "@/lib/form-state";

const email = z.email({ error: "Enter a valid email address." });

const newPassword = z
  .string()
  .min(8, { error: "Use at least 8 characters." })
  .regex(/[a-zA-Z]/, { error: "Include at least one letter." })
  .regex(/[0-9]/, { error: "Include at least one number." });

const passwordsMatch = (data: { password: string; confirmPassword: string }) =>
  data.password === data.confirmPassword;

const passwordMismatch = { error: "Passwords do not match.", path: ["confirmPassword"] };

export const loginSchema = z.object({
  email,
  password: z.string().min(1, { error: "Enter your password." }),
});

export const registerSchema = z
  .object({
    firstName: z.string().min(1, { error: "Enter your first name." }).max(60),
    lastName: z.string().min(1, { error: "Enter your last name." }).max(60),
    email,
    phone: z.string().regex(/^(\+?[0-9][0-9\s-]{6,18})?$/, { error: "Enter a valid phone number." }),
    password: newPassword,
    confirmPassword: z.string(),
  })
  .refine(passwordsMatch, passwordMismatch);

export const forgotPasswordSchema = z.object({ email });

export const resetPasswordSchema = z
  .object({ password: newPassword, confirmPassword: z.string() })
  .refine(passwordsMatch, passwordMismatch);
