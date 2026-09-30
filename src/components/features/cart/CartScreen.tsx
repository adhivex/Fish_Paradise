'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { LoginSheet } from '@/components/features/auth/LoginSheet';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Card, Eyebrow } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Icon } from '@/components/ui/Icon';
import { IconButton } from '@/components/ui/IconButton';
import { InlineError } from '@/components/ui/InlineError';
import { PageHeader, StickyDock } from '@/components/ui/PageHeader';
import { ProductImage } from '@/components/ui/ProductImage';
import { QuantityStepper } from '@/components/ui/QuantityStepper';
import { LineSkeleton, LoadingRegion } from '@/components/ui/Skeleton';
import { TextButton } from '@/components/ui/TextLink';
import type { LineIssue } from '@/lib/cart';
import { useQuote } from '@/lib/client/data';
import { useSession } from '@/lib/client/session';
import { cn } from '@/lib/cn';
import { formatMoney, formatPricePerKg } from '@/lib/money';
import { formatQty } from '@/lib/qty';
import { useCartStore } from '@/lib/stores/cart';
import { useHydrated } from '@/lib/stores/ui';
import { CouponRow } from './CouponRow';
import { TotalsCard } from './TotalsCard';

const ISSUE_TEXT: Record<LineIssue, string> = {
  UNAVAILABLE: 'No longer available – please remove',
  SOLD_OUT: 'Sold out today – please remove',
  QTY_INVALID: 'Not available in this quantity',
  NOTE_REQUIRED: 'Describe your custom cut on the product page',
  CLEANING_INVALID: 'Cleaning option changed – re-add from the product page',
};

export function CartScreen() {
  const router = useRouter();
  const hydrated = useHydrated();
  const { user } = useSession();
  const lines = useCartStore((s) => s.lines);
  const notes = useCartStore((s) => s.notes);
  const couponCode = useCartStore((s) => s.couponCode);
  const setNotes = useCartStore((s) => s.setNotes);
  const step = useCartStore((s) => s.step);
  const remove = useCartStore((s) => s.remove);
  const clear = useCartStore((s) => s.clear);
  const { quote, error, loading, updating, retry } = useQuote();
  const [confirmClear, setConfirmClear] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);

  const empty = hydrated && lines.length === 0;
  const blocker = quote?.blockers.find((b) => b.code !== 'CART_EMPTY');

  return (
    <main className={empty ? 'pb-10' : 'pb-[calc(130px+env(safe-area-inset-bottom))]'}>
      <PageHeader
        title="Your cart"
        backHref="/shop"
        backLabel="Back to shop"
        actions={
          !empty &&
          hydrated &&
          (confirmClear ? (
            <span className="flex items-center">
              <TextButton
                onClick={() => {
                  clear();
                  setConfirmClear(false);
                }}
                className="text-danger"
              >
                Clear
              </TextButton>
              <TextButton onClick={() => setConfirmClear(false)}>Keep</TextButton>
            </span>
          ) : (
            <TextButton onClick={() => setConfirmClear(true)}>Clear all</TextButton>
          ))
        }
      />

      {empty && (
        <EmptyState
          icon="bag"
          title="Your cart is empty"
          body="Add today's fresh catch and we'll clean and pack it for you."
          action={
            <ButtonLink href="/shop" block={false} className="w-[220px]">
              Start shopping
            </ButtonLink>
          }
        />
      )}

      {!empty && (loading || !quote) && !error && (
        <LoadingRegion label="Loading your cart">
          <Card className="mx-4 mt-1">
            <LineSkeleton />
            <LineSkeleton />
          </Card>
        </LoadingRegion>
      )}

      {!empty && error && !quote && (
        <InlineError className="mx-4 mt-2" message={error.message} onRetry={retry} />
      )}

      {!empty && quote && (
        <>
          <Card className={cn('mx-4 mt-1 transition-opacity', updating && 'opacity-80')}>
            <ul className="m-0 list-none p-0" aria-busy={updating}>
              {quote.lines.map((l) => (
                <li
                  key={l.productId}
                  className="border-line-soft flex items-start gap-3.5 border-t px-4 py-3.5 first:border-t-0"
                >
                  <Link href={`/product/${l.slug}`} tabIndex={-1} aria-hidden="true">
                    <ProductImage
                      slug={l.slug}
                      categorySlug={l.categorySlug}
                      imageUrl={l.imageUrl}
                      sizes="76px"
                      className={cn('size-[76px] rounded-[18px]', l.issue && 'opacity-50 grayscale')}
                    />
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <Link
                      href={`/product/${l.slug}`}
                      className="font-serif text-lg font-semibold tracking-[-0.2px]"
                    >
                      {l.name}
                    </Link>
                    <span className="text-ink-muted text-[13px]">
                      {formatPricePerKg(l.pricePerKgPaise)} · {l.cleaningLabel}
                    </span>
                    {l.lineNote && <span className="text-ink-muted text-[13px] italic">“{l.lineNote}”</span>}
                    {l.issue && l.issue !== 'QTY_INVALID' ? (
                      <span className="text-danger mt-2 text-[13px] font-semibold">
                        {ISSUE_TEXT[l.issue]}
                      </span>
                    ) : (
                      <>
                        <QuantityStepper
                          variant="compact"
                          grams={l.qtyGrams}
                          itemName={l.name}
                          canDecrease={l.qtyGrams > l.minQtyGrams}
                          canIncrease={l.qtyGrams < l.maxAllowedGrams}
                          onStep={(d) => step(l.productId, d, l)}
                        />
                        {l.issue === 'QTY_INVALID' && (
                          <span className="text-danger text-[13px] font-semibold">
                            Only {formatQty(l.maxAllowedGrams)} available – reduce the quantity
                          </span>
                        )}
                      </>
                    )}
                  </div>
                  <div className="flex flex-col items-end justify-between self-stretch">
                    <IconButton
                      icon="trash"
                      label={`Remove ${l.name}`}
                      onClick={() => remove(l.productId)}
                      className="-mt-2 -mr-2.5 text-[#4A686C]"
                    />
                    <b className="text-base">{l.issue ? '—' : formatMoney(l.lineTotalPaise)}</b>
                  </div>
                </li>
              ))}
            </ul>
          </Card>

          <label className="mx-4 mt-4 block">
            <Eyebrow as="h2" className="mb-2">
              Add special instructions{' '}
              <span className="font-medium tracking-normal normal-case">(optional)</span>
            </Eyebrow>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Extra cleaning, specific size, etc."
              className="border-line-strong bg-card text-ink placeholder:text-ink-muted min-h-20 w-full resize-none rounded-2xl border px-4 py-3.5 text-sm"
            />
          </label>

          <CouponRow coupon={quote.coupon} discountPaise={quote.discountPaise} />

          <TotalsCard
            totals={quote}
            couponCode={couponCode}
            deliveryEstimated={quote.delivery.estimated}
            className="mx-4 mt-4 mb-5"
          />

          <StickyDock>
            {blocker && (
              <p
                role="alert"
                className="text-danger mt-0 mb-2.5 flex items-center justify-center gap-1.5 text-center text-[13px] font-semibold"
              >
                <Icon name="alert" size={18} /> {blocker.message}
              </p>
            )}
            <Button
              disabled={!!blocker || updating}
              onClick={() => (user ? router.push('/checkout') : setLoginOpen(true))}
            >
              Proceed to checkout
            </Button>
          </StickyDock>

          <LoginSheet
            open={loginOpen}
            onClose={() => setLoginOpen(false)}
            onDone={() => {
              setLoginOpen(false);
              router.push('/checkout');
            }}
          />
        </>
      )}
    </main>
  );
}
