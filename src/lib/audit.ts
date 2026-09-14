import { supabase } from '@/lib/supabase';
import type { AuditLog, CreateAuditLogInput } from '@/types';

export async function logAudit(params: CreateAuditLogInput): Promise<AuditLog> {
  const { data, error } = await supabase
    .from('audit_logs')
    .insert({
      user_id: params.user_id ?? null,
      action: params.action,
      entity_type: params.entity_type,
      entity_id: params.entity_id ?? null,
      old_values: params.old_values ?? null,
      new_values: params.new_values ?? null,
      ip_address: params.ip_address ?? null,
      user_agent: params.user_agent ?? null,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Audit log failed: ${error.message}`);
  }

  return data as AuditLog;
}

export async function getAuditLogs(params: {
  entity_type?: string;
  entity_id?: string;
  user_id?: string;
  limit?: number;
  offset?: number;
}): Promise<AuditLog[]> {
  let query = supabase.from('audit_logs').select('*').order('created_at', { ascending: false });

  if (params.entity_type) {
    query = query.eq('entity_type', params.entity_type);
  }
  if (params.entity_id) {
    query = query.eq('entity_id', params.entity_id);
  }
  if (params.user_id) {
    query = query.eq('user_id', params.user_id);
  }
  if (params.limit) {
    query = query.limit(params.limit);
  }
  if (params.offset) {
    query = query.range(params.offset, params.offset + (params.limit ?? 50) - 1);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Get audit logs failed: ${error.message}`);
  return (data ?? []) as AuditLog[];
}