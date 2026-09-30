import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/server/db';
import { requestOtp, verifyOtp } from './auth';

/** OTP service against the database (console provider exposes the code in dev/test). */
const PHONE = '+916000000077';
const IP = '203.0.113.9';

async function reset() {
  await db.otpCode.deleteMany({ where: { phone: PHONE } });
  await db.rateLimitHit.deleteMany({ where: { key: { in: [`otp:phone:${PHONE}`, `otp:ip:${IP}`] } } });
  await db.user.deleteMany({ where: { phone: PHONE } });
}

beforeEach(reset);
afterAll(async () => {
  await reset();
  await db.$disconnect();
});

describe('OTP login', () => {
  it('creates the user on first successful login and never reuses a code', async () => {
    const { devCode } = await requestOtp(PHONE, IP);
    const user = await verifyOtp(PHONE, devCode!);
    expect(user).toMatchObject({ phone: PHONE, role: 'CUSTOMER' });
    await expect(verifyOtp(PHONE, devCode!)).rejects.toMatchObject({ code: 'OTP_INVALID' });
  });

  it('stores only a hash of the code', async () => {
    const { devCode } = await requestOtp(PHONE, IP);
    const row = await db.otpCode.findFirstOrThrow({ where: { phone: PHONE } });
    expect(row.codeHash).not.toContain(devCode!);
    expect(row.codeHash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('locks the code after five wrong attempts', async () => {
    const { devCode } = await requestOtp(PHONE, IP);
    const wrong = devCode === '000000' ? '111111' : '000000';
    for (let i = 0; i < 5; i++)
      await expect(verifyOtp(PHONE, wrong)).rejects.toMatchObject({ code: 'OTP_INVALID' });
    await expect(verifyOtp(PHONE, devCode!)).rejects.toMatchObject({ code: 'OTP_TOO_MANY_ATTEMPTS' });
  });

  it('rejects expired codes', async () => {
    const { devCode } = await requestOtp(PHONE, IP);
    await db.otpCode.updateMany({
      where: { phone: PHONE },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });
    await expect(verifyOtp(PHONE, devCode!)).rejects.toMatchObject({ code: 'OTP_EXPIRED' });
  });

  it('rate limits repeated requests', async () => {
    await requestOtp(PHONE, IP);
    await expect(requestOtp(PHONE, IP)).rejects.toMatchObject({ code: 'OTP_RATE_LIMITED', status: 429 });
  });
});
