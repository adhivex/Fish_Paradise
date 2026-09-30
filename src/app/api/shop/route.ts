import { handle, ok } from '@/lib/api';
import { getCatalogue } from '@/server/services/catalogue';

/** GET /api/shop – public shop settings. */
export const GET = handle(async () => {
  const { shop } = await getCatalogue();
  return ok(shop);
});
