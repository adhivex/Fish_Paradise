import { handle, ok } from '@/lib/api';
import { requireUser } from '@/server/auth';
import { reorderLines } from '@/server/services/orders';

/** POST /api/orders/:orderNumber/reorder – lines to add to the cart; sold-out items are skipped. */
export const POST = handle(async (_req: Request, ctx: RouteContext<'/api/orders/[orderNumber]/reorder'>) => {
  const user = await requireUser();
  const { orderNumber } = await ctx.params;
  return ok(await reorderLines(user.id, orderNumber));
});
