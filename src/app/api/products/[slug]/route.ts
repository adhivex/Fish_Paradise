import { fail, handle, ok } from '@/lib/api';
import { productSlugSchema } from '@/lib/validation';
import { getCatalogue } from '@/server/services/catalogue';

/** GET /api/products/:slug */
export const GET = handle(async (_req: Request, ctx: RouteContext<'/api/products/[slug]'>) => {
  const { slug } = await ctx.params;
  const parsed = productSlugSchema.safeParse(slug);
  if (!parsed.success) return fail('VALIDATION', 'Invalid product', 400);

  const catalogue = await getCatalogue();
  const product = catalogue.products.find((p) => p.slug === parsed.data);
  if (!product) return fail('NOT_FOUND', 'Product not found', 404);
  return ok({ product, cleaningOptions: catalogue.cleaningOptions });
});
