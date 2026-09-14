import { z } from 'zod';
import { uuidSchema, dateSchema } from './base';

export const createPetSchema = z.object({
  customer_id: uuidSchema,
  name: z.string().min(1).max(100),
  species: z.string().min(1).max(50),
  breed: z.string().max(50).optional(),
  birth_date: dateSchema.optional(),
  gender: z.string().max(10).optional(),
  photo_url: z.string().url().optional(),
  microchip_number: z.string().max(50).optional(),
}).refine(
  (data) => {
    if (data.birth_date) {
      return new Date(data.birth_date) <= new Date();
    }
    return true;
  },
  { message: 'birth_date tidak boleh di masa depan' }
);

export const updatePetSchema = createPetSchema.partial().omit({ customer_id: true });

export const createPetWeightLogSchema = z.object({
  pet_id: uuidSchema,
  weight_kg: z.number().positive().max(500),
  recorded_at: dateSchema.optional(),
});

export const createPetVaccineSchema = z.object({
  pet_id: uuidSchema,
  vaccine_name: z.string().min(1).max(100),
  vaccination_date: dateSchema,
  due_date: dateSchema.optional(),
  notes: z.string().optional(),
});

export type CreatePetInput = z.infer<typeof createPetSchema>;
export type UpdatePetInput = z.infer<typeof updatePetSchema>;
export type CreatePetWeightLogInput = z.infer<typeof createPetWeightLogSchema>;
export type CreatePetVaccineInput = z.infer<typeof createPetVaccineSchema>;