import { describe, expect, it } from 'vitest';
import { fixtureCatalogue } from '@/test/fixtures';
import { categoryCover, featuredProducts, queryCatalogue, toShopSettingsDTO } from './catalogue';

const catalogue = fixtureCatalogue();
const slugs = (q: Parameters<typeof queryCatalogue>[1]) =>
  queryCatalogue(catalogue, q).products.map((p) => p.slug);

describe('queryCatalogue', () => {
  it('returns all products in sort order by default', () => {
    const r = queryCatalogue(catalogue, {});
    expect(r.filter).toEqual({ category: 'all', query: '', sort: 'rec', priceBand: 'any' });
    expect(r.products).toHaveLength(9);
    expect(r.priceBands.map((b) => b.label)).toEqual([
      'Any price',
      'Under ₹300',
      '₹300 – ₹600',
      'Above ₹600',
    ]);
  });

  it('combines category, search, band and sort', () => {
    expect(slugs({ category: 'fish', priceBand: 'b1', sort: 'high' })).toEqual(['hilsa', 'rohu']);
    expect(slugs({ q: 'prawn', sort: 'low' })).toEqual(['white-prawns', 'tiger-prawns']);
    expect(slugs({ category: 'crab', q: 'rohu' })).toEqual([]);
  });

  it('falls back to defaults for unknown category and band', () => {
    const r = queryCatalogue(catalogue, { category: 'lobster', priceBand: 'b9' });
    expect(r.filter).toMatchObject({ category: 'all', priceBand: 'any' });
    expect(r.products).toHaveLength(9);
  });

  it('trims the search text', () => {
    expect(queryCatalogue(catalogue, { q: '  crab ' }).filter.query).toBe('crab');
  });

  it('uses price bands from shop settings', () => {
    const custom = { ...catalogue, shop: { ...catalogue.shop, priceBandsPaise: [50000] } };
    expect(queryCatalogue(custom, { priceBand: 'b1' }).products.map((p) => p.slug)).toEqual([
      'pomfret',
      'seer-fish',
      'hilsa',
      'tiger-prawns',
      'white-prawns',
    ]);
  });
});

describe('featuredProducts / categoryCover', () => {
  it('lists featured products in catalogue order', () => {
    expect(featuredProducts(catalogue).map((p) => p.slug)).toEqual([
      'rohu',
      'pomfret',
      'tiger-prawns',
      'crab',
    ]);
  });

  it('picks the first product of a category as its cover', () => {
    expect(categoryCover(catalogue, 'prawns')?.slug).toBe('tiger-prawns');
    expect(categoryCover(catalogue, 'lobster')).toBeUndefined();
  });
});

describe('toShopSettingsDTO', () => {
  it('uses defaults when the settings row is missing', () => {
    expect(toShopSettingsDTO(null)).toMatchObject({
      shopName: 'Fish Paradise',
      priceBandsPaise: [],
      phone: null,
    });
  });

  it('ignores malformed price bands', () => {
    const row = {
      ...catalogue.shop,
      id: 'shop',
      gstin: null,
      unpaidCancelMinutes: 30,
      priceBandsPaise: ['x'],
    };
    expect(toShopSettingsDTO(row).priceBandsPaise).toEqual([]);
  });
});
