'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { InlineError } from '@/components/ui/InlineError';
import { PageHeader } from '@/components/ui/PageHeader';
import { Skeleton } from '@/components/ui/Skeleton';
import { api, ClientApiError } from '@/lib/client/api';
import { useOrder } from '@/lib/client/data';
import { formatMoney } from '@/lib/money';

/**
 * Development payment page. The buttons send a correctly signed Razorpay-style webhook through
 * the real webhook handler, so the order is confirmed exactly as in production.
 */
export function FakePaymentScreen({ orderNumber }: { orderNumber: string }) {
  const router = useRouter();
  const { order } = useOrder(orderNumber);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send(outcome: 'success' | 'failure') {
    setBusy(true);
    setError(null);
    try {
      await api('/api/dev/fake-pay', { body: { orderNumber, outcome } });
      router.replace(outcome === 'success' ? `/orders/${orderNumber}/confirmed` : `/orders/${orderNumber}`);
    } catch (e) {
      setError(e instanceof ClientApiError ? e.message : 'Payment simulation failed.');
      setBusy(false);
    }
  }

  return (
    <main className="pb-10">
      <PageHeader title="Test payment" backHref={`/orders/${orderNumber}`} backLabel="Back to order" />
      <Card className="mx-4 mt-2 p-5">
        <p className="bg-gold-soft text-gold-ink mt-0 mb-4 rounded-lg px-3 py-2 text-[13px]">
          Development mode – no real money moves. Set <b>PAYMENT_PROVIDER=razorpay</b> with test keys to use
          Razorpay Checkout.
        </p>
        <div className="text-ink-muted text-[13px]">Order #{orderNumber}</div>
        {order ? (
          <div className="font-serif text-[32px] font-bold">{formatMoney(order.totalPaise)}</div>
        ) : (
          <Skeleton className="mt-1 h-9 w-28" />
        )}
        <div className="mt-5 flex flex-col gap-2.5">
          <Button onClick={() => void send('success')} disabled={busy}>
            Pay successfully
          </Button>
          <Button variant="outline" onClick={() => void send('failure')} disabled={busy}>
            Simulate a failed payment
          </Button>
        </div>
        {error && <InlineError className="mt-3" message={error} />}
      </Card>
    </main>
  );
}
