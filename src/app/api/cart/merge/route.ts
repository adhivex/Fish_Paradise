import { handle, ok, parseJson } from '@/lib/api';
import { cartBodySchema } from '@/lib/validation';
import { requireUser } from '@/server/auth';
import { mergeGuestCart } from '@/server/services/cart';

/** POST /api/cart/merge – merges the guest cart after login. */
export const POST = handle(async (req: Request) => {
  const user = await requireUser();
  const body = await parseJson(req, cartBodySchema);
  return ok(
    await mergeGuestCart(user.id, {
      items: body.items,
      notes: body.notes ?? '',
      couponCode: body.couponCode ?? null,
    }),
  );
});
