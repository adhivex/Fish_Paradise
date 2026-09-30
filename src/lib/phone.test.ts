import { describe, expect, it } from 'vitest';
import { formatPhone, maskPhone, normalizeIndianMobile } from './phone';

describe('normalizeIndianMobile', () => {
  it.each([
    ['9876543210', '+919876543210'],
    ['98765 43210', '+919876543210'],
    ['+91 98765-43210', '+919876543210'],
    ['09876543210', '+919876543210'],
    ['919876543210', '+919876543210'],
    ['(+91) 6000000000', '+916000000000'],
  ])('accepts %s', (input, expected) => {
    expect(normalizeIndianMobile(input)).toBe(expected);
  });

  it.each(['', '12345', '5876543210', '98765432101', 'abcdefghij', '+1 2025550123'])(
    'rejects %s',
    (input) => {
      expect(normalizeIndianMobile(input)).toBeNull();
    },
  );
});

describe('formatPhone / maskPhone', () => {
  it('formats and masks', () => {
    expect(formatPhone('+919876543210')).toBe('+91 98765 43210');
    expect(maskPhone('+919876543210')).toBe('+91 ••••• •3210');
  });
});
