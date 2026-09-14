import type { UUID, Timestamp, DateString } from './base';

export type PromotionType = 'PERCENTAGE' | 'FIXED' | 'BUNDLE' | 'HAPPY_HOUR' | 'BIRTHDAY';
export type PromotionStatus = 'ACTIVE' | 'EXPIRED' | 'CANCELLED';

export interface Promotion {
  id: UUID;
  code: string | null;
  name: string;
  description: string | null;
  promotion_type: PromotionType;
  discount_value: number;
  min_purchase: number;
  max_usage: number | null;
  current_usage: number;
  start_date: DateString;
  end_date: DateString;
  applicable_products: UUID[] | null;
  status: PromotionStatus;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface PromotionUsage {
  id: UUID;
  promotion_id: UUID;
  invoice_id: UUID;
  customer_id: UUID | null;
  discount_applied: number;
  used_at: Timestamp;
}

export interface CreatePromotionInput {
  code?: string;
  name: string;
  description?: string;
  promotion_type: PromotionType;
  discount_value: number;
  min_purchase?: number;
  max_usage?: number;
  start_date: DateString;
  end_date: DateString;
  applicable_products?: UUID[];
}

export interface ApplyPromoCodeInput {
  code: string;
  subtotal: number;
  customer_id?: UUID;
}