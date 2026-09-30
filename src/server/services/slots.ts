import 'server-only';
import type { Prisma, PrismaClient } from '@prisma/client';
import { istParts } from '@/lib/ist';
import { buildAvailability, type ShopHours, type SlotAvailability, type SlotTemplateRule } from '@/lib/slots';
import { db } from '@/server/db';

type Tx = PrismaClient | Prisma.TransactionClient;

export async function loadShopHours(tx: Tx = db): Promise<ShopHours> {
  const s = await tx.shopSettings.findUnique({ where: { id: 'shop' } });
  return {
    opensAt: s?.opensAt ?? '07:00',
    closesAt: s?.closesAt ?? '20:00',
    acceptingOrders: s?.acceptingOrders ?? true,
    asapMinMinutes: s?.asapMinMinutes ?? 30,
    asapMaxMinutes: s?.asapMaxMinutes ?? 60,
  };
}

/** Current ASAP + scheduled slot availability, counting booked (non-cancelled) orders. */
export async function slotAvailability(
  now = new Date(),
  tx: Tx = db,
): Promise<{ shop: ShopHours; availability: SlotAvailability }> {
  const [shop, templates] = await Promise.all([
    loadShopHours(tx),
    tx.slotTemplate.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } }),
  ]);
  const today = istParts(now).date;
  const since = new Date(`${today}T00:00:00.000Z`);
  since.setUTCDate(since.getUTCDate() - 1);
  const bookings = await tx.order.groupBy({
    by: ['slotTemplateId', 'slotStart'],
    where: { slotType: 'SCHEDULED', status: { not: 'CANCELLED' }, slotStart: { gte: since } },
    _count: { _all: true },
  });
  const booked = new Map<string, number>();
  for (const b of bookings) {
    if (!b.slotTemplateId || !b.slotStart) continue;
    booked.set(`${b.slotTemplateId}:${istParts(b.slotStart).date}`, b._count._all);
  }
  const rules: SlotTemplateRule[] = templates.map((t) => ({
    id: t.id,
    label: t.label,
    startTime: t.startTime,
    endTime: t.endTime,
    capacity: t.capacity,
  }));
  return { shop, availability: buildAvailability(now, shop, rules, booked) };
}
