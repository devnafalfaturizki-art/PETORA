import { z } from 'zod';
import { AppError, ErrorCode } from '@/lib/errors';

export function validateOrThrow<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new AppError(
      ErrorCode.VALIDATION_ERROR,
      'Validation failed',
      result.error.issues
    );
  }
  return result.data;
}

export function validateSafe<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; errors: z.ZodError<T> } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, errors: result.error };
}

export function getZodErrorMessage(error: z.ZodError): string {
  const firstIssue = error.issues[0];
  if (!firstIssue) return 'Validation error';
  return firstIssue.message;
}
