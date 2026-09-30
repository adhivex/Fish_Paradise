import { z } from 'zod';
import { ApiError, handle, ok, parseJson } from '@/lib/api';
import { requireUser } from '@/server/auth';
import { readCart, replaceCart } from '@/server/services/cart';

const patchSchema = z.object({
  qtyGrams: z.number().int().min(1).max(100_000).optional(),
  cleaningOptionId: z.string().min(1).max(40).optional(),
  lineNote: z.string().trim().max(200).nullish(),
});

/** PATCH /api/cart/items/:productId – change grams, cleaning option or note. */
export const PATCH = handle(async (req: Request, ctx: RouteContext<'/api/cart/items/[productId]'>) => {
  const user = await requireUser();
  const { productId } = await ctx.params;
  const patch = await parseJson(req, patchSchema);
  const cart = await readCart(user.id);
  if (!cart.items.some((i) => i.productId === productId))
    throw new ApiError('NOT_FOUND', 'Item not in cart.', 404);
  const items = cart.items.map((i) => (i.productId === productId ? { ...i, ...patch } : i));
  return ok(await replaceCart(user.id, { ...cart, items }));
});

/** DELETE /api/cart/items/:productId */
export const DELETE = handle(async (_req: Request, ctx: RouteContext<'/api/cart/items/[productId]'>) => {
  const user = await requireUser();
  const { productId } = await ctx.params;
  const cart = await readCart(user.id);
  return ok(
    await replaceCart(user.id, { ...cart, items: cart.items.filter((i) => i.productId !== productId) }),
  );
});
