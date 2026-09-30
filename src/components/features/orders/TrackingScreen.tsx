'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useCatalogue } from '@/components/features/CatalogueProvider';
import { SummaryLines } from '@/components/features/checkout/SummaryLines';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Icon } from '@/components/ui/Icon';
import { InlineError } from '@/components/ui/InlineError';
import { PageHeader } from '@/components/ui/PageHeader';
import { LineSkeleton, LoadingRegion, Skeleton } from '@/components/ui/Skeleton';
import { Timeline } from '@/components/ui/Timeline';
import type { CartLine } from '@/lib/cart';
import { api, ClientApiError } from '@/lib/client/api';
import { startCheckout, type CheckoutParams } from '@/lib/client/checkout';
import { useOrder } from '@/lib/client/data';
import { formatMoney } from '@/lib/money';
import { buildTimeline, statusHeadline } from '@/lib/orders';
import { useCartStore } from '@/lib/stores/cart';
import { useUiStore } from '@/lib/stores/ui';
import type { OrderDTO } from '@/lib/types';

function paymentLine(o: OrderDTO): string {
  switch (o.paymentStatus) {
    case 'PAID':
      return 'Total paid';
    case 'COD_PENDING':
      return 'To pay on delivery';
    case 'COD_COLLECTED':
      return 'Paid on delivery';
    case 'REFUND_PENDING':
      return 'Refund in progress';
    case 'REFUNDED':
      return 'Refunded';
    default:
      return 'Total';
  }
}

export function TrackingScreen({ orderNumber }: { orderNumber: string }) {
  const router = useRouter();
  const { shop, productById } = useCatalogue();
  const { order, loading, error, mutate } = useOrder(orderNumber);
  const showToast = useUiStore((s) => s.showToast);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState<'cancel' | 'pay' | 'reorder' | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
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
          body={error?.message ?? "This order doesn't exist or belongs to another account."}
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
  const needsPayment =
    order.status === 'PLACED' &&
    order.paymentMethod !== 'COD' &&
    ['PENDING', 'FAILED'].includes(order.paymentStatus);

  async function cancel() {
    setBusy('cancel');
    setActionError(null);
    try {
      const res = await api<{ order: OrderDTO }>(`/api/orders/${orderNumber}/cancel`, {
        body: { reason: reason.trim() || null },
      });
      await mutate({ order: res.order }, { revalidate: false });
      setCancelOpen(false);
      showToast('Order cancelled');
    } catch (e) {
      setActionError(e instanceof ClientApiError ? e.message : 'Could not cancel the order.');
    } finally {
      setBusy(null);
    }
  }

  async function payAgain() {
    setBusy('pay');
    setActionError(null);
    try {
      const { checkout } = await api<{ checkout: CheckoutParams }>(`/api/orders/${orderNumber}/pay`, {
        body: {},
      });
      router.push(await startCheckout(orderNumber, checkout, shop.shopName));
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Could not start the payment.');
    } finally {
      setBusy(null);
    }
  }

  async function orderAgain() {
    setBusy('reorder');
    setActionError(null);
    try {
      const { lines, skipped } = await api<{ lines: CartLine[]; skipped: string[] }>(
        `/api/orders/${orderNumber}/reorder`,
        { body: {} },
      );
      const add = useCartStore.getState().add;
      for (const line of lines) {
        const product = productById(line.productId);
        if (product) add(line, product);
      }
      showToast(
        skipped.length
          ? `Added to cart. Not available today: ${skipped.join(', ')}`
          : 'Items added to your cart',
        'cart',
      );
    } catch (e) {
      setActionError(e instanceof ClientApiError ? e.message : 'Could not add the items.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <main className="flex min-h-dvh flex-col pb-[env(safe-area-inset-bottom)]">
      {header}
      <div className="flex-1 pb-2">
        {order.status !== 'CANCELLED' && (
          <Card className="mx-4 mt-2 px-[18px] pt-5 pb-1">
            <h2 className="sr-only">Order progress</h2>
            <Timeline steps={buildTimeline(order)} />
          </Card>
        )}

        <div
          className="bg-ink text-cream mx-4 mt-3.5 flex items-start gap-3.5 rounded-[18px] px-4 py-3.5"
          role="status"
        >
          <Icon name={order.status === 'CANCELLED' ? 'alert' : 'truck'} size={28} className="text-gold" />
          <div>
            <b className="block text-[15px]">
              {needsPayment
                ? order.paymentStatus === 'FAILED'
                  ? 'Payment failed'
                  : 'Waiting for payment'
                : headline}
            </b>
            <span className="text-cream/80 block text-[13px]">
              {needsPayment
                ? 'Complete the payment to confirm your order. Unpaid orders are cancelled after 30 minutes.'
                : order.status === 'CANCELLED' && order.cancelReason
                  ? `Reason: ${order.cancelReason}`
                  : subline}
            </span>
            {order.status !== 'CANCELLED' && !needsPayment && (
              <span className="text-gold mt-1 block text-[13px] font-semibold">
                Delivery: {order.slotLabel}
              </span>
            )}
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
              imageUrl: i.productImageUrl,
              name: i.nameSnapshot,
              qtyGrams: i.qtyGrams,
              cleaningLabel: i.cleaningLabel,
              lineTotalPaise: i.lineTotalPaise,
            }))}
          />
          {(order.discountPaise > 0 || order.deliveryFeePaise > 0) && (
            <dl className="text-ink-muted m-0 border-t border-[#E8DDCB] px-[18px] pt-2.5 text-sm">
              {order.discountPaise > 0 && (
                <div className="flex justify-between py-0.5">
                  <dt>Discount</dt>
                  <dd className="text-success m-0">−{formatMoney(order.discountPaise)}</dd>
                </div>
              )}
              <div className="flex justify-between py-0.5">
                <dt>Delivery</dt>
                <dd className="m-0">
                  {order.deliveryFeePaise === 0 ? 'Free' : formatMoney(order.deliveryFeePaise)}
                </dd>
              </div>
            </dl>
          )}
          <div className="flex items-center justify-between border-t border-[#E8DDCB] px-[18px] pt-3.5 pb-1.5 font-serif text-[22px] font-semibold">
            <span>{paymentLine(order)}</span>
            <span>{formatMoney(order.totalPaise)}</span>
          </div>
        </Card>

        {actionError && <InlineError className="mx-4 mt-3" message={actionError} />}
      </div>

      <div className="flex flex-none flex-col gap-2.5 px-4 pt-3 pb-[18px]">
        {needsPayment && (
          <Button onClick={() => void payAgain()} disabled={!!busy}>
            {busy === 'pay' ? 'Opening payment…' : `Pay ${formatMoney(order.totalPaise)}`}
          </Button>
        )}
        {(order.status === 'DELIVERED' || order.status === 'CANCELLED') && (
          <Button onClick={() => void orderAgain()} disabled={!!busy}>
            {busy === 'reorder' ? 'Adding…' : 'Order again'}
          </Button>
        )}
        {shop.phone ? (
          <ButtonLink href={`tel:${shop.phone}`} variant="outline">
            <Icon name="phone" />
            Call shop
          </ButtonLink>
        ) : (
          // PLACEHOLDER: ShopSettings.phone is not set yet (set it in Admin → Settings).
          <Button variant="outline" disabled title="Shop phone number not set yet">
            <Icon name="phone" />
            Call shop
          </Button>
        )}
        {order.canCancel && (
          <Button variant="dangerOutline" onClick={() => setCancelOpen(true)}>
            Cancel order
          </Button>
        )}
      </div>

      <BottomSheet
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        title="Cancel order?"
        footer={
          <div className="flex gap-2.5">
            <Button variant="outline" className="flex-1" onClick={() => setCancelOpen(false)}>
              Keep order
            </Button>
            <Button variant="danger" className="flex-1" onClick={() => void cancel()} disabled={!!busy}>
              {busy === 'cancel' ? 'Cancelling…' : 'Cancel order'}
            </Button>
          </div>
        }
      >
        <p className="text-ink-muted mt-1 text-sm">
          {order.paymentStatus === 'PAID'
            ? 'Your payment will be refunded to the original method.'
            : 'You can cancel until we start cleaning your order.'}
        </p>
        <label className="mb-2 block">
          <span className="mb-1.5 block text-[13px] font-semibold">Reason (optional)</span>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value.slice(0, 200))}
            className="border-line-strong bg-card min-h-20 w-full resize-none rounded-2xl border px-4 py-3 text-sm"
            placeholder="e.g. Ordered by mistake"
          />
        </label>
      </BottomSheet>
    </main>
  );
}
