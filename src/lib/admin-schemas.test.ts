import { describe, expect, it } from 'vitest';
import { couponSchema, productSchema, settingsSchema, slotSchema, zoneSchema } from './admin-schemas';

describe('admin schemas', () => {
  it('validates products with gram rules and defaults', () => {
    const p = productSchema.parse({ name: 'Rohu', slug: 'rohu', categoryId: 'c1', pricePerKgPaise: 32000 });
    expect(p).toMatchObject({
      minQtyGrams: 500,
      stepGrams: 500,
      maxQtyGrams: 20000,
      stockGrams: null,
      note: null,
    });
    expect(productSchema.safeParse({ ...p, slug: 'Bad Slug' }).success).toBe(false);
    expect(productSchema.safeParse({ ...p, minQtyGrams: 1000, maxQtyGrams: 500 }).success).toBe(false);
  });

  it('keeps money as integer paise', () => {
    expect(zoneSchema.safeParse({ pincode: '751030', areaName: 'X', deliveryFeePaise: 40.5 }).success).toBe(
      false,
    );
  });

  it('validates slot times', () => {
    expect(
      slotSchema.safeParse({ label: 'Eve', startTime: '17:00', endTime: '18:00', capacity: 20 }).success,
    ).toBe(true);
    expect(
      slotSchema.safeParse({ label: 'Eve', startTime: '18:00', endTime: '17:00', capacity: 20 }).success,
    ).toBe(false);
    expect(
      slotSchema.safeParse({ label: 'Eve', startTime: '25:00', endTime: '26:00', capacity: 20 }).success,
    ).toBe(false);
  });

  it('normalizes coupon codes and bounds percentages', () => {
    expect(couponSchema.parse({ code: 'fresh10', type: 'PERCENT', value: 10 }).code).toBe('FRESH10');
    expect(couponSchema.safeParse({ code: 'BIG', type: 'PERCENT', value: 150 }).success).toBe(false);
  });

  it('checks settings formats without inventing values', () => {
    const base = {
      shopName: 'Fish Paradise',
      opensAt: '07:00',
      closesAt: '20:00',
      acceptingOrders: true,
      asapMinMinutes: 30,
      asapMaxMinutes: 60,
      autoConfirmCod: true,
      unpaidCancelMinutes: 30,
      priceBandsPaise: [30000, 60000],
    };
    expect(settingsSchema.parse(base)).toMatchObject({ phone: null, fssaiNumber: null });
    expect(settingsSchema.safeParse({ ...base, phone: '98765' }).success).toBe(false);
    expect(settingsSchema.safeParse({ ...base, fssaiNumber: '123' }).success).toBe(false);
  });
});
