/**
 * Client-facing DTOs. They mirror the Prisma models but only carry what the UI needs, so the
 * Phase 2 API can return the same shapes and the components do not change.
 */

export type CategorySlug = string;

export interface CategoryDTO {
  id: string;
  slug: CategorySlug;
  name: string;
  sortOrder: number;
}

export interface ProductDTO {
  id: string;
  slug: string;
  name: string;
  categorySlug: CategorySlug;
  note: string | null;
  description: string | null;
  imageUrl: string | null;
  pricePerKgPaise: number;
  minQtyGrams: number;
  stepGrams: number;
  maxQtyGrams: number;
  todayAvailable: boolean;
  stockGrams: number | null;
  isFeatured: boolean;
  sortOrder: number;
}

export interface CleaningOptionDTO {
  id: string;
  label: string;
  requiresNote: boolean;
  extraPaise: number;
  isDefault: boolean;
  sortOrder: number;
}

export interface DeliveryZoneDTO {
  pincode: string;
  areaName: string;
  deliveryFeePaise: number;
  freeAbovePaise: number | null;
  minOrderPaise: number;
}

export interface SlotTemplateDTO {
  id: string;
  label: string;
  startTime: string; // "17:00"
  endTime: string; // "18:00"
}

export interface ShopSettingsDTO {
  shopName: string;
  phone: string | null;
  whatsapp: string | null;
  fssaiNumber: string | null;
  opensAt: string;
  closesAt: string;
  acceptingOrders: boolean;
  asapMinMinutes: number;
  asapMaxMinutes: number;
  autoConfirmCod: boolean;
  priceBandsPaise: number[];
  deliveryCity: string | null;
}

/** Everything the storefront needs to render: returned by the cached catalogue service. */
export interface CatalogueDTO {
  categories: CategoryDTO[];
  products: ProductDTO[];
  cleaningOptions: CleaningOptionDTO[];
  shop: ShopSettingsDTO;
}

export interface AddressDTO {
  id: string;
  label: string;
  line1: string;
  line2?: string;
  landmark?: string;
  area?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

export type OrderStatus =
  'PLACED' | 'CONFIRMED' | 'CLEANING_PACKING' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED';

export type PaymentMethod = 'UPI' | 'CARD' | 'NETBANKING' | 'COD';

export type PaymentStatus =
  'PENDING' | 'PAID' | 'FAILED' | 'REFUND_PENDING' | 'REFUNDED' | 'COD_PENDING' | 'COD_COLLECTED';

export type SlotChoice = { type: 'ASAP' } | { type: 'SCHEDULED'; templateId: string; date: string };

export interface OrderItemDTO {
  productId: string;
  productSlug: string;
  productImageUrl: string | null;
  nameSnapshot: string;
  pricePerKgPaise: number;
  qtyGrams: number;
  cleaningLabel: string;
  lineNote: string | null;
  lineTotalPaise: number;
}

export interface OrderEventDTO {
  status: OrderStatus;
  at: number; // epoch ms
  note: string | null;
}

export interface OrderDTO {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  placedAt: number;
  items: OrderItemDTO[];
  addressSnapshot: AddressDTO;
  slotLabel: string;
  slotType: 'ASAP' | 'SCHEDULED';
  subtotalPaise: number;
  deliveryFeePaise: number;
  discountPaise: number;
  totalPaise: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  notes: string | null;
  cancelReason: string | null;
  etaMinMinutes: number | null;
  etaMaxMinutes: number | null;
  events: OrderEventDTO[];
  canCancel: boolean;
}
