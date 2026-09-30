'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { InlineError } from '@/components/ui/InlineError';
import { OptionCard, OptionGroup } from '@/components/ui/OptionCard';
import { PageHeader, StickyDock } from '@/components/ui/PageHeader';
import { LineSkeleton, LoadingRegion, Skeleton } from '@/components/ui/Skeleton';
import { TextButton } from '@/components/ui/TextLink';
import { formatAddress } from '@/lib/address';
import { useAddresses, useQuote, useSlots } from '@/lib/client/data';
import { formatMoney } from '@/lib/money';
import { useCartStore } from '@/lib/stores/cart';
import { useCheckoutStore } from '@/lib/stores/checkout';
import { useHydrated } from '@/lib/stores/ui';
import type { SlotChoice } from '@/lib/types';
import { AddressSheet } from './AddressSheet';
import { SectionCard } from './SectionCard';
import { SummaryLines } from './SummaryLines';

const slotKey = (s: SlotChoice | null) =>
  !s ? '' : s.type === 'ASAP' ? 'asap' : `${s.templateId}:${s.date}`;

export function CheckoutScreen() {
  const router = useRouter();
  const hydrated = useHydrated();
  const lineCount = useCartStore((s) => s.lines.length);
  const { addressId, slot, setAddress, setSlot } = useCheckoutStore();
  const { addresses, loading: addressesLoading, mutate: reloadAddresses } = useAddresses();
  const { slots, error: slotsError, retry: retrySlots } = useSlots();

  const address =
    addresses.find((a) => a.id === addressId) ?? addresses.find((a) => a.isDefault) ?? addresses[0];
  const { quote, error: quoteError, retry: retryQuote } = useQuote(address?.id);

  const [sheet, setSheet] = useState({ open: false, form: false, n: 0 });
  const openSheet = (form: boolean) => setSheet((s) => ({ open: true, form, n: s.n + 1 }));
  const closeSheet = useCallback(() => setSheet((s) => ({ ...s, open: false })), []);

  // Remember the chosen address; default to the saved default.
  useEffect(() => {
    if (address && address.id !== addressId) setAddress(address.id);
  }, [address, addressId, setAddress]);

  // Keep a valid slot selected (e.g. ASAP disappears after closing time).
  const options: Array<{
    key: string;
    choice: SlotChoice;
    title: string;
    subtitle: string;
    disabled: boolean;
  }> = slots
    ? [
        {
          key: 'asap',
          choice: { type: 'ASAP' },
          title: 'ASAP',
          subtitle: slots.asap.available ? slots.asap.label : (slots.asap.reason ?? 'Unavailable'),
          disabled: !slots.asap.available,
        },
        ...slots.scheduled.map((s) => ({
          key: `${s.templateId}:${s.date}`,
          choice: { type: 'SCHEDULED' as const, templateId: s.templateId, date: s.date },
          title: 'Schedule delivery',
          subtitle: `${s.dayLabel}, ${s.label}${s.available ? '' : ' · Full'}`,
          disabled: !s.available,
        })),
      ]
    : [];
  const selected = options.find((o) => o.key === slotKey(slot) && !o.disabled);
  useEffect(() => {
    if (!slots || selected) return;
    const first = options.find((o) => !o.disabled);
    setSlot(first ? first.choice : null);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- options derive from slots
  }, [slots, selected, setSlot]);

  useEffect(() => {
    if (hydrated && lineCount === 0) router.replace('/cart');
  }, [hydrated, lineCount, router]);

  const blocker = !address
    ? 'Add a delivery address to continue'
    : (quote?.blockers[0]?.message ??
      (slots && !selected ? 'No delivery slots are available right now' : null));

  if (!hydrated || lineCount === 0) {
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
    <main className="pb-[calc(140px+env(safe-area-inset-bottom))]">
      <PageHeader title="Checkout" backHref="/cart" backLabel="Back to cart" />

      <SectionCard
        step={1}
        title="Delivery address"
        className="mt-1"
        action={address && <TextButton onClick={() => openSheet(false)}>Change</TextButton>}
      >
        {addressesLoading ? (
          <Skeleton className="h-16 w-full rounded-[14px]" />
        ) : address ? (
          <div className="bg-gold-soft flex items-start gap-3 rounded-[14px] p-3">
            <Icon name="home" className="text-ink mt-0.5" />
            <div>
              <b>{address.label}</b>
              <div className="text-ink-muted mt-0.5 text-[13px] leading-[1.45]">{formatAddress(address)}</div>
              {!address.serviceable && (
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
          <TextButton onClick={() => openSheet(true)} className="mt-1.5">
            <Icon name="plus" size={16} />
            Add new address
          </TextButton>
        </div>
      </SectionCard>

      <SectionCard step={2} title="Delivery slot">
        {slotsError && !slots ? (
          <InlineError message={slotsError.message} onRetry={retrySlots} />
        ) : !slots ? (
          <div className="flex flex-col gap-2.5">
            <Skeleton className="h-16 w-full rounded-[18px]" />
            <Skeleton className="h-16 w-full rounded-[18px]" />
          </div>
        ) : (
          <OptionGroup label="Delivery slot" showLabel={false} columns={1}>
            {options.map((o) => (
              <OptionCard
                key={o.key}
                size="lg"
                name="slot"
                value={o.key}
                checked={o.key === selected?.key}
                disabled={o.disabled}
                onSelect={() => setSlot(o.choice)}
                title={o.title}
                subtitle={o.subtitle}
              />
            ))}
          </OptionGroup>
        )}
      </SectionCard>

      <SectionCard step={3} title="Order summary" className="mb-2">
        {quoteError && !quote ? (
          <InlineError message={quoteError.message} onRetry={retryQuote} />
        ) : !quote ? (
          <>
            <LineSkeleton />
            <LineSkeleton />
          </>
        ) : (
          <>
            <SummaryLines
              lines={quote.lines.map((l) => ({
                key: l.productId,
                slug: l.slug,
                categorySlug: l.categorySlug,
                imageUrl: l.imageUrl,
                name: l.name,
                qtyGrams: l.qtyGrams,
                cleaningLabel: l.cleaningLabel,
                lineTotalPaise: l.lineTotalPaise,
              }))}
            />
            <dl className="m-0 mt-2 border-t border-[#E8DDCB] pt-2.5">
              <div className="flex justify-between py-0.5 text-sm">
                <dt className="text-ink-muted">Subtotal</dt>
                <dd className="m-0">{formatMoney(quote.subtotalPaise)}</dd>
              </div>
              {quote.discountPaise > 0 && (
                <div className="flex justify-between py-0.5 text-sm">
                  <dt className="text-ink-muted">Discount ({quote.coupon?.code})</dt>
                  <dd className="text-success m-0">−{formatMoney(quote.discountPaise)}</dd>
                </div>
              )}
              <div className="flex justify-between py-0.5 text-sm">
                <dt className="text-ink-muted">Delivery</dt>
                <dd className="m-0">
                  {quote.deliveryFeePaise === 0 ? 'Free' : formatMoney(quote.deliveryFeePaise)}
                </dd>
              </div>
              <div className="flex justify-between pt-2 text-lg font-bold">
                <dt>Total</dt>
                <dd className="m-0">{formatMoney(quote.totalPaise)}</dd>
              </div>
            </dl>
          </>
        )}
      </SectionCard>

      <StickyDock>
        {blocker && (
          <p role="alert" className="text-danger mt-0 mb-2.5 text-center text-[13px] font-semibold">
            {blocker}
          </p>
        )}
        <Button disabled={!!blocker || !quote || !selected} onClick={() => router.push('/payment')}>
          Continue to payment
        </Button>
      </StickyDock>

      <AddressSheet
        key={sheet.n}
        open={sheet.open}
        startInForm={sheet.form}
        onClose={closeSheet}
        addresses={addresses}
        selectedId={address?.id}
        onSelect={setAddress}
        onSaved={() => void reloadAddresses()}
      />
    </main>
  );
}
