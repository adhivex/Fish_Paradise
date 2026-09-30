import { addDays, dayLabel, hhmmToMinutes, isOpenAt, istParts, istToDate } from '@/lib/ist';
import type { SlotChoice } from '@/lib/types';

/** Minimum time between now and a scheduled slot's start. */
export const SLOT_LEAD_MINUTES = 60;

export interface SlotTemplateRule {
  id: string;
  label: string;
  startTime: string;
  endTime: string;
  capacity: number;
}

export interface ShopHours {
  opensAt: string;
  closesAt: string;
  acceptingOrders: boolean;
  asapMinMinutes: number;
  asapMaxMinutes: number;
}

export interface AsapSlot {
  available: boolean;
  reason: string | null;
  label: string; // "30 – 60 mins"
}

export interface ScheduledSlot {
  templateId: string;
  date: string;
  label: string; // "5:00 – 6:00 PM"
  dayLabel: string; // "Today"
  startsAt: string; // ISO
  endsAt: string;
  remaining: number;
  available: boolean;
}

export interface SlotAvailability {
  asap: AsapSlot;
  scheduled: ScheduledSlot[];
}

export function asapSlot(now: Date, shop: ShopHours): AsapSlot {
  const label = `${shop.asapMinMinutes} – ${shop.asapMaxMinutes} mins`;
  if (!shop.acceptingOrders)
    return { available: false, reason: 'We are not taking orders right now.', label };
  if (!isOpenAt(now, shop.opensAt, shop.closesAt)) {
    return { available: false, reason: `Unavailable – the shop opens at ${shop.opensAt}.`, label };
  }
  return { available: true, reason: null, label };
}

/** Next date (IST) each template can be delivered: today with enough lead time, else tomorrow. */
export function nextOccurrence(now: Date, template: Pick<SlotTemplateRule, 'startTime'>): string {
  const { date, minutes } = istParts(now);
  return hhmmToMinutes(template.startTime) - minutes >= SLOT_LEAD_MINUTES ? date : addDays(date, 1);
}

/**
 * Builds availability from templates and the number of active orders already booked per
 * `templateId:date` (from the database).
 */
export function buildAvailability(
  now: Date,
  shop: ShopHours,
  templates: readonly SlotTemplateRule[],
  booked: ReadonlyMap<string, number>,
): SlotAvailability {
  const scheduled = templates
    .map((t): ScheduledSlot => {
      const date = nextOccurrence(now, t);
      const remaining = Math.max(0, t.capacity - (booked.get(`${t.id}:${date}`) ?? 0));
      return {
        templateId: t.id,
        date,
        label: t.label,
        dayLabel: dayLabel(date, now),
        startsAt: istToDate(date, t.startTime).toISOString(),
        endsAt: istToDate(date, t.endTime).toISOString(),
        remaining,
        available: shop.acceptingOrders && remaining > 0,
      };
    })
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  return { asap: asapSlot(now, shop), scheduled };
}

export type SlotResolution =
  | { ok: true; type: 'ASAP'; label: string; etaMin: number; etaMax: number }
  | {
      ok: true;
      type: 'SCHEDULED';
      templateId: string;
      label: string;
      startsAt: Date;
      endsAt: Date;
    }
  | { ok: false; code: 'SHOP_CLOSED' | 'SLOT_FULL' | 'SLOT_INVALID'; message: string };

/** Validates a customer's slot choice against current availability. */
export function resolveSlot(
  choice: SlotChoice,
  availability: SlotAvailability,
  shop: ShopHours,
): SlotResolution {
  if (choice.type === 'ASAP') {
    if (!availability.asap.available) {
      return {
        ok: false,
        code: 'SHOP_CLOSED',
        message: availability.asap.reason ?? 'ASAP delivery is unavailable.',
      };
    }
    return {
      ok: true,
      type: 'ASAP',
      label: `Today, ${availability.asap.label}`,
      etaMin: shop.asapMinMinutes,
      etaMax: shop.asapMaxMinutes,
    };
  }
  const slot = availability.scheduled.find(
    (s) => s.templateId === choice.templateId && s.date === choice.date,
  );
  if (!slot)
    return { ok: false, code: 'SLOT_INVALID', message: 'That delivery slot is no longer available.' };
  if (!shop.acceptingOrders)
    return { ok: false, code: 'SHOP_CLOSED', message: 'We are not taking orders right now.' };
  if (slot.remaining <= 0)
    return { ok: false, code: 'SLOT_FULL', message: 'That slot just filled up. Please pick another.' };
  return {
    ok: true,
    type: 'SCHEDULED',
    templateId: slot.templateId,
    label: `${slot.dayLabel}, ${slot.label}`,
    startsAt: new Date(slot.startsAt),
    endsAt: new Date(slot.endsAt),
  };
}
