import { z } from 'zod';

export const uuidSchema = z.string().uuid();
export const timestampSchema = z.string().datetime();
export const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
export const timeSchema = z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/);

export const baseEntitySchema = z.object({
  id: uuidSchema,
  created_at: timestampSchema,
  updated_at: timestampSchema,
});

export const softDeletableSchema = baseEntitySchema.extend({
  deleted_at: timestampSchema.nullable(),
});
