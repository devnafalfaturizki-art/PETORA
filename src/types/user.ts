import type { UUID, Timestamp } from './base';

export type UserRole = 'OWNER' | 'ADMIN' | 'DOKTER' | 'KASIR' | 'CUSTOMER';

export interface User {
  id: UUID;
  username: string;
  pin_hash: string;
  role: UserRole;
  full_name: string;
  customer_id: UUID | null;
  created_by: UUID | null;
  failed_login_attempts: number;
  locked_until: Timestamp | null;
  is_active: boolean;
  last_login_at: Timestamp | null;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export type SafeUser = Omit<User, 'pin_hash'>;

export interface LoginCredentials {
  username: string;
  pin: string;
}

export interface LoginResponse {
  user: SafeUser;
  session_token: string;
  expires_at: Timestamp;
}

export interface Session {
  user_id: UUID;
  role: UserRole;
  expires_at: Timestamp;
}

export interface CreateUserInput {
  username: string;
  pin: string;
  role: Exclude<UserRole, 'OWNER'>;
  full_name: string;
  customer_id?: UUID;
}

export interface UpdatePinInput {
  old_pin: string;
  new_pin: string;
}

export interface ResetPinInput {
  target_user_id: UUID;
  new_pin: string;
}

export interface DeactivateUserInput {
  user_id: UUID;
  reason?: string;
}