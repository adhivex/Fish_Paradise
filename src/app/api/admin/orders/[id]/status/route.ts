import { handle, ok, parseJson } from '@/lib/api';
import { orderStatusChangeSchema } from '@/lib/admin-schemas';
import { requireAdmin } from '@/server/auth';
import { changeOrderStatus } from '@/server/services/admin';

/** POST /api/admin/orders/:id/status { to, note } – goes through transitionOrder. */
export const POST = handle(async (req: Request, ctx: RouteContext<'/api/admin/orders/[id]/status'>) => {
  const admin = await requireAdmin();
  const { id } = await ctx.params;
  const { to, note } = await parseJson(req, orderStatusChangeSchema);
  return ok({ order: await changeOrderStatus(admin.id, id, to, note ?? null) });
});
