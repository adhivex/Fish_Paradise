'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ButtonLink } from '@/components/ui/Button';
import { Card, Eyebrow } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Icon } from '@/components/ui/Icon';
import { IconButton } from '@/components/ui/IconButton';
import { PageHeader, StickyDock } from '@/components/ui/PageHeader';
import { ProductImage } from '@/components/ui/ProductImage';
import { QuantityStepper } from '@/components/ui/QuantityStepper';
import { LineSkeleton, LoadingRegion } from '@/components/ui/Skeleton';
import { TextButton } from '@/components/ui/TextLink';
import { usePricedCart } from '@/lib/hooks';
import { formatMoney, formatPricePerKg } from '@/lib/money';
import { maxAllowedGrams } from '@/lib/qty';
import { useCartStore } from '@/lib/stores/cart';
import { useHydrated } from '@/lib/stores/ui';
import { CouponRow } from './CouponRow';
import { TotalsCard } from './TotalsCard';

export function CartScreen() {
  const hydrated = useHydrated();
  const cart = usePricedCart();
  const notes = useCartStore((s) => s.notes);
  const setNotes = useCartStore((s) => s.setNotes);
  const step = useCartStore((s) => s.step);
  const remove = useCartStore((s) => s.remove);
  const clear = useCartStore((s) => s.clear);
  const [confirmClear, setConfirmClear] = useState(false);

  const empty = hydrated && cart.lines.length === 0;

  return (
    <main className={empty ? 'pb-10' : 'pb-[calc(110px+env(safe-area-inset-bottom))]'}>
      <PageHeader
        title="Your cart"
        backHref="/shop"
        backLabel="Back to shop"
        actions={
          hydrated &&
          cart.lines.length > 0 &&
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

      {!hydrated && (
        <LoadingRegion label="Loading your cart">
          <Card className="mx-4 mt-1">
            <LineSkeleton />
            <LineSkeleton />
          </Card>
        </LoadingRegion>
      )}

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

      {hydrated && cart.lines.length > 0 && (
        <>
          <Card className="mx-4 mt-1">
            <ul className="m-0 list-none p-0">
              {cart.lines.map((l) => (
                <li
                  key={l.productId}
                  className="border-line-soft flex items-start gap-3.5 border-t px-4 py-3.5 first:border-t-0"
                >
                  <Link href={`/product/${l.product.slug}`} tabIndex={-1} aria-hidden="true">
                    <ProductImage
                      slug={l.product.slug}
                      categorySlug={l.product.categorySlug}
                      className="size-[76px] rounded-[18px]"
                    />
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <Link
                      href={`/product/${l.product.slug}`}
                      className="font-serif text-lg font-semibold tracking-[-0.2px]"
                    >
                      {l.product.name}
                    </Link>
                    <span className="text-ink-muted text-[13px]">
                      {formatPricePerKg(l.product.pricePerKgPaise)} · {l.cleaningLabel}
                    </span>
                    {l.available ? (
                      <QuantityStepper
                        variant="compact"
                        grams={l.qtyGrams}
                        itemName={l.product.name}
                        canDecrease={l.qtyGrams > l.product.minQtyGrams}
                        canIncrease={l.qtyGrams < maxAllowedGrams(l.product)}
                        onStep={(d) => step(l.productId, d)}
                      />
                    ) : (
                      <span className="text-danger mt-2 text-[13px] font-semibold">
                        Sold out today – remove to continue
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col items-end justify-between self-stretch">
                    <IconButton
                      icon="trash"
                      label={`Remove ${l.product.name}`}
                      onClick={() => remove(l.productId)}
                      className="-mt-2 -mr-2.5 text-[#4A686C]"
                    />
                    <b className="text-base">{formatMoney(l.lineTotalPaise)}</b>
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

          <CouponRow />

          <TotalsCard totals={cart.totals} className="mx-4 mt-4 mb-5" />

          <StickyDock>
            {cart.hasUnavailable ? (
              <p
                role="alert"
                className="text-danger m-0 flex h-14 items-center justify-center gap-2 text-sm font-semibold"
              >
                <Icon name="alert" /> Remove sold-out items to continue
              </p>
            ) : (
              <ButtonLink href="/checkout">Proceed to checkout</ButtonLink>
            )}
          </StickyDock>
        </>
      )}
    </main>
  );
}
