import { z } from 'zod';
import { uuidSchema, dateSchema } from './base';

export const promotionTypeSchema = z.enum(['PERCENTAGE', 'FIXED', 'BUNDLE', 'HAPPY_HOUR', 'BIRTHDAY']);

export const createPromotionSchema = z.object({
  code: z.string().max(50).optional(),
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  promotion_type: promotionTypeSchema,
  discount_value: z.number().nonnegative(),
  min_purchase: z.number().nonnegative().default(0),
  max_usage: z.number().int().positive().nullable().optional(),
  start_date: dateSchema,
  end_date: dateSchema,
  applicable_products: z.array(uuidSchema).nullable().optional(),
}).refine(
  (data) => new Date(data.end_date) >= new Date(data.start_date),
  { message: 'end_date harus >= start_date' }
);

export const applyPromoCodeSchema = z.object({
  code: z.string().min(1),
  subtotal: z.number().nonnegative(),
  customer_id: uuidSchema.nullable().optional(),
});

export type CreatePromotionInput = z.infer<typeof createPromotionSchema>;
export type ApplyPromoCodeInput = z.infer<typeof applyPromoCodeSchema>;