import { ApiError, handle, ok } from '@/lib/api';
import { requireUser } from '@/server/auth';
import { db } from '@/server/db';

/** POST /api/favorites/:productId */
export const POST = handle(async (_req: Request, ctx: RouteContext<'/api/favorites/[productId]'>) => {
  const user = await requireUser();
  const { productId } = await ctx.params;
  const product = await db.product.findFirst({
    where: { id: productId, isActive: true },
    select: { id: true },
  });
  if (!product) throw new ApiError('NOT_FOUND', 'Product not found.', 404);
  await db.favorite.upsert({
    where: { userId_productId: { userId: user.id, productId } },
    update: {},
    create: { userId: user.id, productId },
  });
  return ok({ saved: true });
});

/** DELETE /api/favorites/:productId */
export const DELETE = handle(async (_req: Request, ctx: RouteContext<'/api/favorites/[productId]'>) => {
  const user = await requireUser();
  const { productId } = await ctx.params;
  await db.favorite.deleteMany({ where: { userId: user.id, productId } });
  return ok({ saved: false });
});
