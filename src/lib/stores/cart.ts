'use client';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { addLine, type CartLine } from '@/lib/cart';
import { getProductById } from '@/lib/mock/catalogue';
import { clampQty, stepQty } from '@/lib/qty';

interface CartState {
  lines: CartLine[];
  notes: string;
  add: (line: CartLine) => void;
  step: (productId: string, direction: 1 | -1) => void;
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
      add: (line) =>
        set((s) => {
          const product = getProductById(line.productId);
          if (!product || !product.todayAvailable) return s;
          return { lines: addLine(s.lines, line, product) };
        }),
      step: (productId, direction) =>
        set((s) => ({
          lines: s.lines.map((l) => {
            const product = getProductById(l.productId);
            return l.productId === productId && product
              ? { ...l, qtyGrams: stepQty(clampQty(l.qtyGrams, product), direction, product) }
              : l;
          }),
        })),
      remove: (productId) => set((s) => ({ lines: s.lines.filter((l) => l.productId !== productId) })),
      clear: () => set({ lines: [], notes: '' }),
      setNotes: (notes) => set({ notes: notes.slice(0, 500) }),
    }),
    {
      name: 'fp-cart',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
    },
  ),
);
