import { describe, expect, it } from 'vitest';
import type { CouponRule } from '@/lib/coupons';
import type { DeliveryZoneDTO, ProductDTO } from '@/lib/types';
import { fixtureCatalogue } from '@/test/fixtures';
import { addLine, mergeLines, quoteCart, type QuoteInput } from './cart';

const { products, cleaningOptions } = fixtureCatalogue();
const bySlug = (slug: string) => products.find((p) => p.slug === slug)!;
const pomfret = bySlug('pomfret');
const crab = bySlug('crab');
const productById = (id: string) => products.find((p) => p.id === id);
const zone: DeliveryZoneDTO = {
  pincode: '751030',
  areaName: 'Khandagiri',
  deliveryFeePaise: 4000,
  freeAbovePaise: null,
  minOrderPaise: 0,
};
const line = (p: ProductDTO, qtyGrams = 1000, cleaningOptionId = 'clean_1') => ({
  productId: p.id,
  qtyGrams,
  cleaningOptionId,
});
const quote = (patch: Partial<QuoteInput> = {}) =>
  quoteCart({
    lines: [line(pomfret), line(crab, 1500, 'clean_2')],
    product: productById,
    cleaning: cleaningOptions,
    pincode: '751030',
    zone,
    defaultZone: zone,
    coupon: null,
    now: new Date('2026-09-30T06:00:00Z'),
    ...patch,
  });

describe('addLine / mergeLines', () => {
  it('adds grams and replaces the cleaning option for the same product', () => {
    const lines = addLine([line(pomfret)], line(pomfret, 500, 'clean_3'), pomfret);
    expect(lines).toEqual([
      { productId: pomfret.id, qtyGrams: 1500, cleaningOptionId: 'clean_3', lineNote: null },
    ]);
  });

  it('never exceeds the product maximum', () => {
    expect(addLine([line(pomfret, 20000)], line(pomfret, 500), pomfret)[0]!.qtyGrams).toBe(20000);
  });

  it('merges a guest cart into the server cart, skipping unknown products', () => {
    const merged = mergeLines(
      [line(pomfret)],
      [line(pomfret, 500), line(crab), line({ ...crab, id: 'gone' })],
      productById,
    );
    expect(merged.map((l) => [l.productId, l.qtyGrams])).toEqual([
      [pomfret.id, 1500],
      [crab.id, 1000],
    ]);
  });
});

describe('quoteCart', () => {
  it('prices lines, delivery and total from the catalogue', () => {
    const q = quote();
    expect(q.lines.map((l) => [l.name, l.lineTotalPaise, l.cleaningLabel])).toEqual([
      ['Pomfret', 65000, 'Whole cleaned'],
      ['Crab', 63000, 'Curry cut'],
    ]);
    expect(q).toMatchObject({
      subtotalPaise: 128000,
      deliveryFeePaise: 4000,
      discountPaise: 0,
      totalPaise: 132000,
    });
    expect(q.blockers).toEqual([]);
  });

  it('flags sold-out and removed products and leaves them out of totals', () => {
    const q = quote({ product: (id) => (id === crab.id ? { ...crab, todayAvailable: false } : undefined) });
    expect(q.lines.map((l) => l.issue)).toEqual(['UNAVAILABLE', 'SOLD_OUT']);
    expect(q.subtotalPaise).toBe(0);
    expect(q.blockers.map((b) => b.code)).toEqual(['SOLD_OUT', 'SOLD_OUT']);
  });

  it('flags quantities above tracked stock', () => {
    const q = quote({ product: (id) => (id === crab.id ? { ...crab, stockGrams: 1000 } : productById(id)) });
    expect(q.lines[1]).toMatchObject({ issue: 'QTY_INVALID', maxAllowedGrams: 1000 });
    expect(q.blockers[0]!.code).toBe('QTY_INVALID');
  });

  it('requires a note for custom cuts', () => {
    expect(quote({ lines: [line(pomfret, 1000, 'clean_4')] }).blockers[0]!.code).toBe('NOTE_REQUIRED');
    expect(quote({ lines: [{ ...line(pomfret, 1000, 'clean_4'), lineNote: 'Steaks' }] }).blockers).toEqual(
      [],
    );
  });

  it('blocks unserviceable pincodes and charges no fee', () => {
    const q = quote({ pincode: '110001', zone: null });
    expect(q.delivery).toMatchObject({ serviceable: false, estimated: false });
    expect(q.deliveryFeePaise).toBe(0);
    expect(q.blockers.map((b) => b.code)).toEqual(['PINCODE_UNSERVICEABLE']);
  });

  it('estimates the fee from the default zone before an address is chosen', () => {
    const q = quote({ pincode: null, zone: null });
    expect(q.delivery).toMatchObject({ serviceable: null, estimated: true });
    expect(q.deliveryFeePaise).toBe(4000);
  });

  it('applies free delivery above the threshold and enforces minimum order', () => {
    expect(quote({ zone: { ...zone, freeAbovePaise: 100000 } }).deliveryFeePaise).toBe(0);
    expect(quote({ zone: { ...zone, minOrderPaise: 200000 } }).blockers[0]).toEqual({
      code: 'MIN_ORDER_NOT_MET',
      message: 'Minimum order for this area is ₹2,000.',
    });
  });

  it('applies valid coupons and blocks invalid ones', () => {
    const rule: CouponRule = {
      code: 'FLAT100',
      type: 'FLAT',
      value: 10000,
      minSubtotalPaise: 0,
      maxDiscountPaise: null,
      startsAt: null,
      endsAt: null,
      totalUsageLimit: null,
      perUserLimit: null,
      usedCount: 0,
      isActive: true,
    };
    const ok = quote({ coupon: { code: 'FLAT100', rule, userUses: 0 } });
    expect(ok).toMatchObject({ discountPaise: 10000, totalPaise: 122000, coupon: { applied: true } });
    const bad = quote({ coupon: { code: 'NOPE', rule: null, userUses: 0 } });
    expect(bad.coupon).toEqual({ code: 'NOPE', applied: false, message: 'This coupon is not valid.' });
    expect(bad.blockers.map((b) => b.code)).toEqual(['COUPON_INVALID']);
  });

  it('reports an empty cart', () => {
    expect(quote({ lines: [] }).blockers.map((b) => b.code)).toEqual(['CART_EMPTY']);
  });
});
