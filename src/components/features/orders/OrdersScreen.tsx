'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ButtonLink } from '@/components/ui/Button';
import { Pill } from '@/components/ui/Card';
import { Chip, ChipRow } from '@/components/ui/Chip';
import { EmptyState } from '@/components/ui/EmptyState';
import { InlineError } from '@/components/ui/InlineError';
import { PageHeader } from '@/components/ui/PageHeader';
import { ProductImage } from '@/components/ui/ProductImage';
import { LoadingRegion, OrderCardSkeleton } from '@/components/ui/Skeleton';
import { useOrders } from '@/lib/client/data';
import { formatIstDate, formatIstTime } from '@/lib/ist';
import { formatMoney } from '@/lib/money';
import { ORDER_FILTERS, orderGroup, type OrderFilter } from '@/lib/orders';
import { formatQty } from '@/lib/qty';
import type { OrderDTO } from '@/lib/types';

function OrderCard({ order }: { order: OrderDTO }) {
  const group = orderGroup(order.status);
  const awaitingPayment =
    order.status === 'PLACED' && order.paymentMethod !== 'COD' && order.paymentStatus !== 'PAID';
  const tone = group === 'Delivered' ? 'success' : group === 'Cancelled' ? 'danger' : 'gold';
  return (
    <li className="mx-4 mb-3.5">
      <Link
        href={`/orders/${order.orderNumber}`}
        className="border-line bg-card hover:border-rail flex flex-col gap-3 rounded-[22px] border p-4 text-left shadow-[0_14px_30px_-22px_rgba(10,42,47,0.4)]"
      >
        <span className="flex items-center justify-between gap-2">
          <b className="text-base">#{order.orderNumber}</b>
          <Pill tone={awaitingPayment ? 'danger' : tone}>{awaitingPayment ? 'Payment pending' : group}</Pill>
        </span>
        <span className="text-ink-muted text-[13px]">
          {formatIstDate(order.placedAt)} · {formatIstTime(order.placedAt)}
        </span>
        <span className="flex items-center gap-2">
          {order.items.slice(0, 3).map((i) => (
            <ProductImage
              key={i.productId}
              slug={i.productSlug}
              imageUrl={i.productImageUrl}
              sizes="44px"
              className="size-11 rounded-xl"
            />
          ))}
        </span>
        <span className="text-ink-muted flex items-center justify-between gap-2 text-[13px]">
          <span className="min-w-0">
            {order.items.map((i) => `${i.nameSnapshot} (${formatQty(i.qtyGrams)})`).join(', ')}
          </span>
          <b className="text-ink flex-none font-serif text-lg font-semibold">
            {formatMoney(order.totalPaise)}
          </b>
        </span>
      </Link>
    </li>
  );
}

export function OrdersScreen() {
  const [filter, setFilter] = useState<OrderFilter>('All');
  const { orders, loading, error, retry } = useOrders(filter);

  return (
    <main className="pb-[calc(96px+env(safe-area-inset-bottom))]">
      <div className="bg-cream sticky top-0 z-20">
        <PageHeader title="My orders" backHref="/" backLabel="Back to home" sticky={false} />
        <ChipRow label="Filter orders by status">
          {ORDER_FILTERS.map((f) => (
            <Chip key={f} selected={filter === f} onClick={() => setFilter(f)}>
              {f}
            </Chip>
          ))}
        </ChipRow>
      </div>

      {loading ? (
        <LoadingRegion label="Loading orders">
          <OrderCardSkeleton />
          <OrderCardSkeleton />
        </LoadingRegion>
      ) : error ? (
        <InlineError className="mx-4" message={error.message} onRetry={retry} />
      ) : orders.length > 0 ? (
        <ul className="m-0 list-none p-0">
          {orders.map((o) => (
            <OrderCard key={o.orderNumber} order={o} />
          ))}
        </ul>
      ) : filter === 'All' ? (
        <EmptyState
          icon="receipt"
          title="No orders yet"
          body="Your orders will show up here once you place one."
          action={
            <ButtonLink href="/shop" block={false} className="w-[220px]">
              Start shopping
            </ButtonLink>
          }
        />
      ) : (
        <EmptyState title="No orders here" body="Orders with this status will show up here." />
      )}
    </main>
  );
}
