import type { UUID, Timestamp } from './base';

export interface Notification {
  id: UUID;
  user_id: UUID | null;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  data: Record<string, unknown> | null;
  created_at: Timestamp;
}

export interface CreateNotificationInput {
  user_id?: UUID | null;
  title: string;
  message: string;
  type: string;
  data?: Record<string, unknown>;
}