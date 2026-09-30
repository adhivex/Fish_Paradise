'use client';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { PaymentMethod, SlotChoice } from '@/lib/types';

interface CheckoutDraft {
  addressId: string | null;
  slot: SlotChoice | null;
  paymentMethod: PaymentMethod;
  setAddress: (id: string | null) => void;
  setSlot: (slot: SlotChoice | null) => void;
  setPaymentMethod: (m: PaymentMethod) => void;
  reset: () => void;
}

/** Choices made during checkout, kept across reloads. Only ids – the server validates everything. */
export const useCheckoutStore = create<CheckoutDraft>()(
  persist(
    (set) => ({
      addressId: null,
      slot: null,
      paymentMethod: 'UPI',
      setAddress: (addressId) => set({ addressId }),
      setSlot: (slot) => set({ slot }),
      setPaymentMethod: (paymentMethod) => set({ paymentMethod }),
      reset: () => set({ slot: null }),
    }),
    { name: 'fp-checkout', version: 1, storage: createJSONStorage(() => localStorage), skipHydration: true },
  ),
);
