'use client';

import useSWR from 'swr';
import type { CartQuote } from '@/lib/cart';
import { api, fetcher } from '@/lib/client/api';
import { useSession } from '@/lib/client/session';
import type { OrderFilter } from '@/lib/orders';
import type { SlotAvailability } from '@/lib/slots';
import { useCartStore } from '@/lib/stores/cart';
import { useUiStore } from '@/lib/stores/ui';
import type { AddressDTO, OrderDTO } from '@/lib/types';

export interface ClientAddress extends AddressDTO {
  serviceable: boolean;
}

/**
 * Server-priced quote for the current cart (guest or logged in). Every total in the UI comes
 * from here, so it always matches what the server will charge.
 */
export function useQuote(addressId?: string | null) {
  const hydrated = useUiStore((s) => s.hydrated);
  const lines = useCartStore((s) => s.lines);
  const couponCode = useCartStore((s) => s.couponCode);
  const key = hydrated ? JSON.stringify({ lines, couponCode, addressId: addressId ?? null }) : null;
  const { data, error, isLoading, isValidating, mutate } = useSWR<CartQuote>(
    key && ['quote', key],
    () =>
      api<CartQuote>('/api/cart/quote', { body: { items: lines, couponCode, addressId: addressId ?? null } }),
    { keepPreviousData: true, revalidateOnFocus: true },
  );
  return {
    quote: data,
    error: error as Error | undefined,
    loading: !hydrated || (isLoading && !data),
    updating: isValidating,
    retry: () => mutate(),
  };
}

export function useAddresses() {
  const { user } = useSession();
  const { data, error, isLoading, mutate } = useSWR<{ addresses: ClientAddress[] }>(
    user ? '/api/addresses' : null,
    fetcher,
  );
  return {
    addresses: data?.addresses ?? [],
    loading: isLoading && !data,
    error: error as Error | undefined,
    mutate,
  };
}

export function useSlots() {
  const { data, error, isLoading, mutate } = useSWR<SlotAvailability>('/api/slots', fetcher, {
    refreshInterval: 60_000,
  });
  return {
    slots: data,
    loading: isLoading && !data,
    error: error as Error | undefined,
    retry: () => mutate(),
  };
}

export function useOrders(filter: OrderFilter) {
  const { user } = useSession();
  const { data, error, isLoading, mutate } = useSWR<{ orders: OrderDTO[] }>(
    user ? `/api/orders?status=${encodeURIComponent(filter)}` : null,
    fetcher,
    { refreshInterval: 30_000 },
  );
  return {
    orders: data?.orders ?? [],
    loading: isLoading && !data,
    error: error as Error | undefined,
    retry: () => mutate(),
  };
}

/** Order detail; polls while the order is still moving so the timeline updates live. */
export function useOrder(orderNumber: string, fastPoll = false) {
  const { data, error, isLoading, mutate } = useSWR<{ order: OrderDTO }>(
    `/api/orders/${orderNumber}`,
    fetcher,
    {
      refreshInterval: (latest) => {
        const s = latest?.order.status;
        if (s === 'DELIVERED' || s === 'CANCELLED') return 0;
        return fastPoll ? 3000 : 20_000;
      },
    },
  );
  return {
    order: data?.order,
    loading: isLoading && !data,
    error: error as (Error & { status?: number }) | undefined,
    mutate,
  };
}

export function useFavourites() {
  const { user } = useSession();
  const { data, mutate } = useSWR<{ productIds: string[] }>(user ? '/api/favorites' : null, fetcher);
  const ids = data?.productIds ?? [];
  return {
    ids,
    loggedIn: !!user,
    toggle: async (productId: string) => {
      const on = ids.includes(productId);
      const next = on ? ids.filter((i) => i !== productId) : [...ids, productId];
      await mutate(
        async () => {
          await api(`/api/favorites/${productId}`, { method: on ? 'DELETE' : 'POST' });
          return { productIds: next };
        },
        { optimisticData: { productIds: next }, rollbackOnError: true, revalidate: false },
      );
    },
  };
}
