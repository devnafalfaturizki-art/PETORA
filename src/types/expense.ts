import type { UUID, Timestamp, DateString } from './base';

export type ExpenseStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'REVERSED';

export interface ExpenseCategory {
  id: UUID;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: Timestamp;
}

export interface Expense {
  id: UUID;
  expense_date: DateString;
  category_id: UUID;
  amount: number;
  description: string | null;
  receipt_url: string | null;
  status: ExpenseStatus;
  is_recurring: boolean;
  recurring_day: number | null;
  created_by: UUID;
  approved_by: UUID | null;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface CreateExpenseInput {
  expense_date: DateString;
  category_id: UUID;
  amount: number;
  description?: string;
  receipt_url?: string;
  is_recurring?: boolean;
  recurring_day?: number;
}

export interface UpdateExpenseInput {
  expense_date?: DateString;
  category_id?: UUID;
  amount?: number;
  description?: string;
  receipt_url?: string;
  is_recurring?: boolean;
  recurring_day?: number;
}