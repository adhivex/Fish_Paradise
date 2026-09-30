import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OutgoingMessage } from '@/lib/notify/providers';
import { db } from '@/server/db';

/** Fake provider: records messages, or fails when `failNext` is set. */
const sent: OutgoingMessage[] = [];
let failNext = false;
vi.mock('@/lib/notify/providers', () => ({
  notifyProvider: () => ({
    channel: 'whatsapp' as const,
    async send(m: OutgoingMessage) {
      if (failNext) throw new Error('Gateway timeout');
      sent.push(m);
    },
  }),
}));
vi.mock('next/cache', () => ({ unstable_cache: <T>(fn: T) => fn }));

const { notifyOrderEvent } = await import('./notify');
const { replaceCart } = await import('./cart');
const { createOrder, transitionOrder } = await import('./orders');

const PHONE = '+916000000033';
let orderId: string;
let orderNumber: string;

beforeAll(async () => {
  const user = await db.user.upsert({
    where: { phone: PHONE },
    update: {},
    create: { phone: PHONE, name: 'Asha Das' },
  });
  const address = await db.address.create({
    data: { userId: user.id, line1: 'Plot 9', city: 'Bhubaneswar', state: 'Odisha', pincode: '751030' },
  });
  const product = await db.product.findUniqueOrThrow({ where: { slug: 'rohu' } });
  await db.product.update({ where: { id: product.id }, data: { todayAvailable: true } });
  const cleaning = await db.cleaningOption.findFirstOrThrow({ where: { isDefault: true } });
  await replaceCart(user.id, {
    items: [{ productId: product.id, qtyGrams: 1000, cleaningOptionId: cleaning.id }],
  });
  const res = await createOrder(
    { id: user.id, phone: user.phone, name: user.name, email: null },
    { addressId: address.id, slot: { type: 'SCHEDULED', ...(await nextSlot()) }, paymentMethod: 'UPI' },
  );
  orderNumber = res.orderNumber;
  orderId = (await db.order.findUniqueOrThrow({ where: { orderNumber } })).id;
});

async function nextSlot() {
  const { slotAvailability } = await import('./slots');
  const s = (await slotAvailability()).availability.scheduled.find((x) => x.available)!;
  return { templateId: s.templateId, date: s.date };
}

beforeEach(async () => {
  sent.length = 0;
  failNext = false;
  // Let background notifications from setup settle, then start clean.
  await new Promise((r) => setTimeout(r, 200));
  sent.length = 0;
  await db.notificationLog.deleteMany({ where: { orderId } });
});

afterAll(async () => {
  const user = await db.user.findUnique({ where: { phone: PHONE } });
  if (user) {
    const orders = await db.order.findMany({ where: { userId: user.id }, select: { id: true } });
    const ids = orders.map((o) => o.id);
    await db.notificationLog.deleteMany({ where: { orderId: { in: ids } } });
    await db.payment.deleteMany({ where: { orderId: { in: ids } } });
    await db.order.deleteMany({ where: { id: { in: ids } } });
    await db.cart.deleteMany({ where: { userId: user.id } });
    await db.user.delete({ where: { id: user.id } });
  }
  await db.$disconnect();
});

describe('notifications', () => {
  it('sends the customer template for a status and logs it', async () => {
    await notifyOrderEvent(orderId, 'OUT_FOR_DELIVERY');
    expect(sent).toHaveLength(1);
    expect(sent[0]).toMatchObject({ to: PHONE, template: 'order_out_for_delivery' });
    expect(sent[0]!.text).toContain(`Hi Asha, your Fish Paradise order ${orderNumber} is out for delivery`);
    const log = await db.notificationLog.findFirstOrThrow({ where: { orderId } });
    expect(log).toMatchObject({
      status: 'SENT',
      template: 'order_out_for_delivery',
      recipient: '+91 ••••• •0033',
    });
  });

  it('never throws when the provider fails, and records the failure', async () => {
    failNext = true;
    await expect(notifyOrderEvent(orderId, 'CONFIRMED')).resolves.toBeUndefined();
    const log = await db.notificationLog.findFirstOrThrow({ where: { orderId } });
    expect(log).toMatchObject({ status: 'FAILED', error: 'Gateway timeout' });
  });

  it('does not block status changes when sending fails', async () => {
    failNext = true;
    await transitionOrder(orderId, 'CANCELLED', { type: 'admin' }, 'Test cancel');
    expect((await db.order.findUniqueOrThrow({ where: { id: orderId } })).status).toBe('CANCELLED');
  });

  it('skips the owner alert when no owner number is configured (placeholder)', async () => {
    const settings = await db.shopSettings.findUniqueOrThrow({ where: { id: 'shop' } });
    if (settings.phone || settings.whatsapp || process.env.OWNER_NOTIFY_PHONE) return;
    await notifyOrderEvent(orderId, 'PLACED_OWNER');
    expect(sent).toHaveLength(0);
    expect((await db.notificationLog.findFirstOrThrow({ where: { orderId } })).status).toBe('SKIPPED');
  });
});
