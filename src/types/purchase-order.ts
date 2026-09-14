import type { UUID, Timestamp, DateString } from '../base';

export type PurchaseOrderStatus = 'DRAFT' | 'SENT' | 'PARTIAL_RECEIVED' | 'RECEIVED' | 'CANCELLED';

export interface PurchaseOrder {
  id: UUID;
  po_number: string;
  supplier_id: UUID;
  order_date: DateString;
  expected_arrival_date: DateString | null;
  actual_arrival_date: DateString | null;
  total_amount: number;
  status: PurchaseOrderStatus;
  notes: string | null;
  created_by: UUID;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface PurchaseOrderItem {
  id: UUID;
  po_id: UUID;
  product_id: UUID;
  quantity: number;
  unit_price: number;
  received_quantity: number;
  created_at: Timestamp;
}

export interface CreatePurchaseOrderInput {
  supplier_id: UUID;
  order_date: DateString;
  expected_arrival_date?: DateString;
  notes?: string;
  items: Array<{
    product_id: UUID;
    quantity: number;
    unit_price: number;
  }>;
}