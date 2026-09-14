import { z } from 'zod';
import { uuidSchema, dateSchema } from './base';

export const createProductSchema = z.object({
  sku: z.string().min(1).max(50).regex(/^\S+$/),
  name: z.string().min(1).max(200),
  category_id: uuidSchema.nullable().optional(),
  supplier_id: uuidSchema.nullable().optional(),
  barcode: z.string().max(100).optional(),
  description: z.string().optional(),
  purchase_price: z.number().nonnegative(),
  selling_price: z.number().nonnegative(),
  stock_quantity: z.number().int().nonnegative().default(0),
  stock_minimum: z.number().int().nonnegative().default(0),
  stock_maximum: z.number().int().nonnegative().default(0),
  photo_url: z.string().url().optional(),
  expiry_date: dateSchema.optional(),
}).refine(
  (data) => {
    if (data.stock_minimum && data.stock_maximum) {
      return data.stock_minimum <= data.stock_maximum;
    }
    return true;
  },
  { message: 'stock_minimum harus <= stock_maximum' }
);

export const updateProductSchema = createProductSchema.partial().omit({ sku: true });

export const createStockMovementSchema = z.object({
  product_id: uuidSchema,
  movement_type: z.enum(['IN', 'OUT', 'RETURN', 'ADJUSTMENT', 'DAMAGED', 'EXPIRED', 'OPNAME']),
  quantity: z.number().int().refine((q) => q !== 0, { message: 'quantity tidak boleh 0' }),
  reference_type: z.string().optional(),
  reference_id: uuidSchema.nullable().optional(),
  notes: z.string().optional(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type CreateStockMovementInput = z.infer<typeof createStockMovementSchema>;