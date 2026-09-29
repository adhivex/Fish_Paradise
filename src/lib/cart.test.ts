import { describe, expect, it } from 'vitest';
import { cleaningOptions, getProduct, getProductById } from '@/lib/mock/catalogue';
import { addLine, priceCart } from './cart';

const pomfret = getProduct('pomfret')!;
const crab = getProduct('crab')!;
const catalogue = { product: getProductById, cleaning: cleaningOptions };
const rule = { deliveryFeePaise: 4000, freeAbovePaise: null };

describe('addLine', () => {
  it('appends new products', () => {
    const lines = addLine(
      [],
      { productId: pomfret.id, qtyGrams: 1000, cleaningOptionId: 'clean_whole' },
      pomfret,
    );
    expect(lines).toEqual([{ productId: pomfret.id, qtyGrams: 1000, cleaningOptionId: 'clean_whole' }]);
  });

  it('adds grams and replaces the cleaning option for the same product', () => {
    const start = [{ productId: pomfret.id, qtyGrams: 1000, cleaningOptionId: 'clean_whole' }];
    const lines = addLine(
      start,
      { productId: pomfret.id, qtyGrams: 500, cleaningOptionId: 'clean_fry' },
      pomfret,
    );
    expect(lines).toEqual([{ productId: pomfret.id, qtyGrams: 1500, cleaningOptionId: 'clean_fry' }]);
  });

  it('never exceeds the product maximum', () => {
    const start = [{ productId: pomfret.id, qtyGrams: 20000, cleaningOptionId: 'clean_whole' }];
    expect(addLine(start, { ...start[0]!, qtyGrams: 500 }, pomfret)[0]!.qtyGrams).toBe(20000);
  });
});

describe('priceCart', () => {
  it('prices lines and totals from the catalogue', () => {
    const cart = priceCart(
      [
        { productId: pomfret.id, qtyGrams: 1000, cleaningOptionId: 'clean_whole' },
        { productId: crab.id, qtyGrams: 1500, cleaningOptionId: 'clean_curry' },
      ],
      catalogue,
      rule,
    );
    expect(cart.lines.map((l) => [l.lineTotalPaise, l.cleaningLabel])).toEqual([
      [65000, 'Whole cleaned'],
      [63000, 'Curry cut'],
    ]);
    expect(cart.totals).toEqual({
      subtotalPaise: 128000,
      deliveryFeePaise: 4000,
      discountPaise: 0,
      totalPaise: 132000,
    });
  });

  it('excludes sold-out lines from totals and flags them', () => {
    const soldOut = { ...crab, todayAvailable: false };
    const cart = priceCart(
      [{ productId: crab.id, qtyGrams: 500, cleaningOptionId: 'clean_whole' }],
      { product: () => soldOut, cleaning: cleaningOptions },
      rule,
    );
    expect(cart.hasUnavailable).toBe(true);
    expect(cart.totals.totalPaise).toBe(0);
  });

  it('drops unknown products', () => {
    const cart = priceCart([{ productId: 'nope', qtyGrams: 500, cleaningOptionId: 'x' }], catalogue, rule);
    expect(cart.lines).toHaveLength(0);
  });
});
