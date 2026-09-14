import { z } from 'zod';

export const customerTagSchema = z.enum(['VIP', 'REGULAR', 'NEW', 'BLACKLIST']);

export const createCustomerSchema = z.object({
  name: z.string().min(1).max(100),
  phone: z.string().max(20).optional(),
  email: z.string().email().max(100).optional(),
  address: z.string().optional(),
  emergency_contact: z.string().max(100).optional(),
  photo_url: z.string().url().optional(),
  notes: z.string().optional(),
  is_guest: z.boolean().default(false),
  tags: z.array(customerTagSchema).default([]),
  create_account: z.boolean().default(false),
  username: z.string().min(3).max(50).regex(/^[a-z0-9._]+$/).optional(),
  pin: z.string().length(6).regex(/^\d+$/).optional(),
}).refine(
  (data) => {
    if (data.create_account) {
      return !!data.username && !!data.pin;
    }
    return true;
  },
  { message: 'username dan pin wajib jika create_account = true' }
);

export const updateCustomerSchema = createCustomerSchema.partial().omit({
  create_account: true,
  username: true,
  pin: true,
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;