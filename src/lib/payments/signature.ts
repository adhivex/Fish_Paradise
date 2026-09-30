import { createHmac, timingSafeEqual } from 'node:crypto';

export function hmacSha256Hex(message: string, secret: string): string {
  return createHmac('sha256', secret).update(message).digest('hex');
}

function safeEqualHex(a: string, b: string): boolean {
  if (!/^[0-9a-f]+$/i.test(a) || !/^[0-9a-f]+$/i.test(b)) return false;
  const ab = Buffer.from(a, 'hex');
  const bb = Buffer.from(b, 'hex');
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

/** Razorpay webhooks: `X-Razorpay-Signature` = HMAC-SHA256(raw body, webhook secret). */
export function verifyWebhookSignature(rawBody: string, signature: string | null, secret: string): boolean {
  if (!signature || !secret) return false;
  return safeEqualHex(hmacSha256Hex(rawBody, secret), signature);
}

/** Checkout handler response: signature = HMAC-SHA256(`${order_id}|${payment_id}`, key secret). */
export function verifyCheckoutSignature(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  signature: string,
  keySecret: string,
): boolean {
  return safeEqualHex(hmacSha256Hex(`${razorpayOrderId}|${razorpayPaymentId}`, keySecret), signature);
}
