import { handle, ok, parseJson } from '@/lib/api';
import { catalogueBulkSchema } from '@/lib/admin-schemas';
import { requireAdmin } from '@/server/auth';
import { bulkUpdateCatalogue } from '@/server/services/admin';

/** PATCH /api/admin/catalogue/bulk { updates: [{ id, pricePerKgPaise?, todayAvailable?, stockGrams? }] } */
export const PATCH = handle(async (req: Request) => {
  const admin = await requireAdmin();
  return ok(await bulkUpdateCatalogue(admin.id, await parseJson(req, catalogueBulkSchema)));
});
