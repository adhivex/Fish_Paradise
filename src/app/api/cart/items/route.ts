import { addLine } from '@/lib/cart';
import { ApiError, handle, ok, parseJson } from '@/lib/api';
import { cartItemSchema } from '@/lib/validation';
import { requireUser } from '@/server/auth';
import { readCart, replaceCart } from '@/server/services/cart';
import { loadProducts } from '@/server/services/pricing';
import { db } from '@/server/db';

/** POST /api/cart/items { productId, qtyGrams, cleaningOptionId, lineNote? } – adds grams to a line. */
export const POST = handle(async (req: Request) => {
  const user = await requireUser();
  const item = await parseJson(req, cartItemSchema);
  const product = (await loadProducts(db, [item.productId])).get(item.productId);
  if (!product) throw new ApiError('NOT_FOUND', 'Product not found.', 404);
  if (!product.todayAvailable) throw new ApiError('SOLD_OUT', `${product.name} is sold out today.`, 409);
  const cart = await readCart(user.id);
  return ok(await replaceCart(user.id, { ...cart, items: addLine(cart.items, item, product) }));
});
