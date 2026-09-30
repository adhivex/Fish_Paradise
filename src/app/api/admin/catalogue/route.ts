import { handle, ok } from '@/lib/api';
import { requireAdmin } from '@/server/auth';
import { listAdminCatalogue } from '@/server/services/admin';

/** GET /api/admin/catalogue – every product (active or not) for the daily editor. */
export const GET = handle(async () => {
  await requireAdmin();
  return ok({ items: await listAdminCatalogue() }, { headers: { 'Cache-Control': 'no-store' } });
});
