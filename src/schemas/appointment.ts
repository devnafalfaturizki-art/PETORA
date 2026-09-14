import { z } from 'zod';
import { uuidSchema, dateSchema, timeSchema } from './base';

export const appointmentStatusSchema = z.enum(['WAITING', 'IN_PROGRESS', 'DONE', 'CANCELLED']);

export const createAppointmentSchema = z.object({
  customer_id: uuidSchema,
  pet_id: uuidSchema,
  doctor_id: uuidSchema.nullable().optional(),
  appointment_date: dateSchema,
  appointment_time: timeSchema,
  complaint: z.string().optional(),
  notes: z.string().optional(),
  is_from_portal: z.boolean().default(false),
});

export const updateAppointmentStatusSchema = z.object({
  status: appointmentStatusSchema,
});

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
export type UpdateAppointmentStatusInput = z.infer<typeof updateAppointmentStatusSchema>;