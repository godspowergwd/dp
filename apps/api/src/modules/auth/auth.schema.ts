import { z } from 'zod';

/** Login payload. */
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

/** Operator bootstrap registration (single-owner; creates the first user). */
export const registerSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).optional(),
  password: z.string().min(8).max(128),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;

/** Profile update payload (name optional, password optional). */
export const updateProfileSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  password: z.string().min(8).max(128).optional(),
  currentPassword: z.string().optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
