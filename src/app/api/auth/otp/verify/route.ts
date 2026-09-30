import { z } from 'zod';
import { ApiError, clientIp, handle, ok, parseJson } from '@/lib/api';
import { isWellFormedOtp } from '@/lib/otp/rules';
import { normalizeIndianMobile } from '@/lib/phone';
import { startSession } from '@/server/auth';
import { rateLimit } from '@/server/guard';
import { verifyOtp } from '@/server/services/auth';

const bodySchema = z.object({ phone: z.string().min(10).max(20), code: z.string().trim() });

/** POST /api/auth/otp/verify { phone, code } – creates the user if new and sets the session. */
export const POST = handle(async (req: Request) => {
  // Per-IP cap on verification attempts across phone numbers (per-code attempts are capped at 5).
  await rateLimit('otpVerify', clientIp(req));
  const body = await parseJson(req, bodySchema);
  const phone = normalizeIndianMobile(body.phone);
  if (!phone) throw new ApiError('VALIDATION', 'Enter a valid 10-digit Indian mobile number.');
  if (!isWellFormedOtp(body.code)) throw new ApiError('OTP_INVALID', 'Enter the 6-digit code.');
  const user = await verifyOtp(phone, body.code);
  await startSession(user);
  return ok({ user });
});
