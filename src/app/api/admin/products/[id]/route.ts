import { handle, ok, parseJson } from '@/lib/api';
import { productSchema } from '@/lib/admin-schemas';
import { requireAdmin } from '@/server/auth';
import { deleteProduct, updateProduct } from '@/server/services/admin';

export const PATCH = handle(async (req: Request, ctx: RouteContext<'/api/admin/products/[id]'>) => {
  const admin = await requireAdmin();
  const { id } = await ctx.params;
  return ok({ item: await updateProduct(admin.id, id, await parseJson(req, productSchema)) });
});

/** Deletes a never-ordered product; ordered products are hidden instead. */
export const DELETE = handle(async (_req: Request, ctx: RouteContext<'/api/admin/products/[id]'>) => {
  await requireAdmin();
  const { id } = await ctx.params;
  return ok(await deleteProduct(id));
});
