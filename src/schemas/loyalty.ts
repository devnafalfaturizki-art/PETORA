import { z } from 'zod';
import { uuidSchema } from './base';

export const createLoyaltyTierSchema = z.object({
  tier_name: z.enum(['BRONZE', 'SILVER', 'GOLD', 'PLATINUM']),
  min_points: z.number().int().nonnegative(),
  min_spending: z.number().nonnegative(),
  point_multiplier: z.number().positive(),
  benefits: z.record(z.string(), z.unknown()),
});

export const redeemPointsSchema = z.object({
  customer_id: uuidSchema,
  points_to_redeem: z.number().int().positive(),
  invoice_id: uuidSchema.nullable().optional(),
});

export type CreateLoyaltyTierInput = z.infer<typeof createLoyaltyTierSchema>;
export type RedeemPointsInput = z.infer<typeof redeemPointsSchema>;