import { handle, ok } from '@/lib/api';
import { requireUser } from '@/server/auth';
import { db } from '@/server/db';

/** GET /api/favorites – product ids the user saved. */
export const GET = handle(async () => {
  const user = await requireUser();
  const rows = await db.favorite.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' } });
  return ok({ productIds: rows.map((r) => r.productId) });
});
