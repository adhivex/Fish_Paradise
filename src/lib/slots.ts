import { isWithinHours, nextSlotDay } from '@/lib/datetime';
import type { ShopSettingsDTO, SlotChoice, SlotTemplateDTO } from '@/lib/types';

export interface SlotOption {
  key: string;
  choice: SlotChoice;
  title: string;
  subtitle: string;
  disabled: boolean;
}

/** ASAP (only while open and accepting orders) followed by each active scheduled window. */
export function slotOptions(
  now: Date,
  shop: ShopSettingsDTO,
  templates: readonly SlotTemplateDTO[],
): SlotOption[] {
  const asapOpen = shop.acceptingOrders && isWithinHours(now, shop.opensAt, shop.closesAt);
  const asap: SlotOption = {
    key: 'asap',
    choice: { type: 'ASAP' },
    title: 'ASAP',
    subtitle: asapOpen
      ? `${shop.asapMinMinutes} – ${shop.asapMaxMinutes} mins`
      : 'Unavailable – the shop is closed now',
    disabled: !asapOpen,
  };
  const scheduled = templates.map<SlotOption>((t) => {
    const { date, dayLabel } = nextSlotDay(now, t.startTime);
    return {
      key: `${t.id}:${date}`,
      choice: { type: 'SCHEDULED', templateId: t.id, date },
      title: 'Schedule delivery',
      subtitle: `${dayLabel}, ${t.label}`,
      disabled: !shop.acceptingOrders,
    };
  });
  return [asap, ...scheduled];
}

export function slotKey(choice: SlotChoice): string {
  return choice.type === 'ASAP' ? 'asap' : `${choice.templateId}:${choice.date}`;
}

/** Human label stored on the order, e.g. "ASAP · 30 – 60 mins" or "Today, 5:00 – 6:00 PM". */
export function slotLabel(option: SlotOption): string {
  return option.choice.type === 'ASAP' ? `ASAP · ${option.subtitle}` : option.subtitle;
}
