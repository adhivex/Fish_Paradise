import { handle, ok } from '@/lib/api';
import { requireUser } from '@/server/auth';
import { retryPayment } from '@/server/services/orders';

/** POST /api/orders/:orderNumber/pay – new payment attempt for an unpaid online order. */
export const POST = handle(async (_req: Request, ctx: RouteContext<'/api/orders/[orderNumber]/pay'>) => {
  const user = await requireUser();
  const { orderNumber } = await ctx.params;
  return ok({ checkout: await retryPayment(user, orderNumber) });
});
