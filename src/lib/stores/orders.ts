'use client';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { rupees } from '@/lib/money';
import { orderNumberFromSeq } from '@/lib/orders';
import { sampleAddresses } from '@/lib/mock/catalogue';
import type { OrderDTO, PaymentMethod, SlotChoice } from '@/lib/types';

/** Two delivered orders from the approved design so My orders is not empty on first run. */
function sampleOrders(): OrderDTO[] {
  const address = sampleAddresses[0]!;
  const at1 = new Date(2026, 8, 28, 15, 15).getTime();
  const at2 = new Date(2026, 8, 25, 11, 20).getTime();
  const delivered = (placedAt: number) =>
    (['PLACED', 'CONFIRMED', 'CLEANING_PACKING', 'OUT_FOR_DELIVERY', 'DELIVERED'] as const).map(
      (status, i) => ({
        status,
        at: placedAt + [0, 0, 8, 35, 45][i]! * 60_000,
      }),
    );
  return [
    {
      orderNumber: 'FP1023',
      status: 'DELIVERED',
      placedAt: at1,
      items: [
        {
          productId: 'prod_rohu',
          productSlug: 'rohu',
          nameSnapshot: 'Rohu',
          pricePerKgPaise: rupees(320),
          qtyGrams: 1000,
          cleaningLabel: 'Whole cleaned',
          lineTotalPaise: rupees(320),
        },
        {
          productId: 'prod_white-prawns',
          productSlug: 'white-prawns',
          nameSnapshot: 'White Prawns',
          pricePerKgPaise: rupees(520),
          qtyGrams: 500,
          cleaningLabel: 'Whole cleaned',
          lineTotalPaise: rupees(260),
        },
      ],
      addressSnapshot: address,
      slotLabel: 'ASAP · 30 – 60 mins',
      slotType: 'ASAP',
      subtotalPaise: rupees(580),
      deliveryFeePaise: rupees(40),
      discountPaise: 0,
      totalPaise: rupees(620),
      paymentMethod: 'UPI',
      paymentStatus: 'PAID',
      notes: null,
      events: delivered(at1),
    },
    {
      orderNumber: 'FP1022',
      status: 'DELIVERED',
      placedAt: at2,
      items: [
        {
          productId: 'prod_crab',
          productSlug: 'crab',
          nameSnapshot: 'Crab',
          pricePerKgPaise: rupees(420),
          qtyGrams: 1000,
          cleaningLabel: 'Whole cleaned',
          lineTotalPaise: rupees(420),
        },
      ],
      addressSnapshot: address,
      slotLabel: 'ASAP · 30 – 60 mins',
      slotType: 'ASAP',
      subtotalPaise: rupees(420),
      deliveryFeePaise: rupees(40),
      discountPaise: 0,
      totalPaise: rupees(460),
      paymentMethod: 'COD',
      paymentStatus: 'COD_COLLECTED',
      notes: null,
      events: delivered(at2),
    },
  ];
}

interface CheckoutDraft {
  addressId: string | null;
  slot: SlotChoice;
  paymentMethod: PaymentMethod;
}

interface OrdersState {
  orders: OrderDTO[];
  seq: number;
  draft: CheckoutDraft;
  setDraft: (patch: Partial<CheckoutDraft>) => void;
  /** Mock stand-in for `POST /api/orders` (Phase 5). Returns the new order number. */
  placeOrder: (order: Omit<OrderDTO, 'orderNumber'>) => string;
}

export const useOrdersStore = create<OrdersState>()(
  persist(
    (set, get) => ({
      orders: sampleOrders(),
      seq: 23,
      draft: { addressId: null, slot: { type: 'ASAP' }, paymentMethod: 'UPI' },
      setDraft: (patch) => set((s) => ({ draft: { ...s.draft, ...patch } })),
      placeOrder: (order) => {
        const seq = get().seq + 1;
        const orderNumber = orderNumberFromSeq(seq);
        set((s) => ({ seq, orders: [{ ...order, orderNumber }, ...s.orders] }));
        return orderNumber;
      },
    }),
    {
      name: 'fp-orders',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
    },
  ),
);
