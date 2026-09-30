import { describe, expect, it } from 'vitest';
import { fromFormValue, toFormValue, type FieldDef } from './fields';

const money: FieldDef = { name: 'fee', label: 'Fee', type: 'money' };
const nullableMoney: FieldDef = { ...money, nullable: true };
const bands: FieldDef = { name: 'b', label: 'Bands', type: 'bands' };

describe('admin form conversions', () => {
  it('edits money in rupees and stores paise', () => {
    expect(toFormValue(money, 4000)).toBe('40');
    expect(fromFormValue(money, '40')).toBe(4000);
    expect(fromFormValue(money, '12.5')).toBe(1250);
    expect(fromFormValue(money, '0.335')).toBe(34);
  });

  it('turns blanks into null for nullable fields', () => {
    expect(fromFormValue(nullableMoney, '  ')).toBeNull();
    expect(toFormValue(nullableMoney, null)).toBe('');
  });

  it('converts price bands', () => {
    expect(toFormValue(bands, [30000, 60000])).toBe('300, 600');
    expect(fromFormValue(bands, '300, 600, x')).toEqual([30000, 60000]);
  });

  it('handles booleans and numbers', () => {
    expect(fromFormValue({ name: 'a', label: 'A', type: 'boolean' }, true)).toBe(true);
    expect(fromFormValue({ name: 'n', label: 'N', type: 'number' }, '20')).toBe(20);
  });
});
