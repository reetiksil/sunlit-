import { z } from "zod";

export const PASSWORD_MIN_LENGTH = 8;

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("Please enter a valid email address.")
  .max(254);

export const passwordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`)
  .max(200, "Password is too long.");

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Please enter your password.").max(200),
});

// NOTE: there is intentionally no `role` field. Role is decided on the server only.
export const registerSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name.").max(80),
  email: emailSchema,
  password: passwordSchema,
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
