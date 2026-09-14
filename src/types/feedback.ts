import type { UUID, Timestamp } from '../base';

export type FeedbackRating = '1' | '2' | '3' | '4' | '5';

export interface CustomerFeedback {
  id: UUID;
  customer_id: UUID;
  invoice_id: UUID | null;
  rating: FeedbackRating;
  comment: string | null;
  nps_score: number | null;
  created_at: Timestamp;
}

export interface CreateFeedbackInput {
  customer_id: UUID;
  invoice_id?: UUID;
  rating: FeedbackRating;
  comment?: string;
  nps_score?: number;
}