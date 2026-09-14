import { z } from 'zod';
import { uuidSchema } from './base';

export const userRoleSchema = z.enum(['OWNER', 'ADMIN', 'DOKTER', 'KASIR', 'CUSTOMER']);

export const loginCredentialsSchema = z.object({
  username: z.string().min(3).max(50).regex(/^[a-z0-9._]+$/),
  pin: z.string().length(6).regex(/^\d+$/),
});

export const createUserSchema = z.object({
  username: z.string().min(3).max(50).regex(/^[a-z0-9._]+$/),
  pin: z.string().length(6).regex(/^\d+$/),
  role: z.enum(['ADMIN', 'DOKTER', 'KASIR', 'CUSTOMER']),
  full_name: z.string().min(1).max(100),
  customer_id: uuidSchema.nullable().optional(),
});

export const updatePinSchema = z.object({
  old_pin: z.string().length(6).regex(/^\d+$/),
  new_pin: z.string().length(6).regex(/^\d+$/),
});

export const resetPinSchema = z.object({
  target_user_id: uuidSchema,
  new_pin: z.string().length(6).regex(/^\d+$/),
});

export type LoginCredentialsInput = z.infer<typeof loginCredentialsSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdatePinInput = z.infer<typeof updatePinSchema>;
export type ResetPinInput = z.infer<typeof resetPinSchema>;