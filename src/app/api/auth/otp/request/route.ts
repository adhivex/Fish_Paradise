import { z } from 'zod';
import { ApiError, clientIp, handle, ok, parseJson } from '@/lib/api';
import { normalizeIndianMobile } from '@/lib/phone';
import { requestOtp } from '@/server/services/auth';

const bodySchema = z.object({ phone: z.string().min(10).max(20) });

/** POST /api/auth/otp/request { phone } */
export const POST = handle(async (req: Request) => {
  const { phone: raw } = await parseJson(req, bodySchema);
  const phone = normalizeIndianMobile(raw);
  if (!phone) throw new ApiError('VALIDATION', 'Enter a valid 10-digit Indian mobile number.');
  return ok({ phone, ...(await requestOtp(phone, clientIp(req))) });
});
