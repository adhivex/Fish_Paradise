'use client';

import { useCatalogue } from '@/components/features/CatalogueProvider';
import { useCartStore } from '@/lib/stores/cart';
import { useUiStore } from '@/lib/stores/ui';
import type { ProductDTO } from '@/lib/types';

/** Number of distinct lines in the cart (badge count). */
export function useCartCount(): number {
  const hydrated = useUiStore((s) => s.hydrated);
  const count = useCartStore((s) => s.lines.length);
  return hydrated ? count : 0;
}

/** Quick-add from lists: 1 kg (as in the approved design), default cleaning, then a toast. */
const QUICK_ADD_GRAMS = 1000;

export function useQuickAdd(): (product: ProductDTO) => void {
  const add = useCartStore((s) => s.add);
  const showToast = useUiStore((s) => s.showToast);
  const { defaultCleaning } = useCatalogue();
  return (product) => {
    if (!product.todayAvailable || !defaultCleaning) return;
    add({ productId: product.id, qtyGrams: QUICK_ADD_GRAMS, cleaningOptionId: defaultCleaning.id }, product);
    showToast(`${product.name} added to cart`, 'cart');
  };
}
