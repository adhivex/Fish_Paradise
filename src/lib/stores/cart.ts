'use client';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { addLine, type CartLine } from '@/lib/cart';
import { clampQty, stepQty } from '@/lib/qty';
import type { ProductDTO } from '@/lib/types';

interface CartState {
  lines: CartLine[];
  notes: string;
  /** `product` supplies availability and quantity rules; prices are never stored in the cart. */
  add: (line: CartLine, product: ProductDTO) => void;
  step: (product: ProductDTO, direction: 1 | -1) => void;
  remove: (productId: string) => void;
  clear: () => void;
  setNotes: (notes: string) => void;
}

/** Guest cart kept in localStorage; merged into the server cart on login (Phase 3). */
export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      notes: '',
      add: (line, product) =>
        set((s) => (product.todayAvailable ? { lines: addLine(s.lines, line, product) } : s)),
      step: (product, direction) =>
        set((s) => ({
          lines: s.lines.map((l) =>
            l.productId === product.id
              ? { ...l, qtyGrams: stepQty(clampQty(l.qtyGrams, product), direction, product) }
              : l,
          ),
        })),
      remove: (productId) => set((s) => ({ lines: s.lines.filter((l) => l.productId !== productId) })),
      clear: () => set({ lines: [], notes: '' }),
      setNotes: (notes) => set({ notes: notes.slice(0, 500) }),
    }),
    {
      name: 'fp-cart',
      // v2: product ids now come from the database; v1 carts held mock ids and are dropped.
      version: 2,
      migrate: () => ({ lines: [], notes: '' }),
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
    },
  ),
);
