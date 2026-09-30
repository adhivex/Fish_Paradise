'use client';

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import type { CatalogueDTO, CleaningOptionDTO, ProductDTO } from '@/lib/types';

interface CatalogueContextValue extends CatalogueDTO {
  productById: (id: string) => ProductDTO | undefined;
  defaultCleaning: CleaningOptionDTO | undefined;
}

const CatalogueContext = createContext<CatalogueContextValue | null>(null);

/** Makes the server-loaded catalogue (prices from the database) available to client components. */
export function CatalogueProvider({ catalogue, children }: { catalogue: CatalogueDTO; children: ReactNode }) {
  const value = useMemo<CatalogueContextValue>(() => {
    const byId = new Map(catalogue.products.map((p) => [p.id, p]));
    return {
      ...catalogue,
      productById: (id) => byId.get(id),
      defaultCleaning: catalogue.cleaningOptions.find((o) => o.isDefault) ?? catalogue.cleaningOptions[0],
    };
  }, [catalogue]);
  return <CatalogueContext.Provider value={value}>{children}</CatalogueContext.Provider>;
}

export function useCatalogue(): CatalogueContextValue {
  const ctx = useContext(CatalogueContext);
  if (!ctx) throw new Error('useCatalogue must be used inside <CatalogueProvider>');
  return ctx;
}
