import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fixtureCatalogue } from '@/test/fixtures';

const getCatalogue = vi.fn();
vi.mock('@/server/services/catalogue', () => ({ getCatalogue: () => getCatalogue() }));

const { GET: getCatalogueRoute } = await import('./catalogue/route');
const { GET: getProductRoute } = await import('./products/[slug]/route');
const { GET: getShopRoute } = await import('./shop/route');

const req = (qs = '') => new NextRequest(`http://localhost/api/catalogue${qs}`);
const params = (slug: string) => ({ params: Promise.resolve({ slug }) });

beforeEach(() => {
  getCatalogue.mockReset();
  getCatalogue.mockResolvedValue(fixtureCatalogue());
});

describe('GET /api/catalogue', () => {
  it('filters and sorts on the server', async () => {
    const res = await getCatalogueRoute(req('?category=fish&sort=low&priceBand=b0'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.products.map((p: { slug: string }) => p.slug)).toEqual(['mackerel', 'tilapia']);
    expect(body.data.filter).toEqual({ category: 'fish', query: '', sort: 'low', priceBand: 'b0' });
    expect(body.data.categories).toHaveLength(3);
  });

  it('searches by name', async () => {
    const body = await (await getCatalogueRoute(req('?q=hilsa'))).json();
    expect(body.data.products.map((p: { slug: string }) => p.slug)).toEqual(['hilsa']);
  });

  it('rejects invalid query values with the error envelope', async () => {
    const res = await getCatalogueRoute(req('?sort=cheapest'));
    expect(res.status).toBe(400);
    expect((await res.json()).error.code).toBe('VALIDATION');
  });

  it('returns INTERNAL when the database fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    getCatalogue.mockRejectedValueOnce(new Error('db down'));
    const res = await getCatalogueRoute(req());
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({
      error: { code: 'INTERNAL', message: 'Something went wrong. Please try again.' },
    });
  });
});

describe('GET /api/products/:slug', () => {
  it('returns the product with cleaning options', async () => {
    const body = await (await getProductRoute(new Request('http://x'), params('pomfret'))).json();
    expect(body.data.product).toMatchObject({ slug: 'pomfret', pricePerKgPaise: 65000 });
    expect(body.data.cleaningOptions).toHaveLength(4);
  });

  it('404s for unknown products', async () => {
    const res = await getProductRoute(new Request('http://x'), params('lobster'));
    expect(res.status).toBe(404);
    expect((await res.json()).error.code).toBe('NOT_FOUND');
  });

  it('400s for malformed slugs', async () => {
    const res = await getProductRoute(new Request('http://x'), params('../etc'));
    expect(res.status).toBe(400);
  });
});

describe('GET /api/shop', () => {
  it('returns public settings', async () => {
    const body = await (await getShopRoute()).json();
    expect(body.data).toMatchObject({
      shopName: 'Fish Paradise',
      priceBandsPaise: [30000, 60000],
      deliveryCity: 'Bhubaneswar',
    });
  });
});
