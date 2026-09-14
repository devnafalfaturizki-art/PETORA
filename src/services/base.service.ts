import { supabase } from '@/lib/supabase';
import { AppError, ErrorCode } from '@/lib/errors';
import { logAudit } from '@/lib/audit';
import type { UUID, AuditLog, CreateAuditLogInput } from '@/types';

/**
 * Base service pattern yang harus diikuti semua domain service.
 */
export abstract class BaseService {
  protected supabase = supabase;

  protected handleError(error: unknown, context: string): never {
    if (error instanceof AppError) throw error;
    if (error instanceof Error) {
      throw new AppError(ErrorCode.INTERNAL_ERROR, `${context}: ${error.message}`);
    }
    throw new AppError(ErrorCode.INTERNAL_ERROR, context);
  }

  protected async audit(params: CreateAuditLogInput): Promise<AuditLog> {
    return logAudit(params);
  }
}

export default BaseService;