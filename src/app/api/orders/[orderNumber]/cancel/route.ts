import { z } from 'zod';
import { handle, ok, parseJson } from '@/lib/api';
import { requireUser } from '@/server/auth';
import { cancelByCustomer } from '@/server/services/orders';

const bodySchema = z.object({ reason: z.string().trim().max(200).nullish() });

/** POST /api/orders/:orderNumber/cancel { reason } – allowed before cleaning starts. */
export const POST = handle(async (req: Request, ctx: RouteContext<'/api/orders/[orderNumber]/cancel'>) => {
  const user = await requireUser();
  const { orderNumber } = await ctx.params;
  const { reason } = await parseJson(req, bodySchema);
  return ok({ order: await cancelByCustomer(user.id, orderNumber, reason ?? null) });
});
