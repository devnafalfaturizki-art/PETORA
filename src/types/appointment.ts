import type { UUID, Timestamp, DateString, TimeString } from './base';

export type AppointmentStatus = 'WAITING' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED';

export interface Appointment {
  id: UUID;
  customer_id: UUID;
  pet_id: UUID;
  doctor_id: UUID | null;
  appointment_date: DateString;
  appointment_time: TimeString;
  queue_number: number | null;
  status: AppointmentStatus;
  complaint: string | null;
  notes: string | null;
  is_from_portal: boolean;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface CreateAppointmentInput {
  customer_id: UUID;
  pet_id: UUID;
  doctor_id?: UUID;
  appointment_date: DateString;
  appointment_time: TimeString;
  complaint?: string;
  notes?: string;
  is_from_portal?: boolean;
}

export interface UpdateAppointmentStatusInput {
  status: AppointmentStatus;
}

export interface UpdateAppointmentInput {
  doctor_id?: UUID;
  appointment_date?: DateString;
  appointment_time?: TimeString;
  complaint?: string;
  notes?: string;
}