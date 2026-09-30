import { handle, ok } from '@/lib/api';
import { requireAdmin } from '@/server/auth';
import { getAdminOrder } from '@/server/services/admin';

export const GET = handle(async (_req: Request, ctx: RouteContext<'/api/admin/orders/[id]'>) => {
  await requireAdmin();
  const { id } = await ctx.params;
  return ok({ order: await getAdminOrder(id) }, { headers: { 'Cache-Control': 'no-store' } });
});
