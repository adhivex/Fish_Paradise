import { formatMoney } from '@/lib/money';
import type { ProductDTO } from '@/lib/types';

export type SortKey = 'rec' | 'low' | 'high' | 'az';

export const SORT_OPTIONS: ReadonlyArray<{ value: SortKey; label: string }> = [
  { value: 'rec', label: 'Recommended' },
  { value: 'low', label: 'Price: low to high' },
  { value: 'high', label: 'Price: high to low' },
  { value: 'az', label: 'Name: A to Z' },
];

/** Price band id: `any`, or `b<index>` where index selects a range between configured bounds. */
export type PriceBandId = string;

export interface PriceBand {
  id: PriceBandId;
  label: string;
  minPaise: number | null; // inclusive
  maxPaise: number | null; // inclusive for middle bands, exclusive for the first band
}

/**
 * Builds bands from `ShopSettings.priceBandsPaise`, e.g. [30000, 60000] →
 * Any price · Under ₹300 · ₹300 – ₹600 · Above ₹600 (matches the approved design).
 */
export function buildPriceBands(boundsPaise: number[]): PriceBand[] {
  const bounds = [...boundsPaise].sort((a, b) => a - b);
  const bands: PriceBand[] = [{ id: 'any', label: 'Any price', minPaise: null, maxPaise: null }];
  if (bounds.length === 0) return bands;
  bands.push({ id: 'b0', label: `Under ${formatMoney(bounds[0]!)}`, minPaise: null, maxPaise: bounds[0]! });
  for (let i = 1; i < bounds.length; i++) {
    bands.push({
      id: `b${i}`,
      label: `${formatMoney(bounds[i - 1]!)} – ${formatMoney(bounds[i]!)}`,
      minPaise: bounds[i - 1]!,
      maxPaise: bounds[i]!,
    });
  }
  const last = bounds[bounds.length - 1]!;
  bands.push({
    id: `b${bounds.length}`,
    label: `Above ${formatMoney(last)}`,
    minPaise: last,
    maxPaise: null,
  });
  return bands;
}

function inBand(price: number, band: PriceBand, isFirst: boolean): boolean {
  if (band.minPaise == null && band.maxPaise == null) return true;
  if (band.minPaise == null) return isFirst ? price < band.maxPaise! : price <= band.maxPaise!;
  if (band.maxPaise == null) return price > band.minPaise;
  return price >= band.minPaise && price <= band.maxPaise;
}

export interface ProductFilter {
  category: string; // 'all' or a category slug
  query: string;
  sort: SortKey;
  priceBand: PriceBandId;
}

export const DEFAULT_FILTER: ProductFilter = { category: 'all', query: '', sort: 'rec', priceBand: 'any' };

export function filterProducts(
  list: readonly ProductDTO[],
  filter: ProductFilter,
  bands: readonly PriceBand[],
): ProductDTO[] {
  const q = filter.query.trim().toLowerCase();
  const band = bands.find((b) => b.id === filter.priceBand) ?? bands[0];
  const isFirst = band?.id === 'b0';
  const out = list.filter(
    (p) =>
      (filter.category === 'all' || p.categorySlug === filter.category) &&
      (!q || p.name.toLowerCase().includes(q)) &&
      (!band || inBand(p.pricePerKgPaise, band, isFirst)),
  );
  switch (filter.sort) {
    case 'low':
      return out.sort((a, b) => a.pricePerKgPaise - b.pricePerKgPaise || a.sortOrder - b.sortOrder);
    case 'high':
      return out.sort((a, b) => b.pricePerKgPaise - a.pricePerKgPaise || a.sortOrder - b.sortOrder);
    case 'az':
      return out.sort((a, b) => a.name.localeCompare(b.name));
    default:
      return out.sort((a, b) => a.sortOrder - b.sortOrder);
  }
}

/** Number of non-default filters inside the sheet (search is not counted). */
export function activeFilterCount(filter: ProductFilter): number {
  return (
    (filter.sort !== 'rec' ? 1 : 0) +
    (filter.priceBand !== 'any' ? 1 : 0) +
    (filter.category !== 'all' ? 1 : 0)
  );
}

/** Shop URL for a filter; defaults are omitted so shared links stay short. */
export function filterToHref(filter: ProductFilter): string {
  const params = new URLSearchParams();
  if (filter.category !== 'all') params.set('category', filter.category);
  if (filter.query.trim()) params.set('q', filter.query.trim());
  if (filter.sort !== 'rec') params.set('sort', filter.sort);
  if (filter.priceBand !== 'any') params.set('priceBand', filter.priceBand);
  const qs = params.toString();
  return qs ? `/shop?${qs}` : '/shop';
}
