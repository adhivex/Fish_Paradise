import type { Metadata } from 'next';
import { ShopScreen } from '@/components/features/shop/ShopScreen';
import { parseSearchParams } from '@/lib/api';
import { queryCatalogue } from '@/lib/catalogue';
import { catalogueQuerySchema } from '@/lib/validation';
import { getCatalogue } from '@/server/services/catalogue';

export const metadata: Metadata = { title: 'Shop seafood' };

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const parsed = parseSearchParams(catalogueQuerySchema, await searchParams);
  const catalogue = await getCatalogue();
  // Invalid params fall back to the unfiltered list instead of an error page.
  const result = queryCatalogue(catalogue, parsed.success ? parsed.data : {});
  return (
    <ShopScreen
      filter={result.filter}
      products={result.products}
      priceBands={result.priceBands}
      categories={catalogue.categories}
    />
  );
}
