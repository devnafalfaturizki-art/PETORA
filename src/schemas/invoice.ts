import { z } from 'zod';
import { uuidSchema } from './base';

export const invoiceTypeSchema = z.enum(['POS', 'CLINICAL', 'PET_HOTEL', 'GROOMING', 'MIXED']);
export const paymentMethodSchema = z.enum(['CASH', 'QRIS', 'TRANSFER', 'E_WALLET', 'CREDIT_CARD', 'MIXED']);

export const invoiceItemSchema = z.object({
  item_type: z.string().min(1),
  product_id: uuidSchema.nullable().optional(),
  procedure_id: uuidSchema.nullable().optional(),
  pet_hotel_booking_id: uuidSchema.nullable().optional(),
  grooming_booking_id: uuidSchema.nullable().optional(),
  description: z.string().min(1).max(200),
  quantity: z.number().int().positive().default(1),
  unit_price: z.number().nonnegative(),
});

export const createInvoiceSchema = z.object({
  invoice_type: invoiceTypeSchema,
  customer_id: uuidSchema.nullable().optional(),
  items: z.array(invoiceItemSchema).min(1),
  discount_amount: z.number().nonnegative().default(0),
  tax_amount: z.number().nonnegative().default(0),
  promotion_id: uuidSchema.nullable().optional(),
  loyalty_points_to_redeem: z.number().int().nonnegative().default(0),
  notes: z.string().optional(),
});

export const recordPaymentSchema = z.object({
  invoice_id: uuidSchema,
  payment_method: paymentMethodSchema,
  amount: z.number().positive(),
  reference_number: z.string().optional(),
  notes: z.string().optional(),
});

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>;