'use client';

import useSWR from 'swr';
import { fetcher } from '@/lib/client/api';

export interface ClientUser {
  id: string;
  phone: string;
  name: string | null;
  email: string | null;
  role: 'CUSTOMER' | 'ADMIN';
}

/** Current user from `/api/me` (null = guest). Pages stay static; the session loads client-side. */
export function useSession() {
  const { data, isLoading, mutate } = useSWR<{ user: ClientUser | null }>('/api/me', fetcher, {
    revalidateOnFocus: true,
    shouldRetryOnError: false,
  });
  return {
    user: data?.user ?? null,
    loading: isLoading && !data,
    refresh: () => mutate(),
    setUser: (user: ClientUser | null) => mutate({ user }, { revalidate: false }),
  };
}
