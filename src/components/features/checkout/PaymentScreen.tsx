'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { OptionCard, OptionGroup } from '@/components/ui/OptionCard';
import { PageHeader, StickyDock } from '@/components/ui/PageHeader';
import { Skeleton } from '@/components/ui/Skeleton';
import { TextLink } from '@/components/ui/TextLink';
import { useDeliveryZone, usePricedCart } from '@/lib/hooks';
import { useCatalogue } from '@/components/features/CatalogueProvider';
import { slotTemplates } from '@/lib/mock/checkout';
import { formatMoney } from '@/lib/money';
import { slotKey, slotLabel, slotOptions } from '@/lib/slots';
import { useCartStore } from '@/lib/stores/cart';
import { useOrdersStore } from '@/lib/stores/orders';
import { useHydrated } from '@/lib/stores/ui';
import type { PaymentMethod } from '@/lib/types';

const METHODS: ReadonlyArray<{ value: PaymentMethod; title: string; subtitle: string }> = [
  { value: 'UPI', title: 'UPI', subtitle: 'Pay with any UPI app' },
  { value: 'CARD', title: 'Credit / Debit card', subtitle: 'Visa, Mastercard, RuPay' },
  { value: 'NETBANKING', title: 'Net banking', subtitle: 'All major banks' },
  { value: 'COD', title: 'Cash on delivery', subtitle: 'Pay when your order arrives' },
];

export function PaymentScreen() {
  const router = useRouter();
  const hydrated = useHydrated();
  const { shop } = useCatalogue();
  const cart = usePricedCart();
  const { address, zone } = useDeliveryZone();
  const notes = useCartStore((s) => s.notes);
  const clearCart = useCartStore((s) => s.clear);
  const draft = useOrdersStore((s) => s.draft);
  const setDraft = useOrdersStore((s) => s.setDraft);
  const placeOrder = useOrdersStore((s) => s.placeOrder);
  // Holds the total shown while the order is placed, so clearing the cart does not flash ₹0.
  const [placedTotal, setPlacedTotal] = useState<string | null>(null);
  const busy = placedTotal !== null;
  const placing = useRef(false);

  useEffect(() => {
    if (!hydrated || placing.current) return;
    if (cart.lines.length === 0) router.replace('/cart');
    else if (!address || !zone || cart.hasUnavailable) router.replace('/checkout');
  }, [hydrated, cart.lines.length, cart.hasUnavailable, address, zone, router]);

  const total = placedTotal ?? formatMoney(cart.totals.totalPaise);
  const isCod = draft.paymentMethod === 'COD';

  async function pay() {
    if (!address || busy) return;
    const slot = slotOptions(new Date(), shop, slotTemplates).find(
      (o) => o.key === slotKey(draft.slot) && !o.disabled,
    );
    if (!slot) {
      router.replace('/checkout');
      return;
    }
    setPlacedTotal(total);
    placing.current = true;
    // MOCK: online payments go through Razorpay Checkout + webhook in Phase 5. Here we simulate
    // a successful payment; COD is auto-confirmed per ShopSettings.autoConfirmCod.
    await new Promise((r) => setTimeout(r, isCod ? 300 : 900));
    const now = Date.now();
    const orderNumber = placeOrder({
      status: 'CONFIRMED',
      placedAt: now,
      items: cart.lines.map((l) => ({
        productId: l.productId,
        productSlug: l.product.slug,
        nameSnapshot: l.product.name,
        pricePerKgPaise: l.product.pricePerKgPaise,
        qtyGrams: l.qtyGrams,
        cleaningLabel: l.cleaningLabel,
        lineTotalPaise: l.lineTotalPaise,
      })),
      addressSnapshot: { ...address },
      slotLabel: slotLabel(slot),
      slotType: slot.choice.type,
      ...cart.totals,
      paymentMethod: draft.paymentMethod,
      paymentStatus: isCod ? 'COD_PENDING' : 'PAID',
      notes: notes.trim() || null,
      events: [
        { status: 'PLACED', at: now },
        { status: 'CONFIRMED', at: now },
      ],
    });
    router.replace(`/orders/${orderNumber}/confirmed`);
    clearCart();
  }

  return (
    <main className="pb-[calc(140px+env(safe-area-inset-bottom))]">
      <PageHeader title="Payment" backHref="/checkout" backLabel="Back to checkout" />

      <Card className="mx-4 mt-1 flex items-center justify-between px-4 py-3.5">
        <div>
          <div className="text-ink-muted text-[13px]">Total amount</div>
          {hydrated ? (
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
            checked={draft.paymentMethod === m.value}
            onSelect={(v) => setDraft({ paymentMethod: v as PaymentMethod })}
            title={m.title}
            subtitle={m.subtitle}
          />
        ))}
      </OptionGroup>

      <StickyDock>
        <Button onClick={pay} disabled={!hydrated || busy} aria-busy={busy}>
          {busy
            ? isCod
              ? 'Placing order…'
              : 'Processing payment…'
            : isCod
              ? `Place order · ${total}`
              : `Pay ${total}`}
        </Button>
        <p className="mt-2.5 mb-0 flex items-center justify-center gap-1.5 text-xs text-[#4A686C]">
          <Icon name="shield" size={16} />
          Secure, encrypted payment
        </p>
      </StickyDock>
    </main>
  );
}
