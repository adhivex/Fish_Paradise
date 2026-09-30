'use client';

import { SummaryLines } from '@/components/features/checkout/SummaryLines';
import { useCatalogue } from '@/components/features/CatalogueProvider';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Icon } from '@/components/ui/Icon';
import { PageHeader } from '@/components/ui/PageHeader';
import { LineSkeleton, LoadingRegion, Skeleton } from '@/components/ui/Skeleton';
import { Timeline } from '@/components/ui/Timeline';
import { formatMoney } from '@/lib/money';
import { buildTimeline, statusHeadline } from '@/lib/orders';
import { useOrder } from './useOrder';

export function TrackingScreen({ orderNumber }: { orderNumber: string }) {
  const { loading, order } = useOrder(orderNumber);
  const { shop } = useCatalogue();
  const header = (
    <PageHeader title={`Order #${orderNumber}`} backHref="/orders" backLabel="Back to my orders" />
  );

  if (loading) {
    return (
      <main>
        {header}
        <LoadingRegion label="Loading order">
          <Card className="mx-4 mt-2 flex flex-col gap-4 p-5">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="size-7 rounded-full" />
                <Skeleton className="h-4 w-40" />
              </div>
            ))}
          </Card>
          <Card className="mx-4 mt-3.5">
            <LineSkeleton />
          </Card>
        </LoadingRegion>
      </main>
    );
  }

  if (!order) {
    return (
      <main>
        {header}
        <EmptyState
          icon="receipt"
          title="Order not found"
          body="This order doesn't exist or belongs to another account."
          action={
            <ButtonLink href="/orders" block={false} className="w-[220px]">
              My orders
            </ButtonLink>
          }
        />
      </main>
    );
  }

  const { headline, subline } = statusHeadline(order.status);
  const paid = order.paymentStatus === 'PAID' || order.paymentStatus === 'COD_COLLECTED';
  const phone = shop.phone;

  return (
    <main className="flex min-h-dvh flex-col pb-[env(safe-area-inset-bottom)]">
      {header}
      <div className="flex-1 pb-2">
        <Card className="mx-4 mt-2 px-[18px] pt-5 pb-1">
          <h2 className="sr-only">Order progress</h2>
          <Timeline steps={buildTimeline(order)} />
        </Card>

        <div
          className="bg-ink text-cream mx-4 mt-3.5 flex items-start gap-3.5 rounded-[18px] px-4 py-3.5"
          role="status"
        >
          <Icon name="truck" size={28} className="text-gold" />
          <div>
            <b className="block text-[15px]">{headline}</b>
            <span className="text-cream/80 block text-[13px]">{subline}</span>
          </div>
        </div>

        <Card className="mx-4 mt-3.5 py-1">
          <h2 className="sr-only">Items</h2>
          <SummaryLines
            tile="sm"
            divided
            lines={order.items.map((i) => ({
              key: i.productId,
              slug: i.productSlug,
              name: i.nameSnapshot,
              qtyGrams: i.qtyGrams,
              cleaningLabel: i.cleaningLabel,
              lineTotalPaise: i.lineTotalPaise,
            }))}
          />
          <div className="flex items-center justify-between border-t border-[#E8DDCB] px-[18px] pt-3.5 pb-1.5 font-serif text-[22px] font-semibold">
            <span>
              {paid ? 'Total paid' : order.paymentMethod === 'COD' ? 'To pay on delivery' : 'Total'}
            </span>
            <span>{formatMoney(order.totalPaise)}</span>
          </div>
        </Card>
      </div>

      <div className="flex flex-none flex-col gap-2.5 px-4 pt-3 pb-[18px]">
        {phone ? (
          <ButtonLink href={`tel:${phone}`} variant="outline">
            <Icon name="phone" />
            Call shop
          </ButtonLink>
        ) : (
          // PLACEHOLDER: ShopSettings.phone is not set yet (filled in admin).
          <Button variant="outline" disabled title="Shop phone number not set yet">
            <Icon name="phone" />
            Call shop
          </Button>
        )}
      </div>
    </main>
  );
}
