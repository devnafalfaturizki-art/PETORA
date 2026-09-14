import type { UUID, Timestamp } from './base';

export interface AuditLog {
  id: UUID;
  user_id: UUID | null;
  action: string;
  entity_type: string;
  entity_id: UUID | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: Timestamp;
}

export interface CreateAuditLogInput {
  user_id?: UUID | null;
  action: string;
  entity_type: string;
  entity_id?: UUID | null;
  old_values?: Record<string, unknown> | null;
  new_values?: Record<string, unknown> | null;
  ip_address?: string | null;
  user_agent?: string | null;
}