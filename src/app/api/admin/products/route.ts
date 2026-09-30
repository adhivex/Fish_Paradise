import { handle, ok, parseJson } from '@/lib/api';
import { productSchema } from '@/lib/admin-schemas';
import { requireAdmin } from '@/server/auth';
import { createProduct, listAdminCatalogue } from '@/server/services/admin';

export const GET = handle(async () => {
  await requireAdmin();
  return ok({ items: await listAdminCatalogue() }, { headers: { 'Cache-Control': 'no-store' } });
});

export const POST = handle(async (req: Request) => {
  const admin = await requireAdmin();
  return ok({ item: await createProduct(admin.id, await parseJson(req, productSchema)) }, { status: 201 });
});
