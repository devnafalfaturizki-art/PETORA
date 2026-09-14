// Barrel export - Petora Zod Validation Schemas

export {
  uuidSchema,
  timestampSchema,
  dateSchema,
  timeSchema,
} from './base';

export {
  userRoleSchema,
  loginCredentialsSchema,
  createUserSchema,
  updatePinSchema,
  resetPinSchema,
  type LoginCredentialsInput,
  type CreateUserInput,
  type UpdatePinInput,
  type ResetPinInput,
} from './user';

export {
  customerTagSchema,
  createCustomerSchema,
  updateCustomerSchema,
  type CreateCustomerInput,
  type UpdateCustomerInput,
} from './customer';

export {
  createPetSchema,
  updatePetSchema,
  createPetWeightLogSchema,
  createPetVaccineSchema,
  type CreatePetInput,
  type UpdatePetInput,
  type CreatePetWeightLogInput,
  type CreatePetVaccineInput,
} from './pet';

export {
  appointmentStatusSchema,
  createAppointmentSchema,
  updateAppointmentStatusSchema,
  type CreateAppointmentInput,
  type UpdateAppointmentStatusInput,
} from './appointment';

export {
  medicalRecordStatusSchema,
  createMedicalRecordSchema,
  updateMedicalRecordSchema,
  type CreateMedicalRecordInput,
  type UpdateMedicalRecordInput,
} from './medical-record';

export {
  invoiceTypeSchema,
  paymentMethodSchema,
  invoiceItemSchema,
  createInvoiceSchema,
  recordPaymentSchema,
  type CreateInvoiceInput,
  type RecordPaymentInput,
} from './invoice';

export {
  createProductSchema,
  updateProductSchema,
  createStockMovementSchema,
  type CreateProductInput,
  type UpdateProductInput,
  type CreateStockMovementInput,
} from './product';

export {
  createLoyaltyTierSchema,
  redeemPointsSchema,
  type CreateLoyaltyTierInput,
  type RedeemPointsInput,
} from './loyalty';

export {
  promotionTypeSchema,
  createPromotionSchema,
  applyPromoCodeSchema,
  type CreatePromotionInput,
  type ApplyPromoCodeInput,
} from './promotion';