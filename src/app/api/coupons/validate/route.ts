import { z } from 'zod';
import { handle, ok, parseJson } from '@/lib/api';
import { requireUser } from '@/server/auth';
import { rateLimit } from '@/server/guard';
import { readCart } from '@/server/services/cart';
import { priceLines } from '@/server/services/pricing';

const bodySchema = z.object({ code: z.string().trim().min(1).max(24) });

/** POST /api/coupons/validate { code } – discount preview against the user's server cart. */
export const POST = handle(async (req: Request) => {
  const user = await requireUser();
  await rateLimit('couponCheck', user.id);
  const { code } = await parseJson(req, bodySchema);
  const cart = await readCart(user.id);
  const quote = await priceLines({ lines: cart.items, couponCode: code, userId: user.id });
  return ok({
    code: quote.coupon?.code ?? code,
    valid: !!quote.coupon?.applied,
    discountPaise: quote.discountPaise,
    message: quote.coupon?.message ?? null,
  });
});
