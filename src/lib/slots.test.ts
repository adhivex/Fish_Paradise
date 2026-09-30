import { describe, expect, it } from 'vitest';
import {
  buildAvailability,
  nextOccurrence,
  resolveSlot,
  type ShopHours,
  type SlotTemplateRule,
} from './slots';

const shop: ShopHours = {
  opensAt: '07:00',
  closesAt: '20:00',
  acceptingOrders: true,
  asapMinMinutes: 30,
  asapMaxMinutes: 60,
};
const templates: SlotTemplateRule[] = [
  { id: 'morning', label: '9:00 – 10:00 AM', startTime: '09:00', endTime: '10:00', capacity: 20 },
  { id: 'noon', label: '12:00 – 1:00 PM', startTime: '12:00', endTime: '13:00', capacity: 20 },
  { id: 'evening', label: '5:00 – 6:00 PM', startTime: '17:00', endTime: '18:00', capacity: 2 },
];
// 10:00 IST on 30 Sep 2026
const tenAm = new Date('2026-09-30T04:30:00Z');

describe('slot availability (IST)', () => {
  it('offers ASAP while open and lists the next occurrence of each slot', () => {
    const a = buildAvailability(tenAm, shop, templates, new Map());
    expect(a.asap).toEqual({ available: true, reason: null, label: '30 – 60 mins' });
    expect(a.scheduled.map((s) => `${s.dayLabel} ${s.label}`)).toEqual([
      'Today 12:00 – 1:00 PM',
      'Today 5:00 – 6:00 PM',
      'Tomorrow 9:00 – 10:00 AM',
    ]);
    expect(a.scheduled[1]!.startsAt).toBe('2026-09-30T11:30:00.000Z');
  });

  it('needs an hour of lead time', () => {
    expect(nextOccurrence(new Date('2026-09-30T05:31:00Z'), { startTime: '12:00' })).toBe('2026-10-01');
    expect(nextOccurrence(new Date('2026-09-30T05:30:00Z'), { startTime: '12:00' })).toBe('2026-09-30');
  });

  it('closes ASAP outside hours or when not accepting orders', () => {
    expect(
      buildAvailability(new Date('2026-09-30T15:00:00Z'), shop, templates, new Map()).asap.available,
    ).toBe(false);
    const paused = buildAvailability(tenAm, { ...shop, acceptingOrders: false }, templates, new Map());
    expect(paused.asap.reason).toBe('We are not taking orders right now.');
    expect(paused.scheduled.every((s) => !s.available)).toBe(true);
  });

  it('tracks remaining capacity', () => {
    const a = buildAvailability(tenAm, shop, templates, new Map([['evening:2026-09-30', 2]]));
    expect(a.scheduled.find((s) => s.templateId === 'evening')).toMatchObject({
      remaining: 0,
      available: false,
    });
  });
});

describe('resolveSlot', () => {
  const a = buildAvailability(tenAm, shop, templates, new Map([['evening:2026-09-30', 2]]));

  it('resolves ASAP with an ETA', () => {
    expect(resolveSlot({ type: 'ASAP' }, a, shop)).toEqual({
      ok: true,
      type: 'ASAP',
      label: 'Today, 30 – 60 mins',
      etaMin: 30,
      etaMax: 60,
    });
  });

  it('resolves scheduled slots', () => {
    expect(resolveSlot({ type: 'SCHEDULED', templateId: 'noon', date: '2026-09-30' }, a, shop)).toMatchObject(
      {
        ok: true,
        label: 'Today, 12:00 – 1:00 PM',
      },
    );
  });

  it('rejects full, stale and closed slots', () => {
    expect(
      resolveSlot({ type: 'SCHEDULED', templateId: 'evening', date: '2026-09-30' }, a, shop),
    ).toMatchObject({
      ok: false,
      code: 'SLOT_FULL',
    });
    expect(resolveSlot({ type: 'SCHEDULED', templateId: 'noon', date: '2026-09-29' }, a, shop)).toMatchObject(
      {
        ok: false,
        code: 'SLOT_INVALID',
      },
    );
    const closed = buildAvailability(new Date('2026-09-30T16:00:00Z'), shop, templates, new Map());
    expect(resolveSlot({ type: 'ASAP' }, closed, shop)).toMatchObject({ ok: false, code: 'SHOP_CLOSED' });
  });
});
