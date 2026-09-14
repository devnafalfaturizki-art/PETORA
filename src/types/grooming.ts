import type { UUID, Timestamp } from './base';

export type GroomingBookingStatus = 'BOOKED' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED';

export interface GroomingService {
  id: UUID;
  name: string;
  description: string | null;
  base_price: number;
  duration_minutes: number | null;
  is_active: boolean;
  created_at: Timestamp;
  updated_at: Timestamp;
  deleted_at: Timestamp | null;
}

export interface GroomingBooking {
  id: UUID;
  booking_number: string;
  pet_id: UUID;
  customer_id: UUID;
  groomer_id: UUID | null;
  service_id: UUID;
  appointment_date: string;
  appointment_time: string;
  status: GroomingBookingStatus;
  total_price: number;
  notes: string | null;
  is_from_portal: boolean;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface GroomingRecord {
  id: UUID;
  booking_id: UUID;
  skin_condition: string | null;
  flea_tick_found: boolean;
  recommendations: string | null;
  before_photo_url: string | null;
  after_photo_url: string | null;
  created_at: Timestamp;
}

export interface CreateGroomingBookingInput {
  pet_id: UUID;
  customer_id: UUID;
  groomer_id?: UUID;
  service_id: UUID;
  appointment_date: string;
  appointment_time: string;
  notes?: string;
  is_from_portal?: boolean;
}

export interface CreateGroomingRecordInput {
  booking_id: UUID;
  skin_condition?: string;
  flea_tick_found?: boolean;
  recommendations?: string;
  before_photo_url?: string;
  after_photo_url?: string;
}