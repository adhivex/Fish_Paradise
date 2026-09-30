import { z } from 'zod';
import { handle, ok, parseJson } from '@/lib/api';
import { addressInputSchema } from '@/lib/address';
import { requireUser } from '@/server/auth';
import { deleteAddress, updateAddress } from '@/server/services/addresses';

const patchSchema = addressInputSchema.partial().extend({ isDefault: z.boolean().optional() });

/** PATCH /api/addresses/:id */
export const PATCH = handle(async (req: Request, ctx: RouteContext<'/api/addresses/[id]'>) => {
  const user = await requireUser();
  const { id } = await ctx.params;
  const input = await parseJson(req, patchSchema);
  return ok({ address: await updateAddress(user.id, id, input) });
});

/** DELETE /api/addresses/:id */
export const DELETE = handle(async (_req: Request, ctx: RouteContext<'/api/addresses/[id]'>) => {
  const user = await requireUser();
  const { id } = await ctx.params;
  await deleteAddress(user.id, id);
  return ok({ deleted: true });
});
