import 'server-only';
import { createHmac, randomInt, timingSafeEqual } from 'node:crypto';
import { ApiError } from '@/lib/api';
import { env } from '@/lib/env';
import { log } from '@/lib/log';
import {
  decideOtpRequest,
  decideOtpVerify,
  OTP_IP_LIMIT,
  OTP_LENGTH,
  OTP_PHONE_LIMIT,
  OTP_TTL_MS,
} from '@/lib/otp/rules';
import { otpProvider } from '@/lib/otp/providers';
import { maskPhone } from '@/lib/phone';
import { authSecret } from '@/lib/session';
import { db } from '@/server/db';
import { recentHits, recordHit } from '@/server/rate-limit';

function hashOtp(phone: string, code: string): string {
  return createHmac('sha256', authSecret()).update(`${phone}:${code}`).digest('hex');
}

function sameHash(a: string, b: string): boolean {
  const ab = Buffer.from(a, 'hex');
  const bb = Buffer.from(b, 'hex');
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

export interface OtpRequestResult {
  expiresInSec: number;
  resendAfterSec: number;
  /** Only with the console provider outside production, to make local testing easy. */
  devCode?: string;
}

export async function requestOtp(phone: string, ip: string): Promise<OtpRequestResult> {
  const now = Date.now();
  const phoneKey = `otp:phone:${phone}`;
  const ipKey = `otp:ip:${ip}`;
  const [phoneHits, ipHits] = await Promise.all([
    recentHits(phoneKey, OTP_PHONE_LIMIT.windowMs),
    recentHits(ipKey, OTP_IP_LIMIT.windowMs),
  ]);
  const decision = decideOtpRequest({ now, lastSentAt: phoneHits.at(-1) ?? null, phoneHits, ipHits });
  if (!decision.ok) {
    log.warn('otp.rate_limited', { phone: maskPhone(phone), reason: decision.reason });
    throw new ApiError(
      'OTP_RATE_LIMITED',
      decision.reason === 'COOLDOWN'
        ? `Please wait ${decision.retryAfterSec} seconds before asking for a new code.`
        : 'Too many code requests. Please try again later.',
      429,
      { 'Retry-After': String(decision.retryAfterSec) },
    );
  }

  const code = String(randomInt(0, 10 ** OTP_LENGTH)).padStart(OTP_LENGTH, '0');
  await recordHit(phoneKey, ipKey);
  // A new code replaces any older unused one.
  await db.otpCode.updateMany({ where: { phone, consumedAt: null }, data: { consumedAt: new Date(now) } });
  await db.otpCode.create({
    data: { phone, codeHash: hashOtp(phone, code), expiresAt: new Date(now + OTP_TTL_MS) },
  });

  const provider = otpProvider();
  await provider.send(phone, code);
  log.info('otp.sent', { phone: maskPhone(phone), provider: provider.name });

  const exposeCode = provider.name === 'console' && env().NODE_ENV !== 'production';
  return { expiresInSec: OTP_TTL_MS / 1000, resendAfterSec: 30, ...(exposeCode ? { devCode: code } : {}) };
}

export interface SessionUser {
  id: string;
  phone: string;
  name: string | null;
  email: string | null;
  role: 'CUSTOMER' | 'ADMIN';
}

const USER_SELECT = { id: true, phone: true, name: true, email: true, role: true } as const;

/** Verifies the latest code for a phone; creates the user on first login. */
export async function verifyOtp(phone: string, code: string): Promise<SessionUser> {
  const now = Date.now();
  const record = await db.otpCode.findFirst({
    where: { phone, consumedAt: null },
    orderBy: { createdAt: 'desc' },
  });
  const matches = !!record && sameHash(record.codeHash, hashOtp(phone, code));
  const outcome = decideOtpVerify(
    record && { expiresAt: record.expiresAt.getTime(), attempts: record.attempts, consumedAt: null },
    matches,
    now,
  );

  if (outcome !== 'OK') {
    if (record && outcome === 'INVALID') {
      await db.otpCode.update({ where: { id: record.id }, data: { attempts: { increment: 1 } } });
    }
    log.warn('otp.verify_failed', { phone: maskPhone(phone), outcome });
    switch (outcome) {
      case 'EXPIRED':
        throw new ApiError('OTP_EXPIRED', 'This code has expired. Please request a new one.');
      case 'TOO_MANY_ATTEMPTS':
        throw new ApiError(
          'OTP_TOO_MANY_ATTEMPTS',
          'Too many wrong attempts. Please request a new code.',
          429,
        );
      case 'NO_CODE':
        throw new ApiError('OTP_INVALID', 'Please request a code first.');
      default:
        throw new ApiError('OTP_INVALID', 'That code is not right. Please check and try again.');
    }
  }

  // Consume atomically so the same code cannot be used twice in parallel.
  const consumed = await db.otpCode.updateMany({
    where: { id: record!.id, consumedAt: null },
    data: { consumedAt: new Date(now) },
  });
  if (consumed.count === 0) throw new ApiError('OTP_INVALID', 'Please request a new code.');

  const isOwner = !!env().ADMIN_PHONE && env().ADMIN_PHONE === phone;
  const user = await db.user.upsert({
    where: { phone },
    update: {},
    create: { phone, role: isOwner ? 'ADMIN' : 'CUSTOMER' },
    select: USER_SELECT,
  });
  log.info('auth.login', { userId: user.id, role: user.role });
  return user;
}

export async function findSessionUser(userId: string): Promise<SessionUser | null> {
  return db.user.findUnique({ where: { id: userId }, select: USER_SELECT });
}

export async function updateProfile(userId: string, data: { name?: string; email?: string | null }) {
  return db.user.update({ where: { id: userId }, data, select: USER_SELECT });
}
