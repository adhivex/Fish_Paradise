import { PageHeader } from '@/components/ui/PageHeader';
import { LoadingRegion, ProductRowSkeleton, Skeleton } from '@/components/ui/Skeleton';

export default function ShopLoading() {
  return (
    <main>
      <PageHeader title="Shop seafood" backHref="/" backLabel="Back to home" />
      <LoadingRegion label="Loading products">
        <Skeleton className="mx-4 mt-0.5 mb-3 h-[50px] rounded-full" />
        <div className="flex gap-2 px-4 pt-1 pb-3.5">
          {['w-12', 'w-16', 'w-20', 'w-14'].map((w) => (
            <Skeleton key={w} className={`h-11 rounded-full ${w}`} />
          ))}
        </div>
        {[0, 1, 2, 3].map((i) => (
          <ProductRowSkeleton key={i} />
        ))}
      </LoadingRegion>
    </main>
  );
}
