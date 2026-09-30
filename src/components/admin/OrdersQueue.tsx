'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import useSWR from 'swr';
import { Button } from '@/components/ui/Button';
import { Card, Pill } from '@/components/ui/Card';
import { InlineError } from '@/components/ui/InlineError';
import { Skeleton } from '@/components/ui/Skeleton';
import { api, ClientApiError, fetcher } from '@/lib/client/api';
import { cn } from '@/lib/cn';
import { formatIstTime } from '@/lib/ist';
import { formatMoney } from '@/lib/money';
import { nextStatus, STATUS_LABEL } from '@/lib/orders';
import { formatPhone } from '@/lib/phone';
import { formatQty } from '@/lib/qty';
import type { OrderStatus, PaymentMethod, PaymentStatus } from '@/lib/types';

type Queue = 'new' | 'preparing' | 'out' | 'done';

interface QueueOrder {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  placedAt: number;
  slotLabel: string | null;
  totalPaise: number;
  customerName: string | null;
  customerPhone: string;
  area: string;
  items: Array<{ name: string; qtyGrams: number; cleaningLabel: string }>;
}

interface QueueResponse {
  orders: QueueOrder[];
  counts: { new: number; preparing: number; out: number };
  refundsPending: number;
}

const TABS: Array<{ id: Queue; label: string }> = [
  { id: 'new', label: 'New' },
  { id: 'preparing', label: 'Preparing' },
  { id: 'out', label: 'Out for delivery' },
  { id: 'done', label: 'Done today' },
];

const ADVANCE_LABEL: Partial<Record<OrderStatus, string>> = {
  PLACED: 'Confirm order',
  CONFIRMED: 'Start cleaning',
  CLEANING_PACKING: 'Send out for delivery',
  OUT_FOR_DELIVERY: 'Mark delivered',
};

/** Short chime with Web Audio (no asset needed). Browsers require a click before sound is allowed. */
function chime() {
  try {
    const ctx = new AudioContext();
    [880, 1320].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, ctx.currentTime + i * 0.18);
      gain.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + i * 0.18 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + i * 0.18 + 0.3);
      osc.connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.18);
      osc.stop(ctx.currentTime + i * 0.18 + 0.32);
    });
  } catch {
    // Audio unavailable – the visual alert still shows.
  }
}

function paymentPill(o: QueueOrder) {
  if (o.paymentMethod === 'COD') return <Pill tone="gold">COD</Pill>;
  if (o.paymentStatus === 'PAID') return <Pill tone="success">Paid</Pill>;
  if (o.paymentStatus === 'REFUND_PENDING') return <Pill tone="danger">Refund due</Pill>;
  return <Pill tone="danger">Awaiting payment</Pill>;
}

export function OrdersQueue() {
  const [queue, setQueue] = useState<Queue>('new');
  const [sound, setSound] = useState(false);
  const [fresh, setFresh] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const known = useRef<Set<string> | null>(null);

  const { data, error, isLoading, mutate } = useSWR<QueueResponse>(
    `/api/admin/orders?queue=${queue}`,
    fetcher,
    {
      refreshInterval: 15_000,
      refreshWhenHidden: true,
    },
  );
  // Separate poll of the "new" queue so alerts fire whichever tab is open.
  const { data: newQueue } = useSWR<QueueResponse>('/api/admin/orders?queue=new', fetcher, {
    refreshInterval: 15_000,
    refreshWhenHidden: true,
  });

  useEffect(() => {
    if (!newQueue) return;
    const ids = new Set(newQueue.orders.map((o) => o.id));
    if (known.current) {
      const added = [...ids].filter((id) => !known.current!.has(id));
      if (added.length) {
        setFresh((s) => new Set([...s, ...added]));
        if (sound) chime();
      }
    }
    known.current = ids;
  }, [newQueue, sound]);

  useEffect(() => {
    const n = newQueue?.counts.new ?? 0;
    document.title = n ? `(${n}) New orders · Admin` : 'Orders · Admin';
  }, [newQueue]);

  async function advance(o: QueueOrder) {
    const to = nextStatus(o.status);
    if (!to) return;
    setBusy(o.id);
    setActionError(null);
    try {
      await api(`/api/admin/orders/${o.id}/status`, { body: { to } });
      setFresh((s) => {
        const next = new Set(s);
        next.delete(o.id);
        return next;
      });
      await mutate();
    } catch (e) {
      setActionError(e instanceof ClientApiError ? e.message : 'Could not update the order.');
    } finally {
      setBusy(null);
    }
  }

  const counts = newQueue?.counts ?? data?.counts;

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <h1 className="m-0 mr-auto font-serif text-2xl font-semibold">Orders</h1>
        <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm font-semibold">
          <input
            type="checkbox"
            className="accent-ink size-5"
            checked={sound}
            onChange={(e) => {
              setSound(e.target.checked);
              if (e.target.checked) chime();
            }}
          />
          Sound alert for new orders
        </label>
      </div>

      {!!data?.refundsPending && (
        <p
          className="text-danger mt-0 mb-3 rounded-xl bg-[#FBEDE8] px-3 py-2 text-sm font-semibold"
          role="status"
        >
          {data.refundsPending} paid order{data.refundsPending > 1 ? 's' : ''} waiting for a refund.
        </p>
      )}

      <div
        role="tablist"
        aria-label="Order queues"
        className="mb-4 flex scrollbar-none gap-2 overflow-x-auto"
      >
        {TABS.map((t) => {
          const count = t.id === 'done' ? null : counts?.[t.id];
          return (
            <button
              key={t.id}
              role="tab"
              aria-selected={queue === t.id}
              onClick={() => setQueue(t.id)}
              className={cn(
                'flex h-11 flex-none items-center gap-2 rounded-full border px-4 text-sm font-semibold',
                queue === t.id ? 'border-ink bg-ink text-cream' : 'border-line-strong',
              )}
            >
              {t.label}
              {!!count && (
                <span className="bg-gold text-ink rounded-full px-2 py-0.5 text-xs font-bold">{count}</span>
              )}
            </button>
          );
        })}
      </div>

      {actionError && <InlineError className="mb-3" message={actionError} />}

      {isLoading && !data ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
        </div>
      ) : error ? (
        <InlineError message={(error as Error).message} onRetry={() => void mutate()} />
      ) : data?.orders.length === 0 ? (
        <Card className="text-ink-muted p-6 text-center text-sm">No orders in this queue.</Card>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-3 p-0" aria-live="polite">
          {data?.orders.map((o) => {
            const to = nextStatus(o.status);
            const unpaid = o.paymentMethod !== 'COD' && o.status === 'PLACED';
            return (
              <li key={o.id}>
                <Card className={cn('p-4', fresh.has(o.id) && 'ring-gold ring-2')}>
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/admin/orders/${o.id}`}
                      className="text-base font-bold underline-offset-4 hover:underline"
                    >
                      #{o.orderNumber}
                    </Link>
                    {fresh.has(o.id) && <Pill tone="gold">New</Pill>}
                    <span className="text-ink-muted text-[13px]">{formatIstTime(o.placedAt)}</span>
                    <span className="ml-auto">{paymentPill(o)}</span>
                  </div>
                  <p className="mt-2 mb-1 text-sm">
                    <b>{o.customerName ?? 'Customer'}</b> · {formatPhone(o.customerPhone)} · {o.area}
                  </p>
                  <p className="text-ink-muted m-0 text-sm">
                    {o.items.map((i) => `${i.name} ${formatQty(i.qtyGrams)} (${i.cleaningLabel})`).join(', ')}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="text-sm">
                      <b>{formatMoney(o.totalPaise)}</b> · {o.slotLabel ?? 'ASAP'}
                    </span>
                    <span className="text-ink-muted text-xs">{STATUS_LABEL[o.status]}</span>
                    <div className="ml-auto flex gap-2">
                      <Link
                        href={`/admin/orders/${o.id}`}
                        className="border-line-strong flex h-11 items-center rounded-xl border px-3 text-sm font-semibold"
                      >
                        Details
                      </Link>
                      {to && !unpaid && (
                        <Button
                          size="md"
                          block={false}
                          disabled={busy === o.id}
                          onClick={() => void advance(o)}
                        >
                          {busy === o.id ? 'Updating…' : ADVANCE_LABEL[o.status]}
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
