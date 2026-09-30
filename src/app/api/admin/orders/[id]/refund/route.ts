import { handle, ok } from '@/lib/api';
import { requireAdmin } from '@/server/auth';
import { markRefunded } from '@/server/services/admin';

/** POST /api/admin/orders/:id/refund – mark a manual Razorpay refund as done. */
export const POST = handle(async (_req: Request, ctx: RouteContext<'/api/admin/orders/[id]/refund'>) => {
  const admin = await requireAdmin();
  const { id } = await ctx.params;
  return ok({ order: await markRefunded(admin.id, id) });
});
