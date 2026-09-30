import type { NextRequest } from 'next/server';
import { fail, handle, ok, parseSearchParams, validationMessage } from '@/lib/api';
import { queryCatalogue } from '@/lib/catalogue';
import { catalogueQuerySchema } from '@/lib/validation';
import { getCatalogue } from '@/server/services/catalogue';

/** GET /api/catalogue?category=&q=&sort=&priceBand= */
export const GET = handle(async (req: NextRequest) => {
  const parsed = parseSearchParams(catalogueQuerySchema, req.nextUrl.searchParams);
  if (!parsed.success) return fail('VALIDATION', validationMessage(parsed.error), 400);

  const catalogue = await getCatalogue();
  const result = queryCatalogue(catalogue, parsed.data);
  return ok({
    filter: result.filter,
    priceBands: result.priceBands,
    products: result.products,
    categories: catalogue.categories,
    cleaningOptions: catalogue.cleaningOptions,
  });
});
