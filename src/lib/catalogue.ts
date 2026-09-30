import type { ShopSettings } from '@prisma/client';
import { z } from 'zod';
import { buildPriceBands, filterProducts, type PriceBand, type ProductFilter } from '@/lib/filters';
import type { CatalogueDTO, ProductDTO, ShopSettingsDTO } from '@/lib/types';
import type { CatalogueQuery } from '@/lib/validation';

const priceBandsSchema = z.array(z.number().int().positive()).max(6);

/** Public subset of ShopSettings. A missing row falls back to the schema defaults. */
export function toShopSettingsDTO(row: ShopSettings | null): ShopSettingsDTO {
  const bands = priceBandsSchema.safeParse(row?.priceBandsPaise);
  return {
    shopName: row?.shopName ?? 'Fish Paradise',
    phone: row?.phone ?? null,
    whatsapp: row?.whatsapp ?? null,
    fssaiNumber: row?.fssaiNumber ?? null,
    opensAt: row?.opensAt ?? '07:00',
    closesAt: row?.closesAt ?? '20:00',
    acceptingOrders: row?.acceptingOrders ?? true,
    asapMinMinutes: row?.asapMinMinutes ?? 30,
    asapMaxMinutes: row?.asapMaxMinutes ?? 60,
    autoConfirmCod: row?.autoConfirmCod ?? true,
    priceBandsPaise: bands.success ? bands.data : [],
    deliveryCity: row?.deliveryCity ?? null,
  };
}

/** Turns a validated query into a filter, falling back to defaults for unknown values. */
function normalizeFilter(catalogue: CatalogueDTO, query: CatalogueQuery, bands: PriceBand[]): ProductFilter {
  const category =
    query.category && catalogue.categories.some((c) => c.slug === query.category) ? query.category : 'all';
  const priceBand = query.priceBand && bands.some((b) => b.id === query.priceBand) ? query.priceBand : 'any';
  return { category, query: (query.q ?? '').trim(), sort: query.sort ?? 'rec', priceBand };
}

export interface CatalogueResult {
  filter: ProductFilter;
  priceBands: PriceBand[];
  products: ProductDTO[];
}

/** Search, category, sort and price-band filtering. Runs on the server for the Shop page and API. */
export function queryCatalogue(catalogue: CatalogueDTO, query: CatalogueQuery): CatalogueResult {
  const priceBands = buildPriceBands(catalogue.shop.priceBandsPaise);
  const filter = normalizeFilter(catalogue, query, priceBands);
  return { filter, priceBands, products: filterProducts(catalogue.products, filter, priceBands) };
}

/** Featured products for "Today's fresh catch", in catalogue order. */
export function featuredProducts(catalogue: CatalogueDTO): ProductDTO[] {
  return catalogue.products.filter((p) => p.isFeatured);
}

/** First product of a category, used as the category tile artwork. */
export function categoryCover(catalogue: CatalogueDTO, categorySlug: string): ProductDTO | undefined {
  return catalogue.products.find((p) => p.categorySlug === categorySlug);
}
