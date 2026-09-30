import 'server-only';
import { createHash, randomBytes } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { ApiError } from '@/lib/api';
import { log } from '@/lib/log';
import { webhookSecret } from '@/lib/payments/gateway';
import { hmacSha256Hex, verifyWebhookSignature } from '@/lib/payments/signature';
import { db } from '@/server/db';
import { transitionOrder } from '@/server/services/orders';

const paymentEntity = z.object({
  id: z.string(),
  order_id: z.string(),
  amount: z.number().int(),
  method: z.string().optional(),
  error_description: z.string().nullish(),
});

const webhookSchema = z.object({
  event: z.string(),
  payload: z.object({ payment: z.object({ entity: paymentEntity }).optional() }).passthrough(),
});

export type WebhookResult = { status: 'processed' | 'duplicate' | 'ignored'; event?: string };

/**
 * Razorpay webhook: verify signature on the raw body, record the event id (idempotency), then
 * apply it. This is the ONLY place an order becomes paid (rule 4).
 */
export async function handleRazorpayWebhook(
  rawBody: string,
  signature: string | null,
  eventIdHeader: string | null,
): Promise<WebhookResult> {
  if (!verifyWebhookSignature(rawBody, signature, webhookSecret())) {
    log.warn('webhook.bad_signature', {});
    throw new ApiError('FORBIDDEN', 'Invalid signature.', 400);
  }
  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(rawBody);
  } catch {
    throw new ApiError('VALIDATION', 'Invalid JSON.', 400);
  }
  const parsed = webhookSchema.safeParse(parsedJson);
  if (!parsed.success) throw new ApiError('VALIDATION', 'Unexpected webhook payload.', 400);
  const event = parsed.data;
  const eventId = eventIdHeader ?? createHash('sha256').update(rawBody).digest('hex');

  let record;
  try {
    record = await db.webhookEvent.create({
      data: {
        provider: 'razorpay',
        eventId,
        type: event.event,
        payload: parsedJson as Prisma.InputJsonValue,
      },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      log.info('webhook.duplicate', { eventId, type: event.event });
      return { status: 'duplicate', event: event.event };
    }
    throw err;
  }

  const payment = event.payload.payment?.entity;
  let status: WebhookResult['status'] = 'ignored';
  if (payment && (event.event === 'payment.captured' || event.event === 'order.paid')) {
    await markPaid(payment);
    status = 'processed';
  } else if (payment && event.event === 'payment.failed') {
    await markFailed(payment);
    status = 'processed';
  }

  await db.webhookEvent.update({ where: { id: record.id }, data: { processedAt: new Date() } });
  log.info('webhook.handled', { eventId, type: event.event, status });
  return { status, event: event.event };
}

async function markPaid(p: z.infer<typeof paymentEntity>) {
  const payment = await db.payment.findUnique({
    where: { razorpayOrderId: p.order_id },
    include: { order: true },
  });
  if (!payment) {
    log.warn('payment.unknown_order', { razorpayOrderId: p.order_id });
    return;
  }
  if (payment.status === 'PAID') return;
  if (p.amount !== payment.amountPaise) {
    log.error('payment.amount_mismatch', {
      orderId: payment.orderId,
      expected: payment.amountPaise,
      got: p.amount,
    });
    await db.payment.update({ where: { id: payment.id }, data: { failureReason: 'Amount mismatch' } });
    return;
  }
  const order = payment.order;
  await db.$transaction([
    db.payment.update({ where: { id: payment.id }, data: { status: 'PAID', razorpayPaymentId: p.id } }),
    db.order.update({
      where: { id: order.id },
      // Paid after the order was cancelled (e.g. expired): create a refund task for the shop.
      data: { paymentStatus: order.status === 'CANCELLED' ? 'REFUND_PENDING' : 'PAID' },
    }),
  ]);
  log.info('payment.captured', { orderId: order.id, amount: p.amount });
  if (order.status === 'PLACED')
    await transitionOrder(order.id, 'CONFIRMED', { type: 'system' }, 'Payment received');
}

async function markFailed(p: z.infer<typeof paymentEntity>) {
  const payment = await db.payment.findUnique({ where: { razorpayOrderId: p.order_id } });
  if (!payment || payment.status === 'PAID') return;
  await db.$transaction([
    db.payment.update({
      where: { id: payment.id },
      data: {
        status: 'FAILED',
        razorpayPaymentId: p.id,
        failureReason: p.error_description ?? 'Payment failed',
      },
    }),
    db.order.updateMany({
      where: { id: payment.orderId, paymentStatus: 'PENDING' },
      data: { paymentStatus: 'FAILED' },
    }),
  ]);
  log.warn('payment.failed', { orderId: payment.orderId, reason: p.error_description });
}

/**
 * Development only (PAYMENT_PROVIDER=fake): simulates Razorpay by sending a correctly signed
 * webhook for the order's latest pending payment through the real handler.
 */
export async function simulateGatewayPayment(
  userId: string,
  orderNumber: string,
  outcome: 'success' | 'failure',
) {
  const order = await db.order.findFirst({
    where: { orderNumber, userId },
    include: { payments: { where: { status: 'PENDING' }, orderBy: { createdAt: 'desc' }, take: 1 } },
  });
  const payment = order?.payments[0];
  if (!order || !payment?.razorpayOrderId)
    throw new ApiError('NOT_FOUND', 'No pending payment for this order.', 404);
  const body = JSON.stringify({
    event: outcome === 'success' ? 'payment.captured' : 'payment.failed',
    payload: {
      payment: {
        entity: {
          id: `pay_fake${randomBytes(7).toString('hex')}`,
          order_id: payment.razorpayOrderId,
          amount: payment.amountPaise,
          method: order.paymentMethod.toLowerCase(),
          error_description: outcome === 'failure' ? 'Payment declined in test mode' : null,
        },
      },
    },
  });
  return handleRazorpayWebhook(
    body,
    hmacSha256Hex(body, webhookSecret()),
    `evt_fake${randomBytes(8).toString('hex')}`,
  );
}
