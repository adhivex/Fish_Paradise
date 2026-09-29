'use client';

import { ButtonLink } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Icon } from '@/components/ui/Icon';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatDate, formatTime } from '@/lib/datetime';
import { useOrder } from './useOrder';

/** Confetti dots from the design. */
const CONFETTI = [
  'left-[88px] top-[60px] size-2 rounded-[2px] bg-gold-glyph rotate-[20deg]',
  'left-[60px] top-[108px] size-1.5 rounded-full bg-[#1B5A61]',
  'right-[90px] top-16 size-[7px] rounded-full bg-[#E0A15A]',
  'right-[62px] top-[112px] size-2 rounded-[2px] bg-[#1B5A61] -rotate-[24deg]',
  'left-[120px] top-[34px] size-1.5 rounded-full bg-[#E0A15A]',
];

export function ConfirmedScreen({ orderNumber }: { orderNumber: string }) {
  const { loading, order } = useOrder(orderNumber);

  if (!loading && !order) {
    return (
      <main className="pb-10">
        <EmptyState
          icon="receipt"
          title="Order not found"
          body={`We couldn't find order #${orderNumber}.`}
          action={
            <ButtonLink href="/orders" block={false} className="w-[220px]">
              My orders
            </ButtonLink>
          }
        />
      </main>
    );
  }

  const eta = order?.slotType === 'ASAP' ? order.slotLabel.replace('ASAP · ', 'Today, ') : order?.slotLabel;

  return (
    <main className="flex min-h-dvh flex-col pb-[env(safe-area-inset-bottom)]">
      <div className="flex-1 pb-2">
        <div className="relative flex flex-col items-center px-4 pt-16">
          {CONFETTI.map((c) => (
            <span key={c} aria-hidden="true" className={`absolute ${c}`} />
          ))}
          <span className="bg-ink text-gold flex size-[92px] items-center justify-center rounded-full shadow-[0_0_0_7px_var(--color-gold-soft)]">
            <Icon name="check" size={48} strokeWidth={2.4} />
          </span>
          <h1 className="mt-5 mb-1 font-serif text-[32px] font-semibold tracking-[-0.4px]">
            Order confirmed!
          </h1>
          <p className="text-ink-muted m-0 text-[15px]">Thank you for your order.</p>
        </div>

        <Card className="mx-4 mt-7 p-4">
          {order ? (
            <>
              <div className="text-[17px] font-bold">Order #{order.orderNumber}</div>
              <div className="text-ink-muted mt-0.5 mb-3.5 text-[13px]">
                Placed on {formatDate(order.placedAt)}, {formatTime(order.placedAt)}
              </div>
              <div className="bg-ink text-cream flex items-center gap-3.5 rounded-[18px] px-4 py-3.5">
                <Icon name="truck" size={28} className="text-gold" />
                <div>
                  <span className="text-cream/80 block text-[13px]">Estimated delivery</span>
                  <b className="block text-[15px]">{eta}</b>
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
        <ButtonLink href={`/orders/${orderNumber}`}>Track order</ButtonLink>
        <ButtonLink href="/shop" variant="outline">
          Continue shopping
        </ButtonLink>
      </div>
    </main>
  );
}
