'use client';

import useSWR from 'swr';
import { useCatalogue } from '@/components/features/CatalogueProvider';
import { ProductRow } from '@/components/features/ProductCards';
import { ButtonLink } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageHeader } from '@/components/ui/PageHeader';
import { LoadingRegion, ProductRowSkeleton } from '@/components/ui/Skeleton';
import { fetcher } from '@/lib/client/api';

export function FavouritesScreen() {
  const { products } = useCatalogue();
  const { data, isLoading } = useSWR<{ productIds: string[] }>('/api/favorites', fetcher);
  const ids = data?.productIds ?? [];
  const list = ids.map((id) => products.find((p) => p.id === id)).filter((p) => p !== undefined);

  return (
    <main className="pb-10">
      <PageHeader title="Favourites" backHref="/account" backLabel="Back to account" />
      {isLoading && !data ? (
        <LoadingRegion label="Loading favourites">
          <ProductRowSkeleton />
          <ProductRowSkeleton />
        </LoadingRegion>
      ) : list.length > 0 ? (
        <ul className="m-0 mt-1 list-none p-0">
          {list.map((p) => (
            <ProductRow key={p.id} product={p} />
          ))}
        </ul>
      ) : (
        <EmptyState
          icon="heart"
          title="No favourites yet"
          body="Tap the heart on any product to keep it here."
          action={
            <ButtonLink href="/shop" block={false} className="w-[220px]">
              Browse the catch
            </ButtonLink>
          }
        />
      )}
    </main>
  );
}
