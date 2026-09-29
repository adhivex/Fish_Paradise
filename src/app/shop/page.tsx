import type { Metadata } from 'next';
import { ShopScreen } from '@/components/features/shop/ShopScreen';
import { categories } from '@/lib/mock/catalogue';

export const metadata: Metadata = { title: 'Shop seafood' };

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const raw = typeof params.category === 'string' ? params.category : 'all';
  const category = categories.some((c) => c.slug === raw) ? raw : 'all';
  const query = typeof params.q === 'string' ? params.q.slice(0, 60) : '';
  return <ShopScreen key={`${category}:${query}`} initialCategory={category} initialQuery={query} />;
}
