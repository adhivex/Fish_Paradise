import { handle, ok, parseJson } from '@/lib/api';
import { quoteBodySchema } from '@/lib/validation';
import { currentUser } from '@/server/auth';
import { getOwnAddress } from '@/server/services/addresses';
import { priceLines } from '@/server/services/pricing';

/**
 * POST /api/cart/quote { items, couponCode?, addressId? } – server prices for any cart (guest or
 * user), so every total the customer sees is computed by the server.
 */
export const POST = handle(async (req: Request) => {
  const body = await parseJson(req, quoteBodySchema);
  const user = await currentUser();
  const pincode = user && body.addressId ? (await getOwnAddress(user.id, body.addressId)).pincode : null;
  const { couponId, ...quote } = await priceLines({
    lines: body.items,
    couponCode: body.couponCode,
    pincode,
    userId: user?.id ?? null,
  });
  return ok(quote);
});
