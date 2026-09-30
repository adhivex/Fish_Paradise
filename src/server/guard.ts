import 'server-only';
import { ApiError } from '@/lib/api';
import { consume } from '@/server/rate-limit';

/** Per-key limits for write endpoints (abuse / brute-force protection). */
export const LIMITS = {
  orderCreate: { limit: 10, windowMs: 10 * 60_000 },
  couponCheck: { limit: 20, windowMs: 10 * 60_000 },
  addressWrite: { limit: 30, windowMs: 60 * 60_000 },
  otpVerify: { limit: 30, windowMs: 60 * 60_000 },
} as const;

/** Throws RATE_LIMITED (429 + Retry-After) when `key` exceeded its limit. */
export async function rateLimit(name: keyof typeof LIMITS, key: string): Promise<void> {
  const { limit, windowMs } = LIMITS[name];
  const wait = await consume(`${name}:${key}`, limit, windowMs);
  if (wait > 0) {
    throw new ApiError('RATE_LIMITED', 'Too many requests. Please wait a moment and try again.', 429, {
      'Retry-After': String(wait),
    });
  }
}
