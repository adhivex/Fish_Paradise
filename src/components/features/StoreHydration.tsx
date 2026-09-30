'use client';

import { useEffect } from 'react';
import { useCartStore } from '@/lib/stores/cart';
import { useCheckoutStore } from '@/lib/stores/checkout';
import { useUiStore } from '@/lib/stores/ui';

/**
 * Persisted stores skip automatic hydration so the first client render matches the server
 * render. This loads them from localStorage once mounted, then flips `hydrated`.
 */
export function StoreHydration() {
  useEffect(() => {
    void Promise.all([useCartStore.persist.rehydrate(), useCheckoutStore.persist.rehydrate()]).finally(() =>
      useUiStore.getState().setHydrated(),
    );
  }, []);
  return null;
}
