'use client';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { sampleAddresses, sampleCustomer } from '@/lib/mock/catalogue';
import type { AddressDTO } from '@/lib/types';

interface Customer {
  name: string;
  email: string;
  phone: string;
}

interface AccountState {
  /** Mock session until phone + OTP login lands in Phase 3. */
  customer: Customer | null;
  addresses: AddressDTO[];
  favourites: string[]; // product ids
  logIn: () => void;
  logOut: () => void;
  addAddress: (address: Omit<AddressDTO, 'id' | 'isDefault'>) => AddressDTO;
  toggleFavourite: (productId: string) => void;
}

export const useAccountStore = create<AccountState>()(
  persist(
    (set, get) => ({
      customer: sampleCustomer,
      addresses: sampleAddresses,
      favourites: [],
      logIn: () => set({ customer: sampleCustomer }),
      logOut: () => set({ customer: null }),
      addAddress: (input) => {
        const address: AddressDTO = {
          ...input,
          id: `addr_${Date.now()}`,
          isDefault: get().addresses.length === 0,
        };
        set((s) => ({ addresses: [...s.addresses, address] }));
        return address;
      },
      toggleFavourite: (productId) =>
        set((s) => ({
          favourites: s.favourites.includes(productId)
            ? s.favourites.filter((id) => id !== productId)
            : [...s.favourites, productId],
        })),
    }),
    {
      name: 'fp-account',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
    },
  ),
);
