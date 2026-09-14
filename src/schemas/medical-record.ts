import { z } from 'zod';
import { uuidSchema } from './base';

export const medicalRecordStatusSchema = z.enum(['OPEN', 'CLOSED']);

export const createMedicalRecordSchema = z.object({
  appointment_id: uuidSchema,
  chief_complaint: z.string().optional(),
  history: z.string().optional(),
  physical_exam: z.string().optional(),
  weight_kg: z.number().positive().max(500).optional(),
  temperature_c: z.number().min(30).max(45).optional(),
  heart_rate_bpm: z.number().int().positive().optional(),
  respiratory_rate_bpm: z.number().int().positive().optional(),
  diagnosis: z.string().optional(),
  treatment: z.string().optional(),
  prescription: z.string().optional(),
  lab_results: z.string().optional(),
  additional_notes: z.string().optional(),
  attachments: z.array(z.string().url()).optional(),
});

export const updateMedicalRecordSchema = createMedicalRecordSchema.partial();

export type CreateMedicalRecordInput = z.infer<typeof createMedicalRecordSchema>;
export type UpdateMedicalRecordInput = z.infer<typeof updateMedicalRecordSchema>;