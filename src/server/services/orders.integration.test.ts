import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { hmacSha256Hex } from '@/lib/payments/signature';
import { db } from '@/server/db';

vi.mock('next/cache', () => ({ unstable_cache: <T>(fn: T) => fn }));

const { replaceCart } = await import('./cart');
const { createOrder, expireUnpaidOrders, transitionOrder, cancelByCustomer } = await import('./orders');
const { handleRazorpayWebhook, simulateGatewayPayment } = await import('./payments');

/**
 * Orders, payments and status rules against a real database (migrated + seeded).
 * Creates its own user, address, coupon and stock; cleans up afterwards.
 */
const PHONE = '+916000000099';
let user: { id: string; phone: string; name: string | null; email: string | null };
let addressId: string;
let pomfretId: string;
let cleaningId: string;
let originalStock: number | null;

async function fillCart(qtyGrams = 1000, couponCode: string | null = null) {
  await replaceCart(user.id, {
    items: [{ productId: pomfretId, qtyGrams, cleaningOptionId: cleaningId }],
    couponCode,
  });
}

async function cleanup() {
  const u = await db.user.findUnique({ where: { phone: PHONE } });
  if (!u) return;
  const orders = await db.order.findMany({ where: { userId: u.id }, select: { id: true } });
  const ids = orders.map((o) => o.id);
  await db.couponUse.deleteMany({ where: { orderId: { in: ids } } });
  await db.payment.deleteMany({ where: { orderId: { in: ids } } });
  await db.notificationLog.deleteMany({ where: { orderId: { in: ids } } });
  await db.order.deleteMany({ where: { id: { in: ids } } });
  await db.cart.deleteMany({ where: { userId: u.id } });
  await db.user.delete({ where: { id: u.id } });
  await db.coupon.deleteMany({ where: { code: { startsWith: 'ITEST' } } });
}

beforeAll(async () => {
  await cleanup();
  const created = await db.user.create({ data: { phone: PHONE, name: 'Test Customer' } });
  user = { id: created.id, phone: created.phone, name: created.name, email: null };
  const address = await db.address.create({
    data: {
      userId: user.id,
      line1: 'Plot 1',
      city: 'Bhubaneswar',
      state: 'Odisha',
      pincode: '751030',
      isDefault: true,
    },
  });
  addressId = address.id;
  const pomfret = await db.product.findUniqueOrThrow({ where: { slug: 'pomfret' } });
  pomfretId = pomfret.id;
  originalStock = pomfret.stockGrams;
  cleaningId = (await db.cleaningOption.findFirstOrThrow({ where: { isDefault: true } })).id;
  await db.shopSettings.update({ where: { id: 'shop' }, data: { acceptingOrders: true } });
});

beforeEach(async () => {
  await db.product.update({ where: { id: pomfretId }, data: { stockGrams: null, todayAvailable: true } });
});

afterAll(async () => {
  await db.product.update({
    where: { id: pomfretId },
    data: { stockGrams: originalStock, todayAvailable: true },
  });
  await cleanup();
  await db.$disconnect();
});

async function scheduledSlot() {
  const { slotAvailability } = await import('./slots');
  const { availability } = await slotAvailability();
  const s = availability.scheduled.find((x) => x.available)!;
  return { type: 'SCHEDULED' as const, templateId: s.templateId, date: s.date };
}

describe('createOrder', () => {
  it('creates a COD order with snapshots, confirms it and clears the cart', async () => {
    await fillCart(1500);
    const res = await createOrder(user, { addressId, slot: await scheduledSlot(), paymentMethod: 'COD' });
    expect(res).toMatchObject({ status: 'CONFIRMED', totalPaise: 97500 + 4000, checkout: null });
    expect(res.orderNumber).toMatch(/^FP1\d{3,}$/);
    const order = await db.order.findUniqueOrThrow({
      where: { orderNumber: res.orderNumber },
      include: { items: true, events: true },
    });
    expect(order.items[0]).toMatchObject({ nameSnapshot: 'Pomfret', pricePerKgPaise: 65000, qtyGrams: 1500 });
    expect(order.addressSnapshot).toMatchObject({ pincode: '751030', line1: 'Plot 1' });
    expect(order.events.map((e) => e.status).sort()).toEqual(['CONFIRMED', 'PLACED']);
    expect(order.paymentStatus).toBe('COD_PENDING');
    expect(await db.cartItem.count({ where: { cart: { userId: user.id } } })).toBe(0);
  });

  it('keeps past orders unchanged when prices change (snapshot)', async () => {
    await fillCart(1000);
    const res = await createOrder(user, { addressId, slot: await scheduledSlot(), paymentMethod: 'COD' });
    await db.product.update({ where: { id: pomfretId }, data: { pricePerKgPaise: 99900 } });
    const item = await db.orderItem.findFirstOrThrow({ where: { order: { orderNumber: res.orderNumber } } });
    expect(item.pricePerKgPaise).toBe(65000);
    await db.product.update({ where: { id: pomfretId }, data: { pricePerKgPaise: 65000 } });
  });

  it('rejects sold-out items and an empty cart', async () => {
    await fillCart(1000);
    await db.product.update({ where: { id: pomfretId }, data: { todayAvailable: false } });
    await expect(
      createOrder(user, { addressId, slot: await scheduledSlot(), paymentMethod: 'COD' }),
    ).rejects.toMatchObject({
      code: 'SOLD_OUT',
    });
    await replaceCart(user.id, { items: [] });
    await expect(
      createOrder(user, { addressId, slot: await scheduledSlot(), paymentMethod: 'COD' }),
    ).rejects.toMatchObject({
      code: 'CART_EMPTY',
    });
  });

  it('reserves tracked stock and releases it on cancel', async () => {
    await db.product.update({ where: { id: pomfretId }, data: { stockGrams: 2000 } });
    await fillCart(1500);
    const res = await createOrder(user, { addressId, slot: await scheduledSlot(), paymentMethod: 'COD' });
    expect((await db.product.findUniqueOrThrow({ where: { id: pomfretId } })).stockGrams).toBe(500);
    await fillCart(1000);
    await expect(
      createOrder(user, { addressId, slot: await scheduledSlot(), paymentMethod: 'COD' }),
    ).rejects.toMatchObject({
      code: 'QTY_INVALID',
    });
    await cancelByCustomer(user.id, res.orderNumber, null);
    expect((await db.product.findUniqueOrThrow({ where: { id: pomfretId } })).stockGrams).toBe(2000);
  });

  it('applies a coupon once and enforces the total usage limit', async () => {
    await db.coupon.create({
      data: { code: 'ITEST50', type: 'FLAT', value: 5000, totalUsageLimit: 1, perUserLimit: 5 },
    });
    await fillCart(1000, 'ITEST50');
    const res = await createOrder(user, { addressId, slot: await scheduledSlot(), paymentMethod: 'COD' });
    expect(res.totalPaise).toBe(65000 - 5000 + 4000);
    expect((await db.coupon.findUniqueOrThrow({ where: { code: 'ITEST50' } })).usedCount).toBe(1);
    await fillCart(1000, 'ITEST50');
    await expect(
      createOrder(user, { addressId, slot: await scheduledSlot(), paymentMethod: 'COD' }),
    ).rejects.toMatchObject({
      code: 'COUPON_INVALID',
    });
  });

  it('refuses a full scheduled slot', async () => {
    const slot = await scheduledSlot();
    const template = await db.slotTemplate.findUniqueOrThrow({ where: { id: slot.templateId } });
    await db.slotTemplate.update({ where: { id: slot.templateId }, data: { capacity: 0 } });
    try {
      await fillCart(1000);
      await expect(createOrder(user, { addressId, slot, paymentMethod: 'COD' })).rejects.toMatchObject({
        code: 'SLOT_FULL',
      });
    } finally {
      await db.slotTemplate.update({ where: { id: slot.templateId }, data: { capacity: template.capacity } });
    }
  });
});

describe('payments & webhook', () => {
  it('marks an online order paid only via a signed webhook, idempotently', async () => {
    await fillCart(1000);
    const res = await createOrder(user, { addressId, slot: await scheduledSlot(), paymentMethod: 'UPI' });
    expect(res.status).toBe('PLACED');
    expect(res.checkout?.razorpayOrderId).toMatch(/^order_/);

    const body = JSON.stringify({
      event: 'payment.captured',
      payload: {
        payment: {
          entity: { id: 'pay_itest1', order_id: res.checkout!.razorpayOrderId, amount: res.totalPaise },
        },
      },
    });
    await expect(handleRazorpayWebhook(body, 'bad', 'evt_itest_bad')).rejects.toMatchObject({
      code: 'FORBIDDEN',
    });

    const sig = hmacSha256Hex(body, 'dev-webhook-secret');
    const eventId = `evt_itest_${Date.now()}`;
    expect(await handleRazorpayWebhook(body, sig, eventId)).toMatchObject({ status: 'processed' });
    expect(await handleRazorpayWebhook(body, sig, eventId)).toMatchObject({ status: 'duplicate' });

    const order = await db.order.findUniqueOrThrow({
      where: { orderNumber: res.orderNumber },
      include: { events: true },
    });
    expect(order).toMatchObject({ status: 'CONFIRMED', paymentStatus: 'PAID' });
    expect(order.events.filter((e) => e.status === 'CONFIRMED')).toHaveLength(1);
    await db.webhookEvent.deleteMany({ where: { eventId } });
  });

  it('ignores amount mismatches and records failures', async () => {
    await fillCart(1000);
    const res = await createOrder(user, { addressId, slot: await scheduledSlot(), paymentMethod: 'CARD' });
    const wrong = JSON.stringify({
      event: 'payment.captured',
      payload: { payment: { entity: { id: 'pay_x', order_id: res.checkout!.razorpayOrderId, amount: 1 } } },
    });
    await handleRazorpayWebhook(
      wrong,
      hmacSha256Hex(wrong, 'dev-webhook-secret'),
      `evt_itest_amt_${Date.now()}`,
    );
    expect(
      (await db.order.findUniqueOrThrow({ where: { orderNumber: res.orderNumber } })).paymentStatus,
    ).toBe('PENDING');

    await simulateGatewayPayment(user.id, res.orderNumber, 'failure');
    expect(
      (await db.order.findUniqueOrThrow({ where: { orderNumber: res.orderNumber } })).paymentStatus,
    ).toBe('FAILED');
  });

  it('cancels unpaid online orders after the configured time', async () => {
    await fillCart(1000);
    const res = await createOrder(user, { addressId, slot: await scheduledSlot(), paymentMethod: 'UPI' });
    await db.order.update({
      where: { orderNumber: res.orderNumber },
      data: { placedAt: new Date(Date.now() - 31 * 60_000) },
    });
    expect(await expireUnpaidOrders()).toBeGreaterThanOrEqual(1);
    const order = await db.order.findUniqueOrThrow({ where: { orderNumber: res.orderNumber } });
    expect(order).toMatchObject({ status: 'CANCELLED', cancelReason: 'Payment not completed in time' });
  });
});

describe('transitionOrder', () => {
  it('enforces the allowed flow and writes events', async () => {
    await fillCart(1000);
    const res = await createOrder(user, { addressId, slot: await scheduledSlot(), paymentMethod: 'COD' });
    const { id } = await db.order.findUniqueOrThrow({ where: { orderNumber: res.orderNumber } });
    await expect(transitionOrder(id, 'DELIVERED', { type: 'admin' })).rejects.toMatchObject({
      code: 'INVALID_TRANSITION',
    });
    for (const to of ['CLEANING_PACKING', 'OUT_FOR_DELIVERY', 'DELIVERED'] as const) {
      await transitionOrder(id, to, { type: 'admin', userId: user.id });
    }
    const order = await db.order.findUniqueOrThrow({ where: { id }, include: { events: true } });
    expect(order).toMatchObject({ status: 'DELIVERED', paymentStatus: 'COD_COLLECTED' });
    expect(order.events).toHaveLength(5);
    await expect(transitionOrder(id, 'CANCELLED', { type: 'admin' })).rejects.toMatchObject({
      code: 'INVALID_TRANSITION',
    });
    await expect(cancelByCustomer(user.id, res.orderNumber, null)).rejects.toMatchObject({
      code: 'CANCEL_NOT_ALLOWED',
    });
  });
});
