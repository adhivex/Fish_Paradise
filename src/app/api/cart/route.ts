import { handle, ok, parseJson } from '@/lib/api';
import { cartBodySchema } from '@/lib/validation';
import { requireUser } from '@/server/auth';
import { getCart, replaceCart } from '@/server/services/cart';

/** GET /api/cart – the user's server cart with server-priced totals. */
export const GET = handle(async () => {
  const user = await requireUser();
  return ok(await getCart(user.id));
});

/** PUT /api/cart { items, notes, couponCode } – replaces the cart and returns the new quote. */
export const PUT = handle(async (req: Request) => {
  const user = await requireUser();
  const body = await parseJson(req, cartBodySchema);
  return ok(await replaceCart(user.id, body));
});
