'use client';

import { useMemo } from 'react';
import { priceCart, type PricedCart } from '@/lib/cart';
import {
  cleaningOptions,
  deliveryZones,
  defaultCleaningOption,
  findZone,
  getProductById,
} from '@/lib/mock/catalogue';
import { useAccountStore } from '@/lib/stores/account';
import { useCartStore } from '@/lib/stores/cart';
import { useOrdersStore } from '@/lib/stores/orders';
import { useUiStore } from '@/lib/stores/ui';
import type { AddressDTO, DeliveryZoneDTO, ProductDTO } from '@/lib/types';

/** Number of distinct lines in the cart (badge count). */
export function useCartCount(): number {
  const hydrated = useUiStore((s) => s.hydrated);
  const count = useCartStore((s) => s.lines.length);
  return hydrated ? count : 0;
}

/** Address chosen at checkout (falls back to the default address). */
export function useSelectedAddress(): AddressDTO | undefined {
  const addresses = useAccountStore((s) => s.addresses);
  const addressId = useOrdersStore((s) => s.draft.addressId);
  return addresses.find((a) => a.id === addressId) ?? addresses.find((a) => a.isDefault) ?? addresses[0];
}

/** Delivery zone for the selected address, or undefined if the pincode is not serviceable. */
export function useDeliveryZone(): { address: AddressDTO | undefined; zone: DeliveryZoneDTO | undefined } {
  const address = useSelectedAddress();
  return { address, zone: address ? findZone(address.pincode) : undefined };
}

/**
 * Cart priced from the (mock) catalogue. Phase 4 replaces this with server totals from
 * `GET /api/cart`; components only read the result.
 */
export function usePricedCart(): PricedCart {
  const lines = useCartStore((s) => s.lines);
  const { zone } = useDeliveryZone();
  const rule = zone ?? deliveryZones[0]!;
  return useMemo(
    () => priceCart(lines, { product: getProductById, cleaning: cleaningOptions }, rule),
    [lines, rule],
  );
}

/** Quick-add from lists: 1 kg (as in the approved design), default cleaning, then a toast. */
const QUICK_ADD_GRAMS = 1000;

export function useQuickAdd(): (product: ProductDTO) => void {
  const add = useCartStore((s) => s.add);
  const showToast = useUiStore((s) => s.showToast);
  return (product) => {
    if (!product.todayAvailable) return;
    add({ productId: product.id, qtyGrams: QUICK_ADD_GRAMS, cleaningOptionId: defaultCleaningOption().id });
    showToast(`${product.name} added to cart`, 'cart');
  };
}
