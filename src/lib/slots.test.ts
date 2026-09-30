import { describe, expect, it } from 'vitest';
import { slotTemplates } from '@/lib/mock/checkout';
import { fixtureCatalogue } from '@/test/fixtures';

const shopSettings = fixtureCatalogue().shop;
import { slotKey, slotLabel, slotOptions } from './slots';

describe('slotOptions', () => {
  it('offers ASAP while the shop is open', () => {
    const [asap, ...rest] = slotOptions(new Date(2026, 8, 30, 10, 0), shopSettings, slotTemplates);
    expect(asap).toMatchObject({ disabled: false, subtitle: '30 – 60 mins' });
    expect(rest.map((s) => s.subtitle)).toEqual([
      'Tomorrow, 9:00 – 10:00 AM',
      'Today, 12:00 – 1:00 PM',
      'Today, 5:00 – 6:00 PM',
    ]);
  });

  it('disables ASAP outside opening hours', () => {
    const [asap] = slotOptions(new Date(2026, 8, 30, 21, 0), shopSettings, slotTemplates);
    expect(asap!.disabled).toBe(true);
  });

  it('disables everything when the shop is not accepting orders', () => {
    const options = slotOptions(
      new Date(2026, 8, 30, 10, 0),
      { ...shopSettings, acceptingOrders: false },
      slotTemplates,
    );
    expect(options.every((o) => o.disabled)).toBe(true);
  });

  it('builds stable keys and labels', () => {
    const options = slotOptions(new Date(2026, 8, 30, 10, 0), shopSettings, slotTemplates);
    expect(slotKey(options[0]!.choice)).toBe('asap');
    expect(slotKey(options[3]!.choice)).toBe('slot_1700:2026-09-30');
    expect(slotLabel(options[0]!)).toBe('ASAP · 30 – 60 mins');
    expect(slotLabel(options[3]!)).toBe('Today, 5:00 – 6:00 PM');
  });
});
