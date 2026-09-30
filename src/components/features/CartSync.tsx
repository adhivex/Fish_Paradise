'use client';

import { useEffect } from 'react';
import { api } from '@/lib/client/api';
import { useSession } from '@/lib/client/session';
import type { CartLine } from '@/lib/cart';
import { useCartStore } from '@/lib/stores/cart';
import { useUiStore } from '@/lib/stores/ui';

interface ServerCart {
  items: CartLine[];
  notes: string;
  couponCode: string | null;
}

let pending: Promise<unknown> | null = null;
let timer: ReturnType<typeof setTimeout> | undefined;
let activeUser: string | null = null;

function localCart(): ServerCart {
  const s = useCartStore.getState();
  return { items: s.lines, notes: s.notes, couponCode: s.couponCode };
}

function track<T>(p: Promise<T>): Promise<T> {
  pending = p;
  void p.finally(() => {
    if (pending === p) pending = null;
  });
  return p;
}

async function push(): Promise<void> {
  if (!activeUser) return;
  await track(api<ServerCart>('/api/cart', { method: 'PUT', body: localCart() }).catch(() => undefined));
}

/** Waits until the latest local cart has reached the server (called before placing an order). */
export async function flushCartSync(): Promise<void> {
  clearTimeout(timer);
  if (pending) await pending;
  await push();
}

/**
 * Keeps the localStorage cart and the server cart in step for logged-in customers.
 * - Guest cart + login → merged into the server cart (once; `ownerId` remembers it).
 * - Same user on a later visit → local edits are pushed (local is the latest copy).
 * - A different user's leftover cart → replaced by this user's server cart.
 * Guests keep a local-only cart.
 */
export function CartSync() {
  const hydrated = useUiStore((s) => s.hydrated);
  const { user, loading } = useSession();

  useEffect(() => {
    if (!hydrated || loading) return;
    const store = useCartStore.getState();
    if (!user) {
      if (store.ownerId) store.adopt({ items: [], notes: '', couponCode: null }, null);
      activeUser = null;
      return;
    }
    if (activeUser === user.id) return;
    activeUser = user.id;
    if (store.ownerId === user.id) {
      void push();
    } else if (store.ownerId === null && store.lines.length > 0) {
      void track(
        api<ServerCart>('/api/cart/merge', { body: localCart() })
          .then((server) => useCartStore.getState().adopt(server, user.id))
          .catch(() => {}),
      );
    } else {
      void track(
        api<ServerCart>('/api/cart')
          .then((server) => useCartStore.getState().adopt(server, user.id))
          .catch(() => {}),
      );
    }
  }, [hydrated, loading, user]);

  useEffect(
    () =>
      useCartStore.subscribe((state, prev) => {
        if (state.revision === prev.revision || !activeUser) return;
        clearTimeout(timer);
        timer = setTimeout(() => void push(), 400);
      }),
    [],
  );

  return null;
}
