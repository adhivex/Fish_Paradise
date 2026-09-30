'use client';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { addLine, type CartLine } from '@/lib/cart';
import type { ProductDTO } from '@/lib/types';

export interface StepRules {
  minQtyGrams: number;
  stepGrams: number;
  maxAllowedGrams: number;
}

interface CartState {
  lines: CartLine[];
  notes: string;
  couponCode: string | null;
  /** User whose server cart this mirrors; null = guest cart (merged on next login). */
  ownerId: string | null;
  /** Bumped on every local edit; the sync layer pushes these to the server cart. */
  revision: number;
  /** `product` supplies availability and quantity rules; prices are never stored in the cart. */
  add: (line: CartLine, product: ProductDTO) => void;
  step: (productId: string, direction: 1 | -1, rules: StepRules) => void;
  remove: (productId: string) => void;
  clear: () => void;
  setNotes: (notes: string) => void;
  setCoupon: (code: string | null) => void;
  /** Replace with the server's view (after merge/sync) without triggering another sync. */
  adopt: (
    state: { items: CartLine[]; notes: string; couponCode: string | null },
    ownerId: string | null,
  ) => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      notes: '',
      couponCode: null,
      ownerId: null,
      revision: 0,
      add: (line, product) =>
        set((s) =>
          product.todayAvailable ? { lines: addLine(s.lines, line, product), revision: s.revision + 1 } : s,
        ),
      step: (productId, direction, rules) =>
        set((s) => ({
          revision: s.revision + 1,
          lines: s.lines.map((l) => {
            if (l.productId !== productId) return l;
            const next = l.qtyGrams + direction * rules.stepGrams;
            return { ...l, qtyGrams: Math.min(rules.maxAllowedGrams, Math.max(rules.minQtyGrams, next)) };
          }),
        })),
      remove: (productId) =>
        set((s) => ({ lines: s.lines.filter((l) => l.productId !== productId), revision: s.revision + 1 })),
      clear: () => set((s) => ({ lines: [], notes: '', couponCode: null, revision: s.revision + 1 })),
      setNotes: (notes) => set((s) => ({ notes: notes.slice(0, 500), revision: s.revision + 1 })),
      setCoupon: (code) =>
        set((s) => ({ couponCode: code?.trim().toUpperCase() || null, revision: s.revision + 1 })),
      adopt: ({ items, notes, couponCode }, ownerId) => set({ lines: items, notes, couponCode, ownerId }),
    }),
    {
      name: 'fp-cart',
      // v3: coupon code + line notes. Earlier versions held mock ids and are dropped.
      version: 3,
      migrate: () => ({ lines: [], notes: '', couponCode: null, ownerId: null, revision: 0 }),
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (s) => ({
        lines: s.lines,
        notes: s.notes,
        couponCode: s.couponCode,
        ownerId: s.ownerId,
        revision: s.revision,
      }),
    },
  ),
);
