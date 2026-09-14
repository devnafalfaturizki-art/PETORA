import type { UUID, Timestamp } from './base';

export type MedicalRecordStatus = 'OPEN' | 'CLOSED';

export interface MedicalRecord {
  id: UUID;
  record_number: string;
  appointment_id: UUID;
  doctor_id: UUID;
  chief_complaint: string | null;
  history: string | null;
  physical_exam: string | null;
  weight_kg: number | null;
  temperature_c: number | null;
  heart_rate_bpm: number | null;
  respiratory_rate_bpm: number | null;
  diagnosis: string | null;
  treatment: string | null;
  prescription: string | null;
  lab_results: string | null;
  additional_notes: string | null;
  attachments: string[];
  status: MedicalRecordStatus;
  created_at: Timestamp;
  updated_at: Timestamp;
  deleted_at: Timestamp | null;
}

export interface CreateMedicalRecordInput {
  appointment_id: UUID;
  chief_complaint?: string;
  history?: string;
  physical_exam?: string;
  weight_kg?: number;
  temperature_c?: number;
  heart_rate_bpm?: number;
  respiratory_rate_bpm?: number;
  diagnosis?: string;
  treatment?: string;
  prescription?: string;
  lab_results?: string;
  additional_notes?: string;
  attachments?: string[];
}

export type UpdateMedicalRecordInput = Partial<CreateMedicalRecordInput>;