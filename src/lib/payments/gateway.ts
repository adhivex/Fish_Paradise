import 'server-only';
import { randomBytes } from 'node:crypto';
import { env } from '@/lib/env';
import { log } from '@/lib/log';

export interface GatewayOrder {
  id: string; // Razorpay order id (order_...)
  amountPaise: number;
  currency: 'INR';
}

/**
 * `razorpay`: real Orders API (test or live keys).
 * `fake`: local development without keys – orders get fake ids and the in-app "test payment" page
 * sends a correctly signed webhook, so the real webhook code path is exercised end to end.
 */
export function paymentProvider(): 'razorpay' | 'fake' {
  return env().PAYMENT_PROVIDER;
}

export function webhookSecret(): string {
  const secret = env().RAZORPAY_WEBHOOK_SECRET;
  if (secret) return secret;
  if (env().NODE_ENV === 'production') throw new Error('RAZORPAY_WEBHOOK_SECRET is required');
  return 'dev-webhook-secret';
}

export async function createGatewayOrder(input: {
  amountPaise: number;
  receipt: string;
  notes: Record<string, string>;
}): Promise<GatewayOrder> {
  if (paymentProvider() === 'fake') {
    return {
      id: `order_fake${randomBytes(7).toString('hex')}`,
      amountPaise: input.amountPaise,
      currency: 'INR',
    };
  }
  const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } = env();
  if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) throw new Error('Razorpay keys are not configured');
  const res = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      authorization: `Basic ${Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64')}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      amount: input.amountPaise,
      currency: 'INR',
      receipt: input.receipt,
      notes: input.notes,
    }),
    signal: AbortSignal.timeout(10_000),
  });
  const body = (await res.json().catch(() => ({}))) as {
    id?: string;
    amount?: number;
    error?: { description?: string };
  };
  if (!res.ok || !body.id) {
    log.error('payment.gateway_order_failed', { status: res.status, message: body.error?.description });
    throw new Error('Could not start the payment');
  }
  return { id: body.id, amountPaise: body.amount ?? input.amountPaise, currency: 'INR' };
}

export function publicKeyId(): string | null {
  return paymentProvider() === 'razorpay' ? (env().RAZORPAY_KEY_ID ?? null) : null;
}
