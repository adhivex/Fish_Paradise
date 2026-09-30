/** OTP policy (PRD §6): 5-minute expiry, max 5 attempts, rate limited per phone and per IP. */
export const OTP_TTL_MS = 5 * 60_000;
export const OTP_MAX_ATTEMPTS = 5;
export const OTP_RESEND_COOLDOWN_MS = 30_000;
export const OTP_PHONE_LIMIT = { limit: 5, windowMs: 60 * 60_000 };
export const OTP_IP_LIMIT = { limit: 20, windowMs: 60 * 60_000 };
export const OTP_LENGTH = 6;

export type RequestDecision =
  { ok: true } | { ok: false; retryAfterSec: number; reason: 'COOLDOWN' | 'PHONE' | 'IP' };

/**
 * Decides whether a new OTP may be sent. `phoneHits`/`ipHits` are request timestamps inside the
 * rate-limit window (oldest first); `lastSentAt` is the most recent OTP for this phone.
 */
export function decideOtpRequest(input: {
  now: number;
  lastSentAt: number | null;
  phoneHits: number[];
  ipHits: number[];
}): RequestDecision {
  const { now, lastSentAt } = input;
  if (lastSentAt !== null && now - lastSentAt < OTP_RESEND_COOLDOWN_MS) {
    return {
      ok: false,
      reason: 'COOLDOWN',
      retryAfterSec: Math.ceil((lastSentAt + OTP_RESEND_COOLDOWN_MS - now) / 1000),
    };
  }
  const check = (hits: number[], rule: { limit: number; windowMs: number }) => {
    const inWindow = hits.filter((t) => now - t < rule.windowMs);
    if (inWindow.length < rule.limit) return null;
    const oldest = Math.min(...inWindow);
    return Math.max(1, Math.ceil((oldest + rule.windowMs - now) / 1000));
  };
  const phoneWait = check(input.phoneHits, OTP_PHONE_LIMIT);
  if (phoneWait !== null) return { ok: false, reason: 'PHONE', retryAfterSec: phoneWait };
  const ipWait = check(input.ipHits, OTP_IP_LIMIT);
  if (ipWait !== null) return { ok: false, reason: 'IP', retryAfterSec: ipWait };
  return { ok: true };
}

export interface OtpRecord {
  expiresAt: number;
  attempts: number;
  consumedAt: number | null;
}

export type VerifyOutcome = 'OK' | 'NO_CODE' | 'EXPIRED' | 'TOO_MANY_ATTEMPTS' | 'INVALID';

/** Outcome of checking `matches` against the latest OTP for a phone. */
export function decideOtpVerify(record: OtpRecord | null, matches: boolean, now: number): VerifyOutcome {
  if (!record || record.consumedAt !== null) return 'NO_CODE';
  if (now >= record.expiresAt) return 'EXPIRED';
  if (record.attempts >= OTP_MAX_ATTEMPTS) return 'TOO_MANY_ATTEMPTS';
  return matches ? 'OK' : 'INVALID';
}

export function isWellFormedOtp(code: string): boolean {
  return new RegExp(`^\\d{${OTP_LENGTH}}$`).test(code);
}
