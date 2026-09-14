import type { UUID, Timestamp, DateString } from './base';

export interface Pet {
  id: UUID;
  customer_id: UUID;
  name: string;
  species: string;
  breed: string | null;
  birth_date: DateString | null;
  gender: string | null;
  photo_url: string | null;
  microchip_number: string | null;
  is_active: boolean;
  created_at: Timestamp;
  updated_at: Timestamp;
  deleted_at: Timestamp | null;
}

export interface CreatePetInput {
  customer_id: UUID;
  name: string;
  species: string;
  breed?: string;
  birth_date?: DateString;
  gender?: string;
  photo_url?: string;
  microchip_number?: string;
}

export type UpdatePetInput = Partial<Omit<CreatePetInput, 'customer_id'>>;

export interface PetWeightLog {
  id: UUID;
  pet_id: UUID;
  weight_kg: number;
  recorded_at: DateString;
  created_at: Timestamp;
}

export interface PetVaccine {
  id: UUID;
  pet_id: UUID;
  vaccine_name: string;
  vaccination_date: DateString;
  due_date: DateString | null;
  notes: string | null;
  is_active: boolean;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface PetDisease {
  id: UUID;
  pet_id: UUID;
  disease_name: string;
  diagnosed_date: DateString | null;
  notes: string | null;
  is_active: boolean;
  created_at: Timestamp;
}

export interface PetAllergy {
  id: UUID;
  pet_id: UUID;
  allergen: string;
  notes: string | null;
  is_active: boolean;
  created_at: Timestamp;
}