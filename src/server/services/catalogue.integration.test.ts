import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { queryCatalogue } from '@/lib/catalogue';
import { db } from '@/server/db';

// Outside Next there is no incremental cache: run the loader directly.
vi.mock('next/cache', () => ({ unstable_cache: <T>(fn: T) => fn }));
const { getCatalogue } = await import('./catalogue');

/**
 * Requires a migrated + seeded database (`pnpm db:migrate && pnpm db:seed`).
 * Temporarily flips flags on seeded rows and restores them afterwards.
 */
describe('catalogue service (database)', () => {
  const original = new Map<string, { todayAvailable: boolean; isActive: boolean }>();

  beforeAll(async () => {
    for (const slug of ['crab', 'mackerel']) {
      const p = await db.product.findUniqueOrThrow({ where: { slug } });
      original.set(slug, { todayAvailable: p.todayAvailable, isActive: p.isActive });
    }
  });

  afterAll(async () => {
    for (const [slug, flags] of original) await db.product.update({ where: { slug }, data: flags });
    await db.$disconnect();
  });

  it('loads the seeded catalogue with prices in paise', async () => {
    const c = await getCatalogue();
    expect(c.categories.map((x) => x.slug)).toEqual(['fish', 'prawns', 'crab']);
    expect(c.products.map((p) => p.slug)).toEqual([
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
    expect(c.products.find((p) => p.slug === 'pomfret')).toMatchObject({
      pricePerKgPaise: 65000,
      categorySlug: 'fish',
      minQtyGrams: 500,
      stepGrams: 500,
    });
    expect(c.cleaningOptions.map((o) => o.label)).toEqual([
      'Whole cleaned',
      'Curry cut',
      'Fry cut',
      'Custom cut',
    ]);
    expect(c.shop.priceBandsPaise).toEqual([30000, 60000]);
  });

  it('filters and sorts database rows on the server', async () => {
    const c = await getCatalogue();
    expect(
      queryCatalogue(c, { category: 'fish', sort: 'low', priceBand: 'b0' }).products.map((p) => p.slug),
    ).toEqual(['mackerel', 'tilapia']);
    expect(queryCatalogue(c, { q: 'PRAWN', sort: 'high' }).products.map((p) => p.slug)).toEqual([
      'tiger-prawns',
      'white-prawns',
    ]);
  });

  it('keeps sold-out products visible but flagged, and hides inactive ones', async () => {
    await db.product.update({ where: { slug: 'crab' }, data: { todayAvailable: false } });
    await db.product.update({ where: { slug: 'mackerel' }, data: { isActive: false } });
    const c = await getCatalogue();
    expect(c.products.find((p) => p.slug === 'crab')?.todayAvailable).toBe(false);
    expect(c.products.some((p) => p.slug === 'mackerel')).toBe(false);
  });
});
