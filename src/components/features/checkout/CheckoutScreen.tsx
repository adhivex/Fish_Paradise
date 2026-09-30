'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { OptionCard, OptionGroup } from '@/components/ui/OptionCard';
import { PageHeader, StickyDock } from '@/components/ui/PageHeader';
import { LineSkeleton, LoadingRegion } from '@/components/ui/Skeleton';
import { TextButton } from '@/components/ui/TextLink';
import { formatAddress } from '@/lib/address';
import { useDeliveryZone, usePricedCart } from '@/lib/hooks';
import { useCatalogue } from '@/components/features/CatalogueProvider';
import { slotTemplates } from '@/lib/mock/checkout';
import { formatMoney } from '@/lib/money';
import { slotKey, slotOptions } from '@/lib/slots';
import { useOrdersStore } from '@/lib/stores/orders';
import { useHydrated } from '@/lib/stores/ui';
import { AddressSheet } from './AddressSheet';
import { SectionCard } from './SectionCard';
import { SummaryLines } from './SummaryLines';

export function CheckoutScreen() {
  const router = useRouter();
  const hydrated = useHydrated();
  const { shop } = useCatalogue();
  const cart = usePricedCart();
  const { address, zone } = useDeliveryZone();
  const draft = useOrdersStore((s) => s.draft);
  const setDraft = useOrdersStore((s) => s.setDraft);
  const [sheet, setSheet] = useState<{ open: boolean; mode: 'list' | 'form'; n: number }>({
    open: false,
    mode: 'list',
    n: 0,
  });
  // A fresh key per opening resets the sheet's internal form state.
  const openSheet = (mode: 'list' | 'form') => setSheet((s) => ({ open: true, mode, n: s.n + 1 }));

  const closeSheet = useCallback(() => setSheet((s) => ({ ...s, open: false })), []);

  const options = useMemo(
    () => (hydrated ? slotOptions(new Date(), shop, slotTemplates) : []),
    [hydrated, shop],
  );
  const selectedKey = slotKey(draft.slot);
  const selectedOption = options.find((o) => o.key === selectedKey && !o.disabled);

  // Pick the first available slot if the saved one is gone (e.g. ASAP after closing time).
  useEffect(() => {
    if (!hydrated || selectedOption) return;
    const first = options.find((o) => !o.disabled);
    if (first) setDraft({ slot: first.choice });
  }, [hydrated, options, selectedOption, setDraft]);

  useEffect(() => {
    if (hydrated && cart.lines.length === 0) router.replace('/cart');
  }, [hydrated, cart.lines.length, router]);

  const belowMinimum = !!zone && cart.totals.subtotalPaise < zone.minOrderPaise;
  const blocker = !address
    ? 'Add a delivery address to continue'
    : !zone
      ? `We don't deliver to ${address.pincode} yet`
      : belowMinimum
        ? `Minimum order for this area is ${formatMoney(zone.minOrderPaise)}`
        : !selectedOption
          ? 'No delivery slots are available right now'
          : cart.hasUnavailable
            ? 'Some items are sold out – go back to your cart'
            : null;

  if (!hydrated || cart.lines.length === 0) {
    return (
      <main>
        <PageHeader title="Checkout" backHref="/cart" backLabel="Back to cart" />
        <LoadingRegion label="Loading checkout">
          <Card className="mx-4 mt-1">
            <LineSkeleton />
            <LineSkeleton />
          </Card>
        </LoadingRegion>
      </main>
    );
  }

  return (
    <main className="pb-[calc(130px+env(safe-area-inset-bottom))]">
      <PageHeader title="Checkout" backHref="/cart" backLabel="Back to cart" />

      <SectionCard
        step={1}
        title="Delivery address"
        className="mt-1"
        action={address && <TextButton onClick={() => openSheet('list')}>Change</TextButton>}
      >
        {address ? (
          <div className="bg-gold-soft flex items-start gap-3 rounded-[14px] p-3">
            <Icon name="home" className="text-ink mt-0.5" />
            <div>
              <b>{address.label}</b>
              <div className="text-ink-muted mt-0.5 text-[13px] leading-[1.45]">{formatAddress(address)}</div>
              {!zone && (
                <p role="alert" className="text-danger mt-1.5 mb-0 text-[13px] font-semibold">
                  We don&apos;t deliver to this pincode yet. Choose another address.
                </p>
              )}
            </div>
          </div>
        ) : (
          <p className="text-ink-muted m-0 text-sm">No saved address yet.</p>
        )}
        <div className="flex justify-center">
          <TextButton onClick={() => openSheet('form')} className="mt-1.5">
            <Icon name="plus" size={16} />
            Add new address
          </TextButton>
        </div>
      </SectionCard>

      <SectionCard step={2} title="Delivery slot">
        <OptionGroup label="Delivery slot" showLabel={false} columns={1}>
          {options.map((o) => (
            <OptionCard
              key={o.key}
              size="lg"
              name="slot"
              value={o.key}
              checked={o.key === selectedKey && !o.disabled}
              disabled={o.disabled}
              onSelect={() => setDraft({ slot: o.choice })}
              title={o.title}
              subtitle={o.subtitle}
            />
          ))}
        </OptionGroup>
      </SectionCard>

      <SectionCard step={3} title="Order summary" className="mb-2">
        <SummaryLines
          lines={cart.lines.map((l) => ({
            key: l.productId,
            slug: l.product.slug,
            categorySlug: l.product.categorySlug,
            name: l.product.name,
            qtyGrams: l.qtyGrams,
            cleaningLabel: l.cleaningLabel,
            lineTotalPaise: l.lineTotalPaise,
          }))}
        />
        <dl className="m-0 mt-2 border-t border-[#E8DDCB] pt-2.5">
          <div className="flex justify-between py-0.5 text-sm">
            <dt className="text-ink-muted">Subtotal</dt>
            <dd className="m-0">{formatMoney(cart.totals.subtotalPaise)}</dd>
          </div>
          <div className="flex justify-between py-0.5 text-sm">
            <dt className="text-ink-muted">Delivery</dt>
            <dd className="m-0">
              {cart.totals.deliveryFeePaise === 0 ? 'Free' : formatMoney(cart.totals.deliveryFeePaise)}
            </dd>
          </div>
          <div className="flex justify-between pt-2 text-lg font-bold">
            <dt>Total</dt>
            <dd className="m-0">{formatMoney(cart.totals.totalPaise)}</dd>
          </div>
        </dl>
      </SectionCard>

      <StickyDock>
        {blocker && (
          <p role="alert" className="text-danger mt-0 mb-2.5 text-center text-[13px] font-semibold">
            {blocker}
          </p>
        )}
        <Button disabled={!!blocker} onClick={() => router.push('/payment')}>
          Continue to payment
        </Button>
      </StickyDock>

      <AddressSheet
        key={sheet.n}
        open={sheet.open}
        startInForm={sheet.mode === 'form'}
        onClose={closeSheet}
        selectedId={address?.id}
        onSelect={(id) => setDraft({ addressId: id })}
      />
    </main>
  );
}
