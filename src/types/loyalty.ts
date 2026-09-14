import type { UUID, Timestamp } from '../base';

export type LoyaltyTierName = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
export type LoyaltyTransactionType = 'EARN' | 'REDEEM' | 'EXPIRE' | 'ADJUST';

export interface LoyaltyTierConfig {
  id: UUID;
  tier_name: LoyaltyTierName;
  min_points: number;
  min_spending: number;
  point_multiplier: number;
  benefits: Record<string, unknown>;
  created_at: Timestamp;
}

export interface LoyaltyMember {
  id: UUID;
  customer_id: UUID;
  tier_id: UUID | null;
  total_points: number;
  available_points: number;
  total_spending: number;
  joined_at: Timestamp;
  updated_at: Timestamp;
}

export interface LoyaltyTransaction {
  id: UUID;
  member_id: UUID;
  transaction_type: LoyaltyTransactionType;
  points: number;
  invoice_id: UUID | null;
  description: string | null;
  created_at: Timestamp;
}

export interface RedeemPointsInput {
  customer_id: UUID;
  points_to_redeem: number;
  invoice_id?: UUID;
}

export interface EarnPointsInput {
  customer_id: UUID;
  invoice_id: UUID;
  total_amount: number;
}