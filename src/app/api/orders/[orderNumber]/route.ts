import { handle, ok } from '@/lib/api';
import { requireUser } from '@/server/auth';
import { getOrderForUser } from '@/server/services/orders';

/** GET /api/orders/:orderNumber – order detail with its event timeline. */
export const GET = handle(async (_req: Request, ctx: RouteContext<'/api/orders/[orderNumber]'>) => {
  const user = await requireUser();
  const { orderNumber } = await ctx.params;
  return ok(
    { order: await getOrderForUser(user.id, orderNumber) },
    { headers: { 'Cache-Control': 'no-store' } },
  );
});
