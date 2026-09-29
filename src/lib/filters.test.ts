import { describe, expect, it } from 'vitest';
import { products } from '@/lib/mock/catalogue';
import { activeFilterCount, buildPriceBands, DEFAULT_FILTER, filterProducts } from './filters';

const bands = buildPriceBands([30000, 60000]);
const names = (f: Partial<typeof DEFAULT_FILTER>) =>
  filterProducts(products, { ...DEFAULT_FILTER, ...f }, bands).map((p) => p.slug);

describe('buildPriceBands', () => {
  it('matches the design labels', () => {
    expect(bands.map((b) => b.label)).toEqual(['Any price', 'Under ₹300', '₹300 – ₹600', 'Above ₹600']);
  });

  it('handles no configured bounds', () => {
    expect(buildPriceBands([])).toHaveLength(1);
  });
});

describe('filterProducts', () => {
  it('returns everything in recommended order by default', () => {
    expect(names({})).toEqual([
      'rohu',
      'pomfret',
      'seer-fish',
      'tilapia',
      'hilsa',
      'mackerel',
      'tiger-prawns',
      'white-prawns',
      'crab',
    ]);
  });

  it('filters by category', () => {
    expect(names({ category: 'prawns' })).toEqual(['tiger-prawns', 'white-prawns']);
  });

  it('searches case-insensitively', () => {
    expect(names({ query: '  PRAWN ' })).toEqual(['tiger-prawns', 'white-prawns']);
  });

  it('filters by price band', () => {
    expect(names({ priceBand: 'b0' })).toEqual(['tilapia', 'mackerel']);
    expect(names({ priceBand: 'b1' })).toEqual(['rohu', 'hilsa', 'white-prawns', 'crab']);
    expect(names({ priceBand: 'b2' })).toEqual(['pomfret', 'seer-fish', 'tiger-prawns']);
  });

  it('sorts by price and name', () => {
    expect(names({ sort: 'low' }).slice(0, 2)).toEqual(['mackerel', 'tilapia']);
    expect(names({ sort: 'high' })[0]).toBe('tiger-prawns');
    expect(names({ sort: 'az' })[0]).toBe('crab');
  });
});

describe('activeFilterCount', () => {
  it('counts non-default sheet filters', () => {
    expect(activeFilterCount(DEFAULT_FILTER)).toBe(0);
    expect(activeFilterCount({ ...DEFAULT_FILTER, sort: 'low', category: 'crab', query: 'x' })).toBe(2);
  });
});
