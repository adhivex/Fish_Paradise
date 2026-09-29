'use client';

import { useOrdersStore } from '@/lib/stores/orders';
import { useHydrated } from '@/lib/stores/ui';
import type { OrderDTO } from '@/lib/types';

/** Order by number from the mock store; `loading` until persisted state is loaded. */
export function useOrder(orderNumber: string): { loading: boolean; order: OrderDTO | undefined } {
  const hydrated = useHydrated();
  const order = useOrdersStore((s) => s.orders.find((o) => o.orderNumber === orderNumber));
  return { loading: !hydrated, order: hydrated ? order : undefined };
}
