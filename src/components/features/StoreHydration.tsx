'use client';

import { useEffect } from 'react';
import { useAccountStore } from '@/lib/stores/account';
import { useCartStore } from '@/lib/stores/cart';
import { useOrdersStore } from '@/lib/stores/orders';
import { useUiStore } from '@/lib/stores/ui';

/**
 * Persisted stores skip automatic hydration so the first client render matches the server
 * render. This loads them from localStorage once mounted, then flips `hydrated`.
 */
export function StoreHydration() {
  useEffect(() => {
    void Promise.all([
      useCartStore.persist.rehydrate(),
      useAccountStore.persist.rehydrate(),
      useOrdersStore.persist.rehydrate(),
    ]).finally(() => useUiStore.getState().setHydrated());
  }, []);
  return null;
}
