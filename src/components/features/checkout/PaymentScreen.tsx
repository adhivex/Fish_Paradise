'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useCatalogue } from '@/components/features/CatalogueProvider';
import { flushCartSync } from '@/components/features/CartSync';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { InlineError } from '@/components/ui/InlineError';
import { OptionCard, OptionGroup } from '@/components/ui/OptionCard';
import { PageHeader, StickyDock } from '@/components/ui/PageHeader';
import { Skeleton } from '@/components/ui/Skeleton';
import { TextLink } from '@/components/ui/TextLink';
import { api, ClientApiError } from '@/lib/client/api';
import { startCheckout, type CheckoutParams } from '@/lib/client/checkout';
import { useQuote } from '@/lib/client/data';
import { useSession } from '@/lib/client/session';
import { formatMoney } from '@/lib/money';
import { useCartStore } from '@/lib/stores/cart';
import { useCheckoutStore } from '@/lib/stores/checkout';
import { useHydrated } from '@/lib/stores/ui';
import type { PaymentMethod } from '@/lib/types';

const METHODS: ReadonlyArray<{ value: PaymentMethod; title: string; subtitle: string }> = [
  { value: 'UPI', title: 'UPI', subtitle: 'Pay with any UPI app' },
  { value: 'CARD', title: 'Credit / Debit card', subtitle: 'Visa, Mastercard, RuPay' },
  { value: 'NETBANKING', title: 'Net banking', subtitle: 'All major banks' },
  { value: 'COD', title: 'Cash on delivery', subtitle: 'Pay when your order arrives' },
];

interface CreateOrderResult {
  orderNumber: string;
  totalPaise: number;
  checkout: CheckoutParams | null;
}

export function PaymentScreen() {
  const router = useRouter();
  const hydrated = useHydrated();
  const { shop } = useCatalogue();
  const { user } = useSession();
  const lineCount = useCartStore((s) => s.lines.length);
  const notes = useCartStore((s) => s.notes);
  const { addressId, slot, paymentMethod, setPaymentMethod, reset } = useCheckoutStore();
  const { quote } = useQuote(addressId);
  const [placing, setPlacing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const placed = useRef(false);

  useEffect(() => {
    if (!hydrated || placed.current) return;
    if (lineCount === 0) router.replace('/cart');
    else if (!addressId || !slot) router.replace('/checkout');
  }, [hydrated, lineCount, addressId, slot, router]);

  const total = placing ?? (quote ? formatMoney(quote.totalPaise) : null);
  const isCod = paymentMethod === 'COD';

  async function pay() {
    if (!addressId || !slot || placing || !quote) return;
    setError(null);
    setPlacing(formatMoney(quote.totalPaise));
    try {
      await flushCartSync();
      const res = await api<CreateOrderResult>('/api/orders', {
        body: { addressId, slot, paymentMethod, notes: notes || null },
      });
      placed.current = true;
      // The server cleared the cart inside the order transaction; mirror that locally.
      useCartStore.getState().adopt({ items: [], notes: '', couponCode: null }, user?.id ?? null);
      reset();
      const next = res.checkout
        ? await startCheckout(res.orderNumber, res.checkout, shop.shopName)
        : `/orders/${res.orderNumber}/confirmed`;
      router.replace(next);
    } catch (e) {
      placed.current = false;
      setPlacing(null);
      const message =
        e instanceof ClientApiError || e instanceof Error ? e.message : 'Could not place the order.';
      setError(message);
    }
  }

  return (
    <main className="pb-[calc(150px+env(safe-area-inset-bottom))]">
      <PageHeader title="Payment" backHref="/checkout" backLabel="Back to checkout" />

      <Card className="mx-4 mt-1 flex items-center justify-between px-4 py-3.5">
        <div>
          <div className="text-ink-muted text-[13px]">Total amount</div>
          {total ? (
            <div className="font-serif text-[32px] font-bold tracking-[-0.5px]">{total}</div>
          ) : (
            <Skeleton className="mt-1 h-9 w-28" />
          )}
        </div>
        <TextLink href="/checkout" chevron>
          View details
        </TextLink>
      </Card>

      <OptionGroup
        label="Select payment method"
        legendClassName="mb-2.5 text-[17px]"
        columns={1}
        className="mt-[22px] px-4"
      >
        {METHODS.map((m) => (
          <OptionCard
            key={m.value}
            size="lg"
            name="payment"
            value={m.value}
            checked={paymentMethod === m.value}
            onSelect={(v) => setPaymentMethod(v as PaymentMethod)}
            title={m.title}
            subtitle={m.subtitle}
            disabled={!!placing}
          />
        ))}
      </OptionGroup>

      {error && <InlineError className="mx-4 mt-3" message={error} />}

      <StickyDock>
        <Button onClick={() => void pay()} disabled={!hydrated || !!placing || !quote} aria-busy={!!placing}>
          {placing
            ? isCod
              ? 'Placing order…'
              : 'Opening payment…'
            : isCod
              ? `Place order · ${total ?? ''}`
              : `Pay ${total ?? ''}`}
        </Button>
        <p className="mt-2.5 mb-0 flex items-center justify-center gap-1.5 text-xs text-[#4A686C]">
          <Icon name="shield" size={16} />
          Secure, encrypted payment
        </p>
      </StickyDock>
    </main>
  );
}
