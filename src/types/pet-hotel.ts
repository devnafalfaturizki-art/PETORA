import type { UUID, Timestamp, DateString } from './base';

export type RoomStatus = 'AVAILABLE' | 'RESERVED' | 'OCCUPIED' | 'MAINTENANCE' | 'INACTIVE';
export type RoomCleanliness = 'CLEAN' | 'DIRTY' | 'UNDER_CLEANING';
export type PetHotelBookingStatus = 'BOOKED' | 'CHECKED_IN' | 'CHECKED_OUT' | 'CANCELLED';
export type PetHotelLogType = 'FEEDING' | 'MEDICINE' | 'NOTE';

export interface Room {
  id: UUID;
  name: string;
  room_number: string | null;
  room_type: string;
  price_per_night: number;
  capacity: number;
  status: RoomStatus;
  cleanliness: RoomCleanliness;
  maintenance_status: boolean;
  is_active: boolean;
  created_at: Timestamp;
  updated_at: Timestamp;
  deleted_at: Timestamp | null;
}

export interface PetHotelBooking {
  id: UUID;
  booking_number: string;
  pet_id: UUID;
  customer_id: UUID;
  room_id: UUID | null;
  check_in_date: DateString;
  check_out_date: DateString;
  actual_check_in_at: Timestamp | null;
  actual_check_out_at: Timestamp | null;
  price_per_night: number;
  total_price: number;
  status: PetHotelBookingStatus;
  special_notes: string | null;
  is_from_portal: boolean;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface PetHotelLog {
  id: UUID;
  booking_id: UUID;
  log_type: PetHotelLogType;
  description: string | null;
  photo_urls: string[];
  logged_at: Timestamp;
  created_at: Timestamp;
}

export interface CreatePetHotelBookingInput {
  pet_id: UUID;
  customer_id: UUID;
  room_id?: UUID;
  check_in_date: DateString;
  check_out_date: DateString;
  price_per_night?: number;
  special_notes?: string;
  is_from_portal?: boolean;
}

export interface CreatePetHotelLogInput {
  booking_id: UUID;
  log_type: PetHotelLogType;
  description?: string;
  photo_urls?: string[];
}