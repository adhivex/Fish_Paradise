import 'server-only';
import { randomUUID } from 'node:crypto';
import type { Order, OrderEvent, OrderItem, Prisma } from '@prisma/client';
import { ApiError, type ApiErrorCode } from '@/lib/api';
import type { CartLine, QuoteBlocker } from '@/lib/cart';
import { log } from '@/lib/log';
import { canTransition, customerCanCancel, orderNumberFromSeq } from '@/lib/orders';
import { createGatewayOrder, paymentProvider, publicKeyId } from '@/lib/payments/gateway';
import { istParts } from '@/lib/ist';
import { resolveSlot } from '@/lib/slots';
import type { AddressDTO, OrderDTO, OrderStatus, PaymentMethod, SlotChoice } from '@/lib/types';
import { db } from '@/server/db';
import { getOwnAddress } from '@/server/services/addresses';
import { readCart } from '@/server/services/cart';
import { queueNotification } from '@/server/services/notify';
import { priceLines } from '@/server/services/pricing';
import { slotAvailability } from '@/server/services/slots';

type Tx = Prisma.TransactionClient;
type OrderRow = Order & { items: OrderItem[]; events: OrderEvent[] };

type ProductRef = { slug: string; imageUrl: string | null };

export function toOrderDTO(o: OrderRow, products: Map<string, ProductRef>): OrderDTO {
  return {
    id: o.id,
    orderNumber: o.orderNumber,
    status: o.status,
    placedAt: o.placedAt.getTime(),
    items: o.items.map((i) => ({
      productId: i.productId,
      productSlug: products.get(i.productId)?.slug ?? '',
      productImageUrl: products.get(i.productId)?.imageUrl ?? null,
      nameSnapshot: i.nameSnapshot,
      pricePerKgPaise: i.pricePerKgPaise,
      qtyGrams: i.qtyGrams,
      cleaningLabel: i.cleaningLabel,
      lineNote: i.lineNote,
      lineTotalPaise: i.lineTotalPaise,
    })),
    addressSnapshot: o.addressSnapshot as unknown as AddressDTO,
    slotLabel: o.slotLabel ?? (o.slotType === 'ASAP' ? 'ASAP' : 'Scheduled'),
    slotType: o.slotType,
    subtotalPaise: o.subtotalPaise,
    deliveryFeePaise: o.deliveryFeePaise,
    discountPaise: o.discountPaise,
    totalPaise: o.totalPaise,
    paymentMethod: o.paymentMethod,
    paymentStatus: o.paymentStatus,
    notes: o.notes,
    cancelReason: o.cancelReason,
    etaMinMinutes: o.etaMinMinutes,
    etaMaxMinutes: o.etaMaxMinutes,
    events: o.events
      .slice()
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      .map((e) => ({ status: e.status, at: e.createdAt.getTime(), note: e.note })),
    canCancel: customerCanCancel(o.status),
  };
}

async function slugsFor(orders: OrderRow[]): Promise<Map<string, ProductRef>> {
  const ids = [...new Set(orders.flatMap((o) => o.items.map((i) => i.productId)))];
  const rows = await db.product.findMany({
    where: { id: { in: ids } },
    select: { id: true, slug: true, imageUrl: true },
  });
  return new Map(rows.map((r) => [r.id, { slug: r.slug, imageUrl: r.imageUrl }]));
}

const ORDER_INCLUDE = { items: true, events: true } as const;

// ---------------------------------------------------------------------------------------------
// Status changes – the ONLY place Order.status is written after creation (rule 5).
// ---------------------------------------------------------------------------------------------

export interface Actor {
  type: 'admin' | 'customer' | 'system';
  userId?: string;
}

async function applyTransition(tx: Tx, orderId: string, to: OrderStatus, actor: Actor, note?: string | null) {
  const order = await tx.order.findUnique({
    where: { id: orderId },
    include: { items: true, couponUse: true },
  });
  if (!order) throw new ApiError('NOT_FOUND', 'Order not found.', 404);
  if (!canTransition(order.status, to)) {
    throw new ApiError('INVALID_TRANSITION', `Cannot move an order from ${order.status} to ${to}.`, 409);
  }

  const data: Prisma.OrderUpdateManyMutationInput = { status: to };
  if (to === 'CANCELLED') {
    data.cancelReason = note ?? null;
    if (order.paymentStatus === 'PAID') data.paymentStatus = 'REFUND_PENDING';
  }
  if (to === 'DELIVERED' && order.paymentStatus === 'COD_PENDING') data.paymentStatus = 'COD_COLLECTED';

  // Optimistic concurrency: only succeeds if nobody changed the status meanwhile.
  const updated = await tx.order.updateMany({ where: { id: orderId, status: order.status }, data });
  if (updated.count === 0)
    throw new ApiError('CONFLICT', 'The order was updated elsewhere. Please refresh.', 409);

  await tx.orderEvent.create({
    data: {
      orderId,
      status: to,
      note: note ?? null,
      actorId: actor.type === 'admin' ? (actor.userId ?? null) : null,
    },
  });

  if (to === 'CANCELLED') {
    // Release reserved stock and the coupon use.
    for (const item of order.items) {
      await tx.product.updateMany({
        where: { id: item.productId, stockGrams: { not: null } },
        data: { stockGrams: { increment: item.qtyGrams } },
      });
    }
    if (order.couponUse) {
      await tx.couponUse.delete({ where: { id: order.couponUse.id } });
      await tx.coupon.update({
        where: { id: order.couponUse.couponId },
        data: { usedCount: { decrement: 1 } },
      });
    }
  }
  return order;
}

/**
 * Moves an order to a new status: validates the transition, writes an OrderEvent, applies side
 * effects (stock/coupon release, refund task, COD collected) and queues notifications.
 */
export async function transitionOrder(orderId: string, to: OrderStatus, actor: Actor, note?: string | null) {
  await db.$transaction((tx) => applyTransition(tx, orderId, to, actor, note));
  log.info('order.transition', { orderId, to, actor: actor.type });
  queueNotification(orderId, to);
}

// ---------------------------------------------------------------------------------------------
// Order creation
// ---------------------------------------------------------------------------------------------

const BLOCKER_STATUS: Record<QuoteBlocker, ApiErrorCode> = {
  CART_EMPTY: 'CART_EMPTY',
  SOLD_OUT: 'SOLD_OUT',
  QTY_INVALID: 'QTY_INVALID',
  NOTE_REQUIRED: 'VALIDATION',
  PINCODE_UNSERVICEABLE: 'PINCODE_UNSERVICEABLE',
  MIN_ORDER_NOT_MET: 'MIN_ORDER_NOT_MET',
  COUPON_INVALID: 'COUPON_INVALID',
};

export interface CreateOrderInput {
  addressId: string;
  slot: SlotChoice;
  paymentMethod: PaymentMethod;
  notes?: string | null;
}

export interface CheckoutParams {
  provider: 'razorpay' | 'fake';
  keyId: string | null;
  razorpayOrderId: string;
  amountPaise: number;
  currency: 'INR';
  prefill: { contact: string; name: string | null; email: string | null };
}

export interface CreateOrderResult {
  orderNumber: string;
  status: OrderStatus;
  totalPaise: number;
  checkout: CheckoutParams | null;
}

/** Creates an order from the user's server cart in one transaction (docs/DATA_MODEL.md). */
export async function createOrder(
  user: { id: string; phone: string; name: string | null; email: string | null },
  input: CreateOrderInput,
): Promise<CreateOrderResult> {
  const now = new Date();
  const address = await getOwnAddress(user.id, input.addressId);
  const cart = await readCart(user.id);
  const { shop, availability } = await slotAvailability(now);
  const slot = resolveSlot(input.slot, availability, shop);
  if (!slot.ok) throw new ApiError(slot.code, slot.message, 409);
  const settings = await db.shopSettings.findUnique({ where: { id: 'shop' } });

  const order = await db.$transaction(async (tx) => {
    const quote = await priceLines(
      { lines: cart.items, couponCode: cart.couponCode, pincode: address.pincode, userId: user.id, now },
      tx,
    );
    const blocker = quote.blockers[0];
    if (blocker) throw new ApiError(BLOCKER_STATUS[blocker.code], blocker.message, 409);

    // Scheduled capacity: serialize bookings per slot so two orders cannot take the last place.
    if (slot.type === 'SCHEDULED') {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`${slot.templateId}:${istParts(slot.startsAt).date}`}))`;
      const template = await tx.slotTemplate.findUnique({ where: { id: slot.templateId } });
      const booked = await tx.order.count({
        where: { slotTemplateId: slot.templateId, slotStart: slot.startsAt, status: { not: 'CANCELLED' } },
      });
      if (!template || booked >= template.capacity) {
        throw new ApiError('SLOT_FULL', 'That slot just filled up. Please pick another.', 409);
      }
    }

    // Reserve tracked stock (released again if the order is cancelled or expires).
    for (const line of quote.lines) {
      const product = await tx.product.findUniqueOrThrow({
        where: { id: line.productId },
        select: { stockGrams: true },
      });
      if (product.stockGrams === null) continue;
      // Conditional decrement: fails if another order took the stock in the meantime.
      const res = await tx.product.updateMany({
        where: { id: line.productId, stockGrams: { gte: line.qtyGrams } },
        data: { stockGrams: { decrement: line.qtyGrams } },
      });
      if (res.count === 0) throw new ApiError('SOLD_OUT', `${line.name} just sold out.`, 409);
    }

    // Coupon: re-validated in the quote above; count the use atomically against the global limit.
    if (quote.couponId) {
      const coupon = await tx.coupon.findUniqueOrThrow({ where: { id: quote.couponId } });
      const inc = await tx.coupon.updateMany({
        where: {
          id: coupon.id,
          ...(coupon.totalUsageLimit !== null ? { usedCount: { lt: coupon.totalUsageLimit } } : {}),
        },
        data: { usedCount: { increment: 1 } },
      });
      if (inc.count === 0) throw new ApiError('COUPON_INVALID', 'This coupon has been fully redeemed.', 409);
    }

    const addressSnapshot: AddressDTO = {
      id: address.id,
      label: address.label,
      line1: address.line1,
      line2: address.line2 ?? undefined,
      landmark: address.landmark ?? undefined,
      area: address.area ?? undefined,
      city: address.city,
      state: address.state,
      pincode: address.pincode,
      isDefault: address.isDefault,
    };

    const created = await tx.order.create({
      data: {
        orderNumber: `TMP-${randomUUID()}`,
        userId: user.id,
        status: 'PLACED',
        addressSnapshot: addressSnapshot as unknown as Prisma.InputJsonValue,
        slotType: slot.type,
        slotTemplateId: slot.type === 'SCHEDULED' ? slot.templateId : null,
        slotStart: slot.type === 'SCHEDULED' ? slot.startsAt : null,
        slotEnd: slot.type === 'SCHEDULED' ? slot.endsAt : null,
        slotLabel: slot.label,
        etaMinMinutes: slot.type === 'ASAP' ? slot.etaMin : null,
        etaMaxMinutes: slot.type === 'ASAP' ? slot.etaMax : null,
        subtotalPaise: quote.subtotalPaise,
        deliveryFeePaise: quote.deliveryFeePaise,
        discountPaise: quote.discountPaise,
        totalPaise: quote.totalPaise,
        couponId: quote.couponId,
        notes: input.notes?.trim() || cart.notes.trim() || null,
        paymentMethod: input.paymentMethod,
        paymentStatus: input.paymentMethod === 'COD' ? 'COD_PENDING' : 'PENDING',
        items: {
          create: quote.lines.map((l) => ({
            productId: l.productId,
            nameSnapshot: l.name,
            pricePerKgPaise: l.pricePerKgPaise,
            qtyGrams: l.qtyGrams,
            cleaningLabel: l.cleaningLabel,
            lineNote: l.lineNote,
            lineTotalPaise: l.lineTotalPaise,
          })),
        },
        events: { create: { status: 'PLACED' } },
      },
    });
    const withNumber = await tx.order.update({
      where: { id: created.id },
      data: { orderNumber: orderNumberFromSeq(created.seq) },
    });
    if (quote.couponId) {
      await tx.couponUse.create({ data: { couponId: quote.couponId, userId: user.id, orderId: created.id } });
    }
    await tx.cartItem.deleteMany({ where: { cart: { userId: user.id } } });
    await tx.cart.updateMany({ where: { userId: user.id }, data: { notes: null, couponCode: null } });
    return withNumber;
  });

  log.info('order.created', {
    orderId: order.id,
    orderNumber: order.orderNumber,
    method: order.paymentMethod,
  });
  queueNotification(order.id, 'PLACED_OWNER');

  if (order.paymentMethod === 'COD') {
    const autoConfirm = settings?.autoConfirmCod ?? true;
    if (autoConfirm) await transitionOrder(order.id, 'CONFIRMED', { type: 'system' });
    return {
      orderNumber: order.orderNumber,
      status: autoConfirm ? 'CONFIRMED' : 'PLACED',
      totalPaise: order.totalPaise,
      checkout: null,
    };
  }

  const checkout = await startPayment(order, user);
  return { orderNumber: order.orderNumber, status: 'PLACED', totalPaise: order.totalPaise, checkout };
}

/** Creates a gateway order + Payment(PENDING). The order is only marked paid by the webhook. */
async function startPayment(
  order: Order,
  user: { phone: string; name: string | null; email: string | null },
): Promise<CheckoutParams> {
  const gw = await createGatewayOrder({
    amountPaise: order.totalPaise,
    receipt: order.orderNumber,
    notes: { orderNumber: order.orderNumber, orderId: order.id },
  });
  await db.payment.create({
    data: {
      orderId: order.id,
      razorpayOrderId: gw.id,
      amountPaise: order.totalPaise,
      status: 'PENDING',
      method: order.paymentMethod,
    },
  });
  if (order.paymentStatus === 'FAILED') {
    await db.order.update({ where: { id: order.id }, data: { paymentStatus: 'PENDING' } });
  }
  log.info('payment.started', { orderId: order.id, provider: paymentProvider() });
  return {
    provider: paymentProvider(),
    keyId: publicKeyId(),
    razorpayOrderId: gw.id,
    amountPaise: order.totalPaise,
    currency: 'INR',
    prefill: { contact: user.phone, name: user.name, email: user.email },
  };
}

/** Retry payment for an unpaid online order (e.g. the customer closed the payment window). */
export async function retryPayment(
  user: { id: string; phone: string; name: string | null; email: string | null },
  orderNumber: string,
): Promise<CheckoutParams> {
  const order = await db.order.findFirst({ where: { orderNumber, userId: user.id } });
  if (!order) throw new ApiError('NOT_FOUND', 'Order not found.', 404);
  if (
    order.paymentMethod === 'COD' ||
    order.status !== 'PLACED' ||
    !['PENDING', 'FAILED'].includes(order.paymentStatus)
  ) {
    throw new ApiError('CONFLICT', 'This order does not need payment.', 409);
  }
  return startPayment(order, user);
}

// ---------------------------------------------------------------------------------------------
// Reads & customer actions
// ---------------------------------------------------------------------------------------------

export async function listOrders(userId: string, statuses: OrderStatus[] | null): Promise<OrderDTO[]> {
  const rows = await db.order.findMany({
    where: { userId, ...(statuses ? { status: { in: statuses } } : {}) },
    include: ORDER_INCLUDE,
    orderBy: { placedAt: 'desc' },
    take: 50,
  });
  const slugs = await slugsFor(rows);
  return rows.map((r) => toOrderDTO(r, slugs));
}

export async function getOrderForUser(userId: string, orderNumber: string): Promise<OrderDTO> {
  const row = await db.order.findFirst({ where: { orderNumber, userId }, include: ORDER_INCLUDE });
  if (!row) throw new ApiError('NOT_FOUND', 'Order not found.', 404);
  return toOrderDTO(row, await slugsFor([row]));
}

export async function cancelByCustomer(userId: string, orderNumber: string, reason: string | null) {
  const order = await db.order.findFirst({ where: { orderNumber, userId } });
  if (!order) throw new ApiError('NOT_FOUND', 'Order not found.', 404);
  if (order.status === 'CANCELLED')
    throw new ApiError('CANCEL_NOT_ALLOWED', 'This order is already cancelled.', 409);
  if (!customerCanCancel(order.status)) {
    throw new ApiError(
      'CANCEL_NOT_ALLOWED',
      'This order is already being prepared. Please call the shop.',
      409,
    );
  }
  await transitionOrder(
    order.id,
    'CANCELLED',
    { type: 'customer', userId },
    reason || 'Cancelled by customer',
  );
  return getOrderForUser(userId, orderNumber);
}

/** "Order again": lines to add to the cart, skipping products that are gone or sold out today. */
export async function reorderLines(
  userId: string,
  orderNumber: string,
): Promise<{ lines: CartLine[]; skipped: string[] }> {
  const order = await db.order.findFirst({ where: { orderNumber, userId }, include: { items: true } });
  if (!order) throw new ApiError('NOT_FOUND', 'Order not found.', 404);
  const [products, cleaning] = await Promise.all([
    db.product.findMany({ where: { id: { in: order.items.map((i) => i.productId) } } }),
    db.cleaningOption.findMany({ where: { isActive: true } }),
  ]);
  const byId = new Map(products.map((p) => [p.id, p]));
  const defaultCleaning = cleaning.find((c) => c.isDefault) ?? cleaning[0];
  const lines: CartLine[] = [];
  const skipped: string[] = [];
  for (const item of order.items) {
    const p = byId.get(item.productId);
    const option = cleaning.find((c) => c.label === item.cleaningLabel) ?? defaultCleaning;
    if (!p || !p.isActive || !p.todayAvailable || !option) {
      skipped.push(item.nameSnapshot);
      continue;
    }
    lines.push({
      productId: p.id,
      qtyGrams: item.qtyGrams,
      cleaningOptionId: option.id,
      lineNote: item.lineNote,
    });
  }
  return { lines, skipped };
}

/** Background job: cancel online orders still unpaid after `unpaidCancelMinutes`. */
export async function expireUnpaidOrders(now = new Date()): Promise<number> {
  const settings = await db.shopSettings.findUnique({ where: { id: 'shop' } });
  const minutes = settings?.unpaidCancelMinutes ?? 30;
  const stale = await db.order.findMany({
    where: {
      status: 'PLACED',
      paymentMethod: { not: 'COD' },
      paymentStatus: { in: ['PENDING', 'FAILED'] },
      placedAt: { lt: new Date(now.getTime() - minutes * 60_000) },
    },
    select: { id: true },
    take: 200,
  });
  let cancelled = 0;
  for (const o of stale) {
    try {
      await transitionOrder(o.id, 'CANCELLED', { type: 'system' }, 'Payment not completed in time');
      cancelled++;
    } catch (err) {
      log.warn('order.expire_skipped', { orderId: o.id, err });
    }
  }
  if (cancelled) log.info('order.expired_unpaid', { count: cancelled });
  return cancelled;
}
