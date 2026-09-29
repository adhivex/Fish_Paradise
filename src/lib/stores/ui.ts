'use client';

import { create } from 'zustand';

interface UiState {
  hydrated: boolean;
  toast: { id: number; message: string; action?: 'cart' } | null;
  setHydrated: () => void;
  showToast: (message: string, action?: 'cart') => void;
  hideToast: () => void;
}

export const useUiStore = create<UiState>()((set) => ({
  hydrated: false,
  toast: null,
  setHydrated: () => set({ hydrated: true }),
  showToast: (message, action) => set({ toast: { id: Date.now(), message, action } }),
  hideToast: () => set({ toast: null }),
}));

/** False during SSR and the first client render, true once persisted stores are loaded. */
export function useHydrated(): boolean {
  return useUiStore((s) => s.hydrated);
}
