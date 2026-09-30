import { timingSafeEqual } from 'node:crypto';
import { ApiError, handle, ok } from '@/lib/api';
import { env } from '@/lib/env';
import { expireUnpaidOrders } from '@/server/services/orders';

function authorized(req: Request): boolean {
  const secret = env().CRON_SECRET;
  if (!secret) return env().NODE_ENV !== 'production';
  const given = Buffer.from(req.headers.get('authorization') ?? '');
  const expected = Buffer.from(`Bearer ${secret}`);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

/** GET /api/cron/expire-unpaid – scheduled job (Vercel Cron sends `Authorization: Bearer CRON_SECRET`). */
export const GET = handle(async (req: Request) => {
  if (!authorized(req)) throw new ApiError('UNAUTHENTICATED', 'Unauthorized.', 401);
  return ok({ cancelled: await expireUnpaidOrders() });
});
