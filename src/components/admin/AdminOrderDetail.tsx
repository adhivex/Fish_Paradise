'use client';

import Link from 'next/link';
import { useState } from 'react';
import useSWR from 'swr';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { Card, Pill } from '@/components/ui/Card';
import { InlineError } from '@/components/ui/InlineError';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatAddress } from '@/lib/address';
import { api, ClientApiError, fetcher } from '@/lib/client/api';
import { formatIstDate, formatIstTime } from '@/lib/ist';
import { formatMoney, formatPricePerKg } from '@/lib/money';
import { canTransition, nextStatus, STATUS_LABEL } from '@/lib/orders';
import { formatPhone } from '@/lib/phone';
import { formatQty } from '@/lib/qty';
import { useUiStore } from '@/lib/stores/ui';
import type { AddressDTO, OrderStatus, PaymentMethod, PaymentStatus } from '@/lib/types';

interface AdminOrder {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  placedAt: number;
  slotLabel: string | null;
  notes: string | null;
  cancelReason: string | null;
  subtotalPaise: number;
  deliveryFeePaise: number;
  discountPaise: number;
  totalPaise: number;
  couponCode: string | null;
  customer: { name: string | null; phone: string; email: string | null };
  address: AddressDTO;
  items: Array<{
    id: string;
    name: string;
    pricePerKgPaise: number;
    qtyGrams: number;
    cleaningLabel: string;
    lineNote: string | null;
    lineTotalPaise: number;
  }>;
  events: Array<{ status: OrderStatus; at: number; note: string | null }>;
  payments: Array<{
    id: string;
    status: string;
    amountPaise: number;
    razorpayOrderId: string | null;
    razorpayPaymentId: string | null;
    failureReason: string | null;
    at: number;
  }>;
  notifications: Array<{
    template: string;
    channel: string;
    status: string;
    error: string | null;
    at: number;
  }>;
}

const PAYMENT_TEXT: Record<PaymentStatus, string> = {
  PENDING: 'Awaiting payment',
  PAID: 'Paid online',
  FAILED: 'Payment failed',
  REFUND_PENDING: 'Refund due',
  REFUNDED: 'Refunded',
  COD_PENDING: 'Cash on delivery (to collect)',
  COD_COLLECTED: 'Cash collected',
};

export function AdminOrderDetail({ id }: { id: string }) {
  const { data, error, isLoading, mutate } = useSWR<{ order: AdminOrder }>(
    `/api/admin/orders/${id}`,
    fetcher,
    {
      refreshInterval: 15_000,
    },
  );
  const showToast = useUiStore((s) => s.showToast);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [reason, setReason] = useState('');

  if (isLoading && !data) return <Skeleton className="h-64 w-full rounded-2xl" />;
  if (error || !data) {
    return (
      <InlineError
        message={(error as Error | undefined)?.message ?? 'Order not found.'}
        onRetry={() => void mutate()}
      />
    );
  }
  const o = data.order;
  const next = nextStatus(o.status);
  const awaitingOnline = o.paymentMethod !== 'COD' && o.status === 'PLACED';
  const wa = o.customer.phone.replace('+', '');

  async function run(path: string, body: unknown, done: string) {
    setBusy(true);
    setActionError(null);
    try {
      const res = await api<{ order: AdminOrder }>(`/api/admin/orders/${id}/${path}`, { body });
      await mutate({ order: res.order }, { revalidate: false });
      showToast(done);
      return true;
    } catch (e) {
      setActionError(e instanceof ClientApiError ? e.message : 'Could not update the order.');
      return false;
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <Link href="/admin" className="text-gold-dark text-sm font-semibold">
        ← All orders
      </Link>
      <div className="mt-2 mb-4 flex flex-wrap items-center gap-2">
        <h1 className="m-0 mr-auto font-serif text-2xl font-semibold">Order #{o.orderNumber}</h1>
        <Pill tone={o.status === 'CANCELLED' ? 'danger' : o.status === 'DELIVERED' ? 'success' : 'gold'}>
          {STATUS_LABEL[o.status]}
        </Pill>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <Card className="p-4">
          <h2 className="text-ink-muted mt-0 mb-2 text-sm font-bold tracking-[0.1em] uppercase">Customer</h2>
          <p className="mt-0 mb-1 font-semibold">{o.customer.name ?? 'No name given'}</p>
          <p className="mt-0 mb-3 text-sm">{formatPhone(o.customer.phone)}</p>
          <div className="flex gap-2">
            <a
              href={`tel:${o.customer.phone}`}
              className="bg-ink text-cream flex h-11 flex-1 items-center justify-center rounded-xl text-sm font-semibold"
            >
              Call
            </a>
            <a
              href={`https://wa.me/${wa}?text=${encodeURIComponent(`Hi, this is Fish Paradise about your order ${o.orderNumber}.`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="border-ink flex h-11 flex-1 items-center justify-center rounded-xl border text-sm font-semibold"
            >
              WhatsApp
            </a>
          </div>
        </Card>
        <Card className="p-4">
          <h2 className="text-ink-muted mt-0 mb-2 text-sm font-bold tracking-[0.1em] uppercase">Delivery</h2>
          <p className="mt-0 mb-1 text-sm font-semibold">{o.slotLabel ?? 'ASAP'}</p>
          <p className="mt-0 mb-2 text-sm">
            {o.address.label}: {formatAddress(o.address)}
            {o.address.landmark ? ` (near ${o.address.landmark})` : ''}
          </p>
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(formatAddress(o.address))}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gold-dark text-sm font-semibold underline"
          >
            Open in Maps
          </a>
        </Card>
      </div>

      <Card className="mt-3 p-4">
        <h2 className="text-ink-muted mt-0 mb-2 text-sm font-bold tracking-[0.1em] uppercase">Items</h2>
        <ul className="m-0 list-none p-0">
          {o.items.map((i) => (
            <li key={i.id} className="border-line-soft flex items-start gap-3 border-t py-2 first:border-t-0">
              <div className="flex-1 text-sm">
                <b>{i.name}</b> · {formatQty(i.qtyGrams)} · {i.cleaningLabel}
                <div className="text-ink-muted text-xs">{formatPricePerKg(i.pricePerKgPaise)}</div>
                {i.lineNote && <div className="text-danger text-xs font-semibold">Cut: {i.lineNote}</div>}
              </div>
              <b className="text-sm">{formatMoney(i.lineTotalPaise)}</b>
            </li>
          ))}
        </ul>
        {o.notes && (
          <p className="bg-gold-soft text-gold-ink mt-2 mb-0 rounded-lg px-3 py-2 text-sm">
            <b>Instructions:</b> {o.notes}
          </p>
        )}
        <dl className="border-line-soft m-0 mt-3 border-t pt-2 text-sm">
          <div className="flex justify-between">
            <dt>Subtotal</dt>
            <dd className="m-0">{formatMoney(o.subtotalPaise)}</dd>
          </div>
          {o.discountPaise > 0 && (
            <div className="flex justify-between">
              <dt>Discount ({o.couponCode})</dt>
              <dd className="m-0">−{formatMoney(o.discountPaise)}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt>Delivery</dt>
            <dd className="m-0">{formatMoney(o.deliveryFeePaise)}</dd>
          </div>
          <div className="flex justify-between text-base font-bold">
            <dt>Total</dt>
            <dd className="m-0">{formatMoney(o.totalPaise)}</dd>
          </div>
          <div className="text-ink-muted flex justify-between pt-1">
            <dt>Payment</dt>
            <dd className="m-0">{PAYMENT_TEXT[o.paymentStatus]}</dd>
          </div>
        </dl>
      </Card>

      {actionError && <InlineError className="mt-3" message={actionError} />}

      <div className="mt-4 flex flex-wrap gap-2">
        {next && !awaitingOnline && (
          <Button
            block={false}
            disabled={busy}
            onClick={() => void run('status', { to: next }, `Marked ${STATUS_LABEL[next].toLowerCase()}`)}
          >
            Mark {STATUS_LABEL[next].toLowerCase()}
          </Button>
        )}
        {o.paymentStatus === 'REFUND_PENDING' && (
          <Button
            block={false}
            variant="gold"
            disabled={busy}
            onClick={() => void run('refund', {}, 'Refund marked done')}
          >
            Refund done in Razorpay
          </Button>
        )}
        {canTransition(o.status, 'CANCELLED') && (
          <Button block={false} variant="dangerOutline" disabled={busy} onClick={() => setCancelOpen(true)}>
            Cancel order
          </Button>
        )}
      </div>
      {awaitingOnline && (
        <p className="text-ink-muted mt-2 text-sm">
          This online order is waiting for payment. It confirms automatically when Razorpay reports the
          payment.
        </p>
      )}

      <Card className="mt-4 p-4">
        <h2 className="text-ink-muted mt-0 mb-2 text-sm font-bold tracking-[0.1em] uppercase">History</h2>
        <ol className="m-0 list-none p-0 text-sm">
          {o.events.map((e, i) => (
            <li key={i} className="py-1">
              <b>{STATUS_LABEL[e.status]}</b> · {formatIstDate(e.at)} {formatIstTime(e.at)}
              {e.note && <span className="text-ink-muted"> – {e.note}</span>}
            </li>
          ))}
        </ol>
        {o.payments.length > 0 && (
          <>
            <h3 className="mt-3 mb-1 text-sm font-bold">Payments</h3>
            <ul className="text-ink-muted m-0 list-none p-0 text-xs">
              {o.payments.map((p) => (
                <li key={p.id} className="py-0.5">
                  {p.status} · {formatMoney(p.amountPaise)} · {p.razorpayOrderId}
                  {p.razorpayPaymentId ? ` / ${p.razorpayPaymentId}` : ''}
                  {p.failureReason ? ` – ${p.failureReason}` : ''}
                </li>
              ))}
            </ul>
          </>
        )}
        {o.notifications.length > 0 && (
          <>
            <h3 className="mt-3 mb-1 text-sm font-bold">Notifications</h3>
            <ul className="text-ink-muted m-0 list-none p-0 text-xs">
              {o.notifications.map((n, i) => (
                <li key={i} className="py-0.5">
                  {n.template} · {n.channel} · {n.status}
                  {n.error ? ` – ${n.error}` : ''} · {formatIstTime(n.at)}
                </li>
              ))}
            </ul>
          </>
        )}
      </Card>

      <BottomSheet
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        title="Cancel order"
        footer={
          <Button
            variant="danger"
            disabled={busy || !reason.trim()}
            onClick={async () => {
              if (await run('status', { to: 'CANCELLED', note: reason.trim() }, 'Order cancelled'))
                setCancelOpen(false);
            }}
          >
            Cancel order
          </Button>
        }
      >
        <p className="text-ink-muted mt-1 text-sm">
          The customer is notified.{' '}
          {o.paymentStatus === 'PAID' && 'A refund task is created – refund it in the Razorpay dashboard.'}
        </p>
        <label className="block">
          <span className="mb-1.5 block text-[13px] font-semibold">Reason (shown to the customer)</span>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value.slice(0, 200))}
            className="border-line-strong bg-card min-h-20 w-full resize-none rounded-2xl border px-4 py-3 text-sm"
            placeholder="e.g. Pomfret sold out this morning"
          />
        </label>
      </BottomSheet>
    </div>
  );
}
