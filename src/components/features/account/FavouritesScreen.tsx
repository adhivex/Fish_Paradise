'use client';

import { ProductRow } from '@/components/features/ProductCards';
import { ButtonLink } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageHeader } from '@/components/ui/PageHeader';
import { LoadingRegion, ProductRowSkeleton } from '@/components/ui/Skeleton';
import { products } from '@/lib/mock/catalogue';
import { useAccountStore } from '@/lib/stores/account';
import { useHydrated } from '@/lib/stores/ui';

export function FavouritesScreen() {
  const hydrated = useHydrated();
  const favourites = useAccountStore((s) => s.favourites);
  const list = products.filter((p) => favourites.includes(p.id));

  return (
    <main className="pb-10">
      <PageHeader title="Favourites" backHref="/account" backLabel="Back to account" />
      {!hydrated ? (
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
