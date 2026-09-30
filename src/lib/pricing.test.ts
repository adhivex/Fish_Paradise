import { describe, expect, it } from 'vitest';
import { deliveryFeePaise, lineTotalPaise } from './pricing';

describe('lineTotalPaise', () => {
  it('prices by weight', () => {
    expect(lineTotalPaise(65000, 1000)).toBe(65000);
    expect(lineTotalPaise(65000, 500)).toBe(32500);
    expect(lineTotalPaise(32000, 1500)).toBe(48000);
  });

  it('rounds to the nearest paisa', () => {
    expect(lineTotalPaise(33333, 500)).toBe(16667);
  });

  it('adds extra charges', () => {
    expect(lineTotalPaise(40000, 500, 1000)).toBe(21000);
  });
});

describe('deliveryFeePaise', () => {
  const rule = { deliveryFeePaise: 4000, freeAbovePaise: 100000 };

  it('charges below the free threshold', () => {
    expect(deliveryFeePaise(50000, rule)).toBe(4000);
  });

  it('is free at or above the threshold', () => {
    expect(deliveryFeePaise(100000, rule)).toBe(0);
  });

  it('is zero for an empty cart', () => {
    expect(deliveryFeePaise(0, rule)).toBe(0);
  });

  it('never goes free without a threshold', () => {
    expect(deliveryFeePaise(9_999_999, { deliveryFeePaise: 4000, freeAbovePaise: null })).toBe(4000);
  });
});
