import type { UUID, Timestamp, DateString } from './base';

export type ProductStatus = 'ACTIVE' | 'ARCHIVED';
export type StockMovementType = 'IN' | 'OUT' | 'RETURN' | 'ADJUSTMENT' | 'DAMAGED' | 'EXPIRED' | 'OPNAME';

export interface Category {
  id: UUID;
  name: string;
  description: string | null;
  parent_id: UUID | null;
  is_active: boolean;
  created_at: Timestamp;
}

export interface Supplier {
  id: UUID;
  name: string;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  lead_time_days: number | null;
  is_active: boolean;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface Product {
  id: UUID;
  sku: string;
  name: string;
  category_id: UUID | null;
  supplier_id: UUID | null;
  barcode: string | null;
  description: string | null;
  purchase_price: number;
  selling_price: number;
  stock_quantity: number;
  stock_minimum: number;
  stock_maximum: number;
  photo_url: string | null;
  expiry_date: DateString | null;
  status: ProductStatus;
  created_at: Timestamp;
  updated_at: Timestamp;
  deleted_at: Timestamp | null;
}

export interface CreateProductInput {
  sku: string;
  name: string;
  category_id?: UUID;
  supplier_id?: UUID;
  barcode?: string;
  description?: string;
  purchase_price: number;
  selling_price: number;
  stock_quantity?: number;
  stock_minimum?: number;
  stock_maximum?: number;
  photo_url?: string;
  expiry_date?: DateString;
}

export type UpdateProductInput = Partial<Omit<CreateProductInput, 'sku'>>;

export interface ProductVariant {
  id: UUID;
  product_id: UUID;
  variant_name: string;
  variant_value: string;
  price_adjustment: number;
  stock_quantity: number;
  created_at: Timestamp;
}

export interface ProductBundle {
  id: UUID;
  name: string;
  description: string | null;
  bundle_price: number;
  is_active: boolean;
  created_at: Timestamp;
}

export interface ProductBundleItem {
  id: UUID;
  bundle_id: UUID;
  product_id: UUID;
  quantity: number;
}

export interface StockMovement {
  id: UUID;
  product_id: UUID;
  movement_type: StockMovementType;
  quantity: number;
  reference_type: string | null;
  reference_id: UUID | null;
  notes: string | null;
  created_by: UUID;
  created_at: Timestamp;
}

export interface CreateStockMovementInput {
  product_id: UUID;
  movement_type: StockMovementType;
  quantity: number;
  reference_type?: string;
  reference_id?: UUID;
  notes?: string;
}