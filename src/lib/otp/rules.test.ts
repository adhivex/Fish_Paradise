import { describe, expect, it } from 'vitest';
import {
  decideOtpRequest,
  decideOtpVerify,
  isWellFormedOtp,
  OTP_IP_LIMIT,
  OTP_MAX_ATTEMPTS,
  OTP_PHONE_LIMIT,
  OTP_RESEND_COOLDOWN_MS,
  OTP_TTL_MS,
} from './rules';

const now = 10_000_000;
const minutes = (n: number) => n * 60_000;

describe('decideOtpRequest', () => {
  it('allows the first request', () => {
    expect(decideOtpRequest({ now, lastSentAt: null, phoneHits: [], ipHits: [] })).toEqual({ ok: true });
  });

  it('enforces a resend cooldown', () => {
    const d = decideOtpRequest({ now, lastSentAt: now - 10_000, phoneHits: [now - 10_000], ipHits: [] });
    expect(d).toEqual({ ok: false, reason: 'COOLDOWN', retryAfterSec: 20 });
    expect(
      decideOtpRequest({
        now,
        lastSentAt: now - OTP_RESEND_COOLDOWN_MS,
        phoneHits: [now - OTP_RESEND_COOLDOWN_MS],
        ipHits: [],
      }).ok,
    ).toBe(true);
  });

  it('limits requests per phone within the window', () => {
    const hits = Array.from({ length: OTP_PHONE_LIMIT.limit }, (_, i) => now - minutes(50) + i * minutes(5));
    const d = decideOtpRequest({ now, lastSentAt: hits.at(-1)!, phoneHits: hits, ipHits: [] });
    expect(d).toEqual({ ok: false, reason: 'PHONE', retryAfterSec: 600 });
  });

  it('ignores hits older than the window', () => {
    const old = Array.from({ length: 10 }, () => now - minutes(61));
    expect(decideOtpRequest({ now, lastSentAt: old[0]!, phoneHits: old, ipHits: old }).ok).toBe(true);
  });

  it('limits requests per IP', () => {
    const hits = Array.from({ length: OTP_IP_LIMIT.limit }, () => now - minutes(1));
    const d = decideOtpRequest({ now, lastSentAt: null, phoneHits: [], ipHits: hits });
    expect(d).toMatchObject({ ok: false, reason: 'IP' });
  });
});

describe('decideOtpVerify', () => {
  const fresh = { expiresAt: now + OTP_TTL_MS, attempts: 0, consumedAt: null };

  it('accepts a matching fresh code', () => {
    expect(decideOtpVerify(fresh, true, now)).toBe('OK');
  });

  it('rejects wrong codes', () => {
    expect(decideOtpVerify(fresh, false, now)).toBe('INVALID');
  });

  it('expires after five minutes', () => {
    expect(decideOtpVerify(fresh, true, now + OTP_TTL_MS)).toBe('EXPIRED');
  });

  it('locks after five attempts even with the right code', () => {
    expect(decideOtpVerify({ ...fresh, attempts: OTP_MAX_ATTEMPTS }, true, now)).toBe('TOO_MANY_ATTEMPTS');
  });

  it('never reuses a consumed code', () => {
    expect(decideOtpVerify({ ...fresh, consumedAt: now - 1 }, true, now)).toBe('NO_CODE');
    expect(decideOtpVerify(null, true, now)).toBe('NO_CODE');
  });
});

describe('isWellFormedOtp', () => {
  it('requires six digits', () => {
    expect(isWellFormedOtp('123456')).toBe(true);
    expect(isWellFormedOtp('12345')).toBe(false);
    expect(isWellFormedOtp('12a456')).toBe(false);
  });
});
