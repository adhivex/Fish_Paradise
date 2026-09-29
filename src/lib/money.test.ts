import { describe, expect, it } from 'vitest';
import { formatMoney, formatPricePerKg, rupees } from './money';

describe('rupees', () => {
  it('converts rupees to integer paise', () => {
    expect(rupees(320)).toBe(32000);
    expect(rupees(0.5)).toBe(50);
  });
});

describe('formatMoney', () => {
  it('formats whole rupees without decimals', () => {
    expect(formatMoney(108000)).toBe('₹1,080');
    expect(formatMoney(4000)).toBe('₹40');
    expect(formatMoney(0)).toBe('₹0');
  });

  it('uses Indian digit grouping', () => {
    expect(formatMoney(10800000)).toBe('₹1,08,000');
    expect(formatMoney(1234567800)).toBe('₹1,23,45,678');
  });

  it('keeps paise when present', () => {
    expect(formatMoney(12345)).toBe('₹123.45');
    expect(formatMoney(12350)).toBe('₹123.5');
  });

  it('rejects non-integer input', () => {
    expect(() => formatMoney(10.5)).toThrow();
  });
});

describe('formatPricePerKg', () => {
  it('appends /kg', () => {
    expect(formatPricePerKg(65000)).toBe('₹650/kg');
  });
});
