import type { UUID, Timestamp } from './base';

export type CustomerTag = 'VIP' | 'REGULAR' | 'NEW' | 'BLACKLIST';

export interface Customer {
  id: UUID;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  emergency_contact: string | null;
  photo_url: string | null;
  notes: string | null;
  is_guest: boolean;
  tags: CustomerTag[];
  is_active: boolean;
  created_at: Timestamp;
  updated_at: Timestamp;
  deleted_at: Timestamp | null;
}

export interface CreateCustomerInput {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  emergency_contact?: string;
  photo_url?: string;
  notes?: string;
  is_guest?: boolean;
  tags?: CustomerTag[];
  create_account?: boolean;
  username?: string;
  pin?: string;
}

export type UpdateCustomerInput = Partial<Omit<CreateCustomerInput, 'create_account' | 'username' | 'pin'>>;