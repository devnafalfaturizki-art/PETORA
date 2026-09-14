import { createStore } from 'solid-js/store';
import type { UUID } from '@/types/base';
import type { Product } from '@/types/product';
import type { LoyaltyMember } from '@/types/loyalty';

export interface CartItem {
  product_id: UUID;
  name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  image_url?: string | null;
}

export interface CustomerInfo {
  id: UUID;
  name: string;
  phone?: string | null;
  loyalty_member?: LoyaltyMember | null;
}

export interface CartState {
  items: CartItem[];
  discount: number;
  tax: number;
  customerId: UUID | null;
  customerInfo: CustomerInfo | null;
  promotionId: UUID | null;
  promotionCode: string | null;
  promotionDiscount: number;
  loyaltyPointsToRedeem: number;
  loyaltyDiscount: number;
  notes: string | null;
}

const initialCart: CartState = {
  items: [],
  discount: 0,
  tax: 0,
  customerId: null,
  customerInfo: null,
  promotionId: null,
  promotionCode: null,
  promotionDiscount: 0,
  loyaltyPointsToRedeem: 0,
  loyaltyDiscount: 0,
  notes: null,
};

const [cart, setCart] = createStore<CartState>(initialCart);

export const useCartStore = () => ({
  cart,
  addItem: (product: Product, quantity: number = 1) => {
    const existingIndex = cart.items.findIndex(
      (i) => i.product_id === product.id
    );
    const totalPrice = product.selling_price * quantity;
    if (existingIndex >= 0) {
      setCart('items', (items) => {
        const updated = [...items];
        const existing = updated[existingIndex];
        const newQuantity = existing.quantity + quantity;
        updated[existingIndex] = {
          ...existing,
          quantity: newQuantity,
          total_price: product.selling_price * newQuantity,
        };
        return updated;
      });
    } else {
      setCart('items', (items) => [
        ...items,
        {
          product_id: product.id,
          name: product.name,
          quantity,
          unit_price: product.selling_price,
          total_price: totalPrice,
          image_url: product.photo_url,
        },
      ]);
    }
  },
  removeItem: (productId: UUID) => {
    setCart('items', (items) => items.filter((i) => i.product_id !== productId));
  },
  updateQuantity: (productId: UUID, quantity: number) => {
    const index = cart.items.findIndex((i) => i.product_id === productId);
    if (index >= 0) {
      const item = cart.items[index];
      setCart('items', index, 'quantity', Math.max(0, quantity));
      setCart('items', index, 'total_price', item.unit_price * Math.max(0, quantity));
    }
  },
  setCustomer: (customer: CustomerInfo | null) => {
    setCart('customerId', customer?.id ?? null);
    setCart('customerInfo', customer);
  },
  setDiscount: (discount: number) => setCart('discount', discount),
  setTax: (tax: number) => setCart('tax', tax),
  setPromotion: (promotionId: UUID | null, code: string | null, discount: number) => {
    setCart('promotionId', promotionId);
    setCart('promotionCode', code);
    setCart('promotionDiscount', discount);
  },
  setLoyaltyPoints: (points: number, pointValue: number) => {
    setCart('loyaltyPointsToRedeem', points);
    setCart('loyaltyDiscount', points * pointValue);
  },
  setNotes: (notes: string | null) => setCart('notes', notes),
  clearCart: () => setCart(initialCart),
  get subtotal() {
    return cart.items.reduce((sum, item) => sum + item.total_price, 0);
  },
  get totalDiscount() {
    return cart.discount + cart.promotionDiscount + cart.loyaltyDiscount;
  },
  get total() {
    const subtotal = cart.items.reduce((sum, item) => sum + item.total_price, 0);
    return subtotal - this.totalDiscount + cart.tax;
  },
  get itemCount() {
    return cart.items.reduce((sum, item) => sum + item.quantity, 0);
  },
});
