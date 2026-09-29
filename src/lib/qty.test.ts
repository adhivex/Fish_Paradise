import { describe, expect, it } from 'vitest';
import { clampQty, formatQty, isValidQty, maxAllowedGrams, stepQty, type QtyRules } from './qty';

const rules: QtyRules = { minQtyGrams: 500, stepGrams: 500, maxQtyGrams: 20000 };

describe('formatQty', () => {
  it('shows grams below 1 kg', () => {
    expect(formatQty(500)).toBe('500 g');
    expect(formatQty(250)).toBe('250 g');
  });

  it('shows kg with up to one decimal', () => {
    expect(formatQty(1000)).toBe('1 kg');
    expect(formatQty(1500)).toBe('1.5 kg');
    expect(formatQty(20000)).toBe('20 kg');
    expect(formatQty(1250)).toBe('1.3 kg');
  });

  it('rejects fractional grams', () => {
    expect(() => formatQty(500.5)).toThrow();
  });
});

describe('quantity rules', () => {
  it('steps in 500 g within bounds', () => {
    expect(stepQty(500, 1, rules)).toBe(1000);
    expect(stepQty(500, -1, rules)).toBe(500);
    expect(stepQty(20000, 1, rules)).toBe(20000);
  });

  it('snaps arbitrary values onto the grid', () => {
    expect(clampQty(1200, rules)).toBe(1000);
    expect(clampQty(1300, rules)).toBe(1500);
    expect(clampQty(0, rules)).toBe(500);
    expect(clampQty(99999, rules)).toBe(20000);
  });

  it('caps by tracked stock', () => {
    const tracked = { ...rules, stockGrams: 2300 };
    expect(maxAllowedGrams(tracked)).toBe(2000);
    expect(stepQty(2000, 1, tracked)).toBe(2000);
    expect(maxAllowedGrams({ ...rules, stockGrams: 200 })).toBe(0);
  });

  it('validates quantities', () => {
    expect(isValidQty(1500, rules)).toBe(true);
    expect(isValidQty(1200, rules)).toBe(false);
    expect(isValidQty(0, rules)).toBe(false);
    expect(isValidQty(20500, rules)).toBe(false);
  });
});
