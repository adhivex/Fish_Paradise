import { describe, expect, it } from 'vitest';
import { evaluateCoupon, normalizeCouponCode, type CouponRule } from './coupons';

const now = new Date('2026-09-30T06:00:00Z');
const base: CouponRule = {
  code: 'FRESH10',
  type: 'PERCENT',
  value: 10,
  minSubtotalPaise: 50000,
  maxDiscountPaise: 10000,
  startsAt: null,
  endsAt: null,
  totalUsageLimit: null,
  perUserLimit: null,
  usedCount: 0,
  isActive: true,
};
const run = (c: Partial<CouponRule> | null, subtotalPaise = 80000, userUses: number | null = 0) =>
  evaluateCoupon(c && { ...base, ...c }, { subtotalPaise, now, userUses });

describe('evaluateCoupon', () => {
  it('applies a percent discount, rounded down to the paisa', () => {
    expect(run({}, 80050)).toEqual({ ok: true, discountPaise: 8005 });
    expect(run({}, 80055)).toEqual({ ok: true, discountPaise: 8005 });
  });

  it('caps percent discounts at the maximum', () => {
    expect(run({}, 500000)).toEqual({ ok: true, discountPaise: 10000 });
  });

  it('applies flat discounts but never above the subtotal', () => {
    expect(run({ type: 'FLAT', value: 5000, minSubtotalPaise: 0, maxDiscountPaise: null })).toEqual({
      ok: true,
      discountPaise: 5000,
    });
    expect(run({ type: 'FLAT', value: 5000, minSubtotalPaise: 0, maxDiscountPaise: null }, 3000)).toEqual({
      ok: true,
      discountPaise: 3000,
    });
  });

  it('enforces the minimum subtotal', () => {
    expect(run({}, 49999)).toEqual({
      ok: false,
      message: 'Add items worth ₹500 or more to use this coupon.',
    });
  });

  it('enforces the validity window', () => {
    expect(run({ startsAt: new Date('2026-10-01T00:00:00Z') }).ok).toBe(false);
    expect(run({ endsAt: new Date('2026-09-29T00:00:00Z') })).toEqual({
      ok: false,
      message: 'This coupon has expired.',
    });
  });

  it('enforces total and per-user limits', () => {
    expect(run({ totalUsageLimit: 100, usedCount: 100 }).ok).toBe(false);
    expect(run({ perUserLimit: 1 }, 80000, 1)).toEqual({
      ok: false,
      message: 'You have already used this coupon.',
    });
    // Guests (unknown usage) are checked again at order time.
    expect(run({ perUserLimit: 1 }, 80000, null).ok).toBe(true);
  });

  it('rejects missing or inactive coupons', () => {
    expect(run(null).ok).toBe(false);
    expect(run({ isActive: false }).ok).toBe(false);
  });
});

describe('normalizeCouponCode', () => {
  it('trims and upper-cases', () => {
    expect(normalizeCouponCode('  fresh10 ')).toBe('FRESH10');
  });
});
