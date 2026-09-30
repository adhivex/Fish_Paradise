import { z } from 'zod';
import { ApiError, handle, ok, parseJson } from '@/lib/api';
import { env } from '@/lib/env';
import { verifyCheckoutSignature } from '@/lib/payments/signature';
import { requireUser } from '@/server/auth';

const bodySchema = z.object({
  razorpay_order_id: z.string().max(64),
  razorpay_payment_id: z.string().max(64),
  razorpay_signature: z.string().max(128),
});

/**
 * POST /api/payments/verify – optional client-side check after Razorpay Checkout so the UI can
 * show "processing" confidently. It does NOT mark the order paid; only the webhook does.
 */
export const POST = handle(async (req: Request) => {
  await requireUser();
  const body = await parseJson(req, bodySchema);
  const secret = env().RAZORPAY_KEY_SECRET;
  if (!secret) throw new ApiError('CONFLICT', 'Online payments are not configured.', 409);
  return ok({
    valid: verifyCheckoutSignature(
      body.razorpay_order_id,
      body.razorpay_payment_id,
      body.razorpay_signature,
      secret,
    ),
  });
});
