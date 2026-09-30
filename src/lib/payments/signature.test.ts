import { describe, expect, it } from 'vitest';
import { hmacSha256Hex, verifyCheckoutSignature, verifyWebhookSignature } from './signature';

const secret = 'whsec_test';
const body = JSON.stringify({ event: 'payment.captured', payload: { payment: { entity: { id: 'pay_1' } } } });

describe('verifyWebhookSignature', () => {
  it('accepts the correct signature for the exact raw body', () => {
    expect(verifyWebhookSignature(body, hmacSha256Hex(body, secret), secret)).toBe(true);
  });

  it('rejects a tampered body, wrong secret, missing or malformed signature', () => {
    const sig = hmacSha256Hex(body, secret);
    expect(verifyWebhookSignature(body.replace('pay_1', 'pay_2'), sig, secret)).toBe(false);
    expect(verifyWebhookSignature(body, hmacSha256Hex(body, 'other'), secret)).toBe(false);
    expect(verifyWebhookSignature(body, null, secret)).toBe(false);
    expect(verifyWebhookSignature(body, 'not-hex!', secret)).toBe(false);
    expect(verifyWebhookSignature(body, sig.slice(0, 10), secret)).toBe(false);
  });
});

describe('verifyCheckoutSignature', () => {
  it('checks order_id|payment_id against the key secret', () => {
    const sig = hmacSha256Hex('order_1|pay_1', 'key_secret');
    expect(verifyCheckoutSignature('order_1', 'pay_1', sig, 'key_secret')).toBe(true);
    expect(verifyCheckoutSignature('order_1', 'pay_2', sig, 'key_secret')).toBe(false);
  });
});
