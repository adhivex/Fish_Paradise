import { describe, expect, it } from 'vitest';
import { addressInputSchema, formatAddress } from './address';

describe('formatAddress', () => {
  it('joins the parts like the design', () => {
    expect(
      formatAddress({
        line1: 'Plot No. 123',
        area: 'Khandagiri',
        city: 'Bhubaneswar',
        state: 'Odisha',
        pincode: '751030',
      }),
    ).toBe('Plot No. 123, Khandagiri, Bhubaneswar, Odisha – 751030');
  });
});

describe('addressInputSchema', () => {
  const valid = { label: 'Home', line1: 'Plot 1', city: 'Bhubaneswar', state: 'Odisha', pincode: '751030' };

  it('accepts a valid address', () => {
    expect(addressInputSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects bad pincodes', () => {
    expect(addressInputSchema.safeParse({ ...valid, pincode: '75103' }).success).toBe(false);
    expect(addressInputSchema.safeParse({ ...valid, pincode: '051030' }).success).toBe(false);
  });
});
