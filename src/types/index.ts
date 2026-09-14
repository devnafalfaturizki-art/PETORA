// Barrel export - Petora Type Definitions

export type { UUID, Timestamp, DateString, TimeString } from './base';
export type {
  BaseEntity,
  SoftDeletable,
  PaginatedResponse,
  ApiResponse,
  ApiError,
  ApiResult,
} from './base';

export type { UserRole, User, SafeUser, LoginCredentials, LoginResponse, Session, CreateUserInput, UpdatePinInput, ResetPinInput, DeactivateUserInput } from './user';

export type { CustomerTag, Customer, CreateCustomerInput, UpdateCustomerInput } from './customer';

export type {
  Pet,
  CreatePetInput,
  UpdatePetInput,
  PetWeightLog,
  PetVaccine,
  PetDisease,
  PetAllergy,
} from './pet';

export type { AppointmentStatus, Appointment, CreateAppointmentInput, UpdateAppointmentStatusInput, UpdateAppointmentInput } from './appointment';

export type { MedicalRecordStatus, MedicalRecord, CreateMedicalRecordInput, UpdateMedicalRecordInput } from './medical-record';

export type {
  RoomStatus,
  RoomCleanliness,
  PetHotelBookingStatus,
  PetHotelLogType,
  Room,
  PetHotelBooking,
  PetHotelLog,
  CreatePetHotelBookingInput,
  CreatePetHotelLogInput,
} from './pet-hotel';

export type {
  GroomingBookingStatus,
  GroomingService,
  GroomingBooking,
  GroomingRecord,
  CreateGroomingBookingInput,
  CreateGroomingRecordInput,
} from './grooming';

export type {
  ProductStatus,
  StockMovementType,
  Category,
  Supplier,
  Product,
  CreateProductInput,
  UpdateProductInput,
  ProductVariant,
  ProductBundle,
  ProductBundleItem,
  StockMovement,
  CreateStockMovementInput,
} from './product';

export type { PurchaseOrderStatus, PurchaseOrder, PurchaseOrderItem, CreatePurchaseOrderInput } from './purchase-order';

export type {
  InvoiceType,
  InvoiceStatus,
  PaymentMethod,
  Invoice,
  InvoiceItem,
  Payment,
  CashShift,
  CreateInvoiceInput,
  RecordPaymentInput,
  CancelInvoiceInput,
} from './invoice';

export type {
  LoyaltyTierName,
  LoyaltyTransactionType,
  LoyaltyTierConfig,
  LoyaltyMember,
  LoyaltyTransaction,
  RedeemPointsInput,
  EarnPointsInput,
} from './loyalty';

export type {
  PromotionType,
  PromotionStatus,
  Promotion,
  PromotionUsage,
  CreatePromotionInput,
  ApplyPromoCodeInput,
} from './promotion';

export type { ExpenseStatus, ExpenseCategory, Expense, CreateExpenseInput, UpdateExpenseInput } from './expense';

export type { FeedbackRating, CustomerFeedback, CreateFeedbackInput } from './feedback';

export type { AuditLog, CreateAuditLogInput } from './audit';

export type { Notification, CreateNotificationInput } from './notification';