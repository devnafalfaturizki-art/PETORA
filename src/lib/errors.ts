export enum ErrorCode {
  // Auth
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  ACCOUNT_INACTIVE = 'ACCOUNT_INACTIVE',
  INVALID_OLD_PIN = 'INVALID_OLD_PIN',

  // Validation
  BAD_REQUEST = 'BAD_REQUEST',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR',

  // Authorization
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED',

  // Business
  CONFLICT = 'CONFLICT',
  INVALID_STATE_TRANSITION = 'INVALID_STATE_TRANSITION',
  INSUFFICIENT_STOCK = 'INSUFFICIENT_STOCK',
  INSUFFICIENT_LOYALTY_POINTS = 'INSUFFICIENT_LOYALTY_POINTS',
  PROMOTION_INVALID = 'PROMOTION_INVALID',
  PROMO_NOT_FOUND = 'PROMO_NOT_FOUND',
  SKU_ALREADY_EXISTS = 'SKU_ALREADY_EXISTS',
  BARCODE_ALREADY_EXISTS = 'BARCODE_ALREADY_EXISTS',
  USERNAME_ALREADY_EXISTS = 'USERNAME_ALREADY_EXISTS',
  CANNOT_DELETE_HAS_REFERENCES = 'CANNOT_DELETE_HAS_REFERENCES',
  APPOINTMENT_NOT_IN_PROGRESS = 'APPOINTMENT_NOT_IN_PROGRESS',
  MEDICAL_RECORD_ALREADY_EXISTS = 'MEDICAL_RECORD_ALREADY_EXISTS',
  ROOM_NOT_AVAILABLE = 'ROOM_NOT_AVAILABLE',
  BOOKING_NOT_ACTIVE = 'BOOKING_NOT_ACTIVE',
  GROOMER_NOT_AVAILABLE = 'GROOMER_NOT_AVAILABLE',
  INVOICE_CANCELLED = 'INVOICE_CANCELLED',
  INVOICE_ALREADY_PAID = 'INVOICE_ALREADY_PAID',
  ALREADY_CANCELLED = 'ALREADY_CANCELLED',
  ALREADY_REGISTERED = 'ALREADY_REGISTERED',
  CUSTOMER_NOT_FOUND = 'CUSTOMER_NOT_FOUND',
  APPOINTMENT_NOT_FOUND = 'APPOINTMENT_NOT_FOUND',
  NO_LOYALTY_ACCOUNT = 'NO_LOYALTY_ACCOUNT',
  FEEDBACK_ALREADY_EXISTS = 'FEEDBACK_ALREADY_EXISTS',
  NO_CHANGE_NEEDED = 'NO_CHANGE_NEEDED',
}

export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
    Object.setPrototypeOf(this, AppError.prototype);
  }

  get httpStatus(): number {
    switch (this.code) {
      case ErrorCode.UNAUTHORIZED:
      case ErrorCode.INVALID_CREDENTIALS:
      case ErrorCode.INVALID_OLD_PIN:
        return 401;
      case ErrorCode.ACCOUNT_LOCKED:
        return 423;
      case ErrorCode.FORBIDDEN:
      case ErrorCode.ACCOUNT_INACTIVE:
        return 403;
      case ErrorCode.NOT_FOUND:
      case ErrorCode.CUSTOMER_NOT_FOUND:
      case ErrorCode.APPOINTMENT_NOT_FOUND:
      case ErrorCode.PROMO_NOT_FOUND:
        return 404;
      case ErrorCode.VALIDATION_ERROR:
      case ErrorCode.BAD_REQUEST:
        return 400;
      case ErrorCode.CONFLICT:
      case ErrorCode.SKU_ALREADY_EXISTS:
      case ErrorCode.BARCODE_ALREADY_EXISTS:
      case ErrorCode.USERNAME_ALREADY_EXISTS:
      case ErrorCode.MEDICAL_RECORD_ALREADY_EXISTS:
      case ErrorCode.FEEDBACK_ALREADY_EXISTS:
      case ErrorCode.ALREADY_CANCELLED:
      case ErrorCode.ALREADY_REGISTERED:
        return 409;
      case ErrorCode.INSUFFICIENT_STOCK:
      case ErrorCode.INSUFFICIENT_LOYALTY_POINTS:
      case ErrorCode.ROOM_NOT_AVAILABLE:
      case ErrorCode.BOOKING_NOT_ACTIVE:
      case ErrorCode.GROOMER_NOT_AVAILABLE:
      case ErrorCode.INVOICE_CANCELLED:
      case ErrorCode.INVOICE_ALREADY_PAID:
      case ErrorCode.CANNOT_DELETE_HAS_REFERENCES:
      case ErrorCode.NO_LOYALTY_ACCOUNT:
      case ErrorCode.NO_CHANGE_NEEDED:
      case ErrorCode.INVALID_STATE_TRANSITION:
      case ErrorCode.APPOINTMENT_NOT_IN_PROGRESS:
        return 422;
      default:
        return 500;
    }
  }

  toJSON() {
    return {
      success: false,
      error: {
        code: this.code,
        message: this.message,
        details: this.details,
      },
    };
  }
}

export function toAppError(error: unknown, context?: string): AppError {
  if (error instanceof AppError) return error;
  if (error instanceof Error) {
    return new AppError(
      ErrorCode.INTERNAL_ERROR,
      context ? `${context}: ${error.message}` : error.message
    );
  }
  return new AppError(ErrorCode.INTERNAL_ERROR, context ?? 'Unknown error');
}