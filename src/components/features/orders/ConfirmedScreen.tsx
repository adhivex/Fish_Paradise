'use client';

import { Button, ButtonLink } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Icon } from '@/components/ui/Icon';
import { Skeleton } from '@/components/ui/Skeleton';
import { useOrder } from '@/lib/client/data';
import { formatIstDate, formatIstTime } from '@/lib/ist';
import type { OrderDTO } from '@/lib/types';

/** Confetti dots from the design. */
const CONFETTI = [
  'left-[88px] top-[60px] size-2 rounded-[2px] bg-gold-glyph rotate-[20deg]',
  'left-[60px] top-[108px] size-1.5 rounded-full bg-[#1B5A61]',
  'right-[90px] top-16 size-[7px] rounded-full bg-[#E0A15A]',
  'right-[62px] top-[112px] size-2 rounded-[2px] bg-[#1B5A61] -rotate-[24deg]',
  'left-[120px] top-[34px] size-1.5 rounded-full bg-[#E0A15A]',
];

function awaitingPayment(o: OrderDTO) {
  return o.paymentMethod !== 'COD' && o.status === 'PLACED' && o.paymentStatus === 'PENDING';
}

export function ConfirmedScreen({ orderNumber }: { orderNumber: string }) {
  const { order, loading, error } = useOrder(orderNumber, true);

  if (!loading && !order) {
    return (
      <main className="pb-10">
        <EmptyState
          icon="receipt"
          title="Order not found"
          body={error?.message ?? `We couldn't find order #${orderNumber}.`}
          action={
            <ButtonLink href="/orders" block={false} className="w-[220px]">
              My orders
            </ButtonLink>
          }
        />
      </main>
    );
  }

  const waiting = order ? awaitingPayment(order) : false;
  const failed = order?.paymentStatus === 'FAILED' && order.status === 'PLACED';
  const cancelled = order?.status === 'CANCELLED';

  return (
    <main className="flex min-h-dvh flex-col pb-[env(safe-area-inset-bottom)]">
      <div className="flex-1 pb-2">
        <div className="relative flex flex-col items-center px-4 pt-16">
          {!waiting &&
            !failed &&
            CONFETTI.map((c) => <span key={c} aria-hidden="true" className={`absolute ${c}`} />)}
          <span className="bg-ink text-gold flex size-[92px] items-center justify-center rounded-full shadow-[0_0_0_7px_var(--color-gold-soft)]">
            <Icon name={failed || cancelled ? 'alert' : 'check'} size={48} strokeWidth={2.4} />
          </span>
          <h1
            className="mt-5 mb-1 text-center font-serif text-[32px] font-semibold tracking-[-0.4px]"
            aria-live="polite"
          >
            {!order
              ? 'Placing order…'
              : waiting
                ? 'Confirming payment…'
                : failed
                  ? 'Payment failed'
                  : cancelled
                    ? 'Order cancelled'
                    : 'Order confirmed!'}
          </h1>
          <p className="text-ink-muted m-0 text-center text-[15px]">
            {waiting
              ? 'This usually takes a few seconds.'
              : failed
                ? 'No money was taken. You can try again from your order.'
                : 'Thank you for your order.'}
          </p>
        </div>

        <Card className="mx-4 mt-7 p-4">
          {order ? (
            <>
              <div className="text-[17px] font-bold">Order #{order.orderNumber}</div>
              <div className="text-ink-muted mt-0.5 mb-3.5 text-[13px]">
                Placed on {formatIstDate(order.placedAt)}, {formatIstTime(order.placedAt)}
              </div>
              <div className="bg-ink text-cream flex items-center gap-3.5 rounded-[18px] px-4 py-3.5">
                <Icon name="truck" size={28} className="text-gold" />
                <div>
                  <span className="text-cream/80 block text-[13px]">Estimated delivery</span>
                  <b className="block text-[15px]">{order.slotLabel}</b>
                </div>
              </div>
            </>
          ) : (
            <div role="status" aria-label="Loading order" className="flex flex-col gap-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-3.5 w-48" />
              <Skeleton className="mt-2 h-16 w-full rounded-[18px]" />
            </div>
          )}
        </Card>
      </div>

      <div className="flex flex-none flex-col gap-2.5 px-4 pt-3 pb-5">
        {failed ? (
          <ButtonLink href={`/orders/${orderNumber}`}>Try payment again</ButtonLink>
        ) : (
          <ButtonLink href={`/orders/${orderNumber}`}>Track order</ButtonLink>
        )}
        {waiting ? (
          <Button variant="outline" disabled>
            Waiting for payment confirmation
          </Button>
        ) : (
          <ButtonLink href="/shop" variant="outline">
            Continue shopping
          </ButtonLink>
        )}
      </div>
    </main>
  );
}
