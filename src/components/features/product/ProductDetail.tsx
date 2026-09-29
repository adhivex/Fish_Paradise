'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Eyebrow, InfoBadge } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { IconButton, IconLink } from '@/components/ui/IconButton';
import { OptionCard, OptionGroup } from '@/components/ui/OptionCard';
import { StickyDock } from '@/components/ui/PageHeader';
import { ProductImage } from '@/components/ui/ProductImage';
import { QuantityStepper } from '@/components/ui/QuantityStepper';
import { cleaningOptions, defaultCleaningOption, shopSettings } from '@/lib/mock/catalogue';
import { formatMoney } from '@/lib/money';
import { lineTotalPaise } from '@/lib/pricing';
import { clampQty, maxAllowedGrams, stepQty } from '@/lib/qty';
import { useAccountStore } from '@/lib/stores/account';
import { useCartStore } from '@/lib/stores/cart';
import { useHydrated } from '@/lib/stores/ui';
import type { ProductDTO } from '@/lib/types';

const DEFAULT_GRAMS = 1000;

export function ProductDetail({ product }: { product: ProductDTO }) {
  const router = useRouter();
  const hydrated = useHydrated();
  const [grams, setGrams] = useState(() => clampQty(DEFAULT_GRAMS, product));
  const [cleaningId, setCleaningId] = useState(defaultCleaningOption().id);
  const [customNote, setCustomNote] = useState('');
  const add = useCartStore((s) => s.add);
  const isFav = useAccountStore((s) => s.favourites.includes(product.id));
  const toggleFav = useAccountStore((s) => s.toggleFavourite);

  const soldOut = !product.todayAvailable || maxAllowedGrams(product) === 0;
  const cleaning = cleaningOptions.find((o) => o.id === cleaningId);
  const needsNote = !!cleaning?.requiresNote && customNote.trim().length === 0;
  const total = lineTotalPaise(product.pricePerKgPaise, grams, cleaning?.extraPaise ?? 0);

  function addToCart() {
    if (soldOut || needsNote) return;
    add({ productId: product.id, qtyGrams: grams, cleaningOptionId: cleaningId });
    if (cleaning?.requiresNote) {
      // Line notes join the order instructions until per-line notes arrive with the server cart.
      const notes = useCartStore.getState().notes;
      const line = `${product.name}: ${customNote.trim()}`;
      useCartStore.getState().setNotes(notes ? `${notes}\n${line}` : line);
    }
    router.push('/cart');
  }

  return (
    <main className="pb-[calc(110px+env(safe-area-inset-bottom))]">
      <div className="relative flex h-[330px] items-center justify-center overflow-hidden">
        <ProductImage
          slug={product.slug}
          categorySlug={product.categorySlug}
          className="absolute inset-0"
          glyphClassName="w-[74%]"
          eyeColor="#fff"
        />
        <IconLink
          href="/shop"
          icon="arrowLeft"
          label="Back to shop"
          tone="cream"
          className="absolute top-3.5 left-3"
        />
        <IconButton
          icon="heart"
          label={isFav ? `Remove ${product.name} from favourites` : `Save ${product.name} to favourites`}
          aria-pressed={hydrated ? isFav : false}
          tone="cream"
          filled={hydrated && isFav}
          onClick={() => toggleFav(product.id)}
          className={`absolute top-3.5 right-3 ${hydrated && isFav ? 'text-gold-glyph!' : ''}`}
        />
      </div>

      <div className="bg-cream relative -mt-[30px] rounded-t-[30px] px-[18px] pt-[26px] pb-[22px]">
        <h1 className="m-0 font-serif text-[34px] font-semibold tracking-[-0.8px]">{product.name}</h1>
        <p className="mt-1.5 mb-3.5 font-serif text-[28px] font-semibold">
          {formatMoney(product.pricePerKgPaise)}{' '}
          <span className="text-ink-muted font-sans text-[15px] font-medium">/ kg</span>
        </p>
        <div className="mb-[22px] flex flex-wrap gap-2">
          {product.note && <InfoBadge>{product.note}</InfoBadge>}
          <InfoBadge>Cleaned to order</InfoBadge>
        </div>

        {soldOut ? (
          <div
            role="status"
            className="border-line-strong bg-card mb-[22px] rounded-2xl border p-4 text-[15px] font-semibold"
          >
            Sold out today
            <span className="text-ink-muted mt-0.5 block text-[13px] font-normal">
              Check back tomorrow morning for the fresh catch.
            </span>
          </div>
        ) : (
          <>
            <Eyebrow>Choose quantity</Eyebrow>
            <QuantityStepper
              grams={grams}
              itemName={product.name}
              canDecrease={grams > product.minQtyGrams}
              canIncrease={grams < maxAllowedGrams(product)}
              onStep={(d) => setGrams((g) => stepQty(g, d, product))}
            />
            <p className="text-ink-muted mx-1 mt-2.5 mb-[22px] text-[13px]">
              You can select {product.stepGrams} g steps.
            </p>

            <OptionGroup label="Cleaning preference">
              {cleaningOptions.map((o) => (
                <OptionCard
                  key={o.id}
                  name="cleaning"
                  value={o.id}
                  title={o.label}
                  checked={cleaningId === o.id}
                  onSelect={setCleaningId}
                />
              ))}
            </OptionGroup>
            {cleaning?.requiresNote && (
              <label className="mt-3 block">
                <span className="mb-2 block text-[13px] font-semibold">Describe your cut</span>
                <textarea
                  value={customNote}
                  onChange={(e) => setCustomNote(e.target.value.slice(0, 200))}
                  placeholder="e.g. Steaks about 1 inch thick, keep the head"
                  aria-invalid={needsNote}
                  className="border-line-strong bg-card text-ink placeholder:text-ink-muted min-h-20 w-full resize-none rounded-2xl border px-4 py-3.5 text-sm"
                />
              </label>
            )}
          </>
        )}

        <div className="bg-ink text-cream mt-[22px] flex items-center gap-3.5 rounded-[18px] px-4 py-3.5">
          <Icon name="truck" size={28} className="text-gold" />
          <div>
            <b className="block text-[15px]">
              Today · {shopSettings.asapMinMinutes} – {shopSettings.asapMaxMinutes} mins
            </b>
            <span className="text-cream/80 block text-[13px]">Freshly cleaned and packed</span>
          </div>
        </div>
      </div>

      <StickyDock>
        <Button onClick={addToCart} disabled={soldOut || needsNote}>
          {soldOut
            ? 'Sold out today'
            : needsNote
              ? 'Describe your custom cut'
              : `Add to cart · ${formatMoney(total)}`}
        </Button>
      </StickyDock>
    </main>
  );
}
