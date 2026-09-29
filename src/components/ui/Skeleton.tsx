import { cn } from '@/lib/cn';

export function Skeleton({ className }: { className?: string }) {
  return <span aria-hidden="true" className={cn('skeleton block rounded-lg', className)} />;
}

/** Placeholder matching a Shop list row. */
export function ProductRowSkeleton() {
  return (
    <div className="border-line bg-card mx-4 mb-3 flex items-center gap-3.5 rounded-[22px] border p-2.5 pr-3.5">
      <Skeleton className="size-[76px] rounded-[18px]" />
      <div className="flex flex-1 flex-col gap-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-3.5 w-16" />
        <Skeleton className="h-3 w-32" />
      </div>
      <Skeleton className="size-11 rounded-full" />
    </div>
  );
}

/** Placeholder matching a cart / summary line. */
export function LineSkeleton() {
  return (
    <div className="flex items-center gap-3.5 px-4 py-3.5">
      <Skeleton className="size-[56px] rounded-[14px]" />
      <div className="flex flex-1 flex-col gap-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-3 w-36" />
      </div>
      <Skeleton className="h-4 w-12" />
    </div>
  );
}

/** Placeholder matching an order card. */
export function OrderCardSkeleton() {
  return (
    <div className="border-line bg-card mx-4 mb-3.5 flex flex-col gap-3 rounded-[22px] border p-4">
      <div className="flex justify-between">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-[26px] w-20 rounded-full" />
      </div>
      <Skeleton className="h-3 w-36" />
      <div className="flex gap-2">
        <Skeleton className="size-11 rounded-xl" />
        <Skeleton className="size-11 rounded-xl" />
      </div>
      <Skeleton className="h-4 w-full" />
    </div>
  );
}

/** Screen-reader announcement for a loading region. */
export function LoadingRegion({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div role="status" aria-busy="true" aria-label={label}>
      {children}
    </div>
  );
}
