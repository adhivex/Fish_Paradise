'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useOptimistic, useRef, useState, useTransition } from 'react';
import { CartButton } from '@/components/features/CartButton';
import { ProductRow } from '@/components/features/ProductCards';
import { Badge } from '@/components/ui/Card';
import { Chip, ChipRow } from '@/components/ui/Chip';
import { EmptyState } from '@/components/ui/EmptyState';
import { Icon } from '@/components/ui/Icon';
import { PageHeader } from '@/components/ui/PageHeader';
import { SearchInput } from '@/components/ui/SearchInput';
import { cn } from '@/lib/cn';
import { activeFilterCount, filterToHref, type PriceBand, type ProductFilter } from '@/lib/filters';
import type { CategoryDTO, ProductDTO } from '@/lib/types';
import { FilterSheet } from './FilterSheet';

const SEARCH_DEBOUNCE_MS = 300;

interface ShopScreenProps {
  /** Filter the server applied (from the URL). */
  filter: ProductFilter;
  products: ProductDTO[];
  priceBands: PriceBand[];
  categories: CategoryDTO[];
}

/**
 * The URL is the source of truth: every change navigates to a new `/shop?…` URL and the server
 * returns the filtered list. `useOptimistic` keeps chips and options responsive meanwhile.
 */
export function ShopScreen({ filter, products, priceBands, categories }: ShopScreenProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [optimistic, setOptimistic] = useOptimistic(filter);
  const [sheetOpen, setSheetOpen] = useState(false);

  // Search text is local while typing and follows the URL when it changes elsewhere.
  const [text, setText] = useState(filter.query);
  const [urlQuery, setUrlQuery] = useState(filter.query);
  if (filter.query !== urlQuery) {
    setUrlQuery(filter.query);
    if (filter.query !== text.trim()) setText(filter.query);
  }

  const update = useCallback(
    (patch: Partial<ProductFilter>) => {
      const next = { ...optimistic, ...patch };
      startTransition(() => {
        setOptimistic(next);
        router.replace(filterToHref(next), { scroll: false });
      });
    },
    [optimistic, router, setOptimistic],
  );

  const debounce = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(debounce.current), []);
  const onSearch = (value: string) => {
    setText(value);
    clearTimeout(debounce.current);
    debounce.current = setTimeout(() => update({ query: value }), SEARCH_DEBOUNCE_MS);
  };

  const closeSheet = useCallback(() => setSheetOpen(false), []);
  const active = activeFilterCount(optimistic);
  const tabs = [{ slug: 'all', name: 'All' }, ...categories];

  return (
    <main className="pb-[calc(160px+env(safe-area-inset-bottom))]">
      <div className="bg-cream sticky top-0 z-20">
        <PageHeader
          title="Shop seafood"
          backHref="/"
          backLabel="Back to home"
          sticky={false}
          actions={<CartButton />}
        />
        <SearchInput
          label="Search seafood"
          placeholder="Search fish, prawns, crab"
          value={text}
          onChange={onSearch}
        />
        <ChipRow label="Categories">
          {tabs.map((t) => (
            <Chip
              key={t.slug}
              selected={optimistic.category === t.slug}
              onClick={() => update({ category: t.slug })}
            >
              {t.name}
            </Chip>
          ))}
        </ChipRow>
      </div>

      <p className="sr-only" aria-live="polite">
        {pending
          ? 'Updating results'
          : `${products.length} ${products.length === 1 ? 'item' : 'items'} shown`}
      </p>

      <div aria-busy={pending} className={cn('transition-opacity duration-150', pending && 'opacity-60')}>
        {products.length > 0 ? (
          <ul className="m-0 list-none p-0">
            {products.map((p) => (
              <ProductRow key={p.id} product={p} />
            ))}
          </ul>
        ) : (
          <EmptyState title="Nothing found" body="Try a different name or pick another category." />
        )}
      </div>

      <button
        type="button"
        onClick={() => setSheetOpen(true)}
        aria-haspopup="dialog"
        aria-label={active > 0 ? `Open filters, ${active} active` : 'Open filters'}
        className="bg-ink text-cream shadow-float fixed right-[max(16px,calc(50vw-240px+16px))] bottom-[calc(86px+env(safe-area-inset-bottom))] z-[25] flex h-[52px] items-center gap-2.5 rounded-full pr-5 pl-4 text-sm font-semibold tracking-[0.02em]"
      >
        <Icon name="filter" className="text-gold" />
        Filter
        <Badge count={active} className="h-5 min-w-5 text-xs" />
      </button>

      <FilterSheet
        open={sheetOpen}
        onClose={closeSheet}
        filter={optimistic}
        bands={priceBands}
        categories={categories}
        resultCount={pending ? null : products.length}
        onChange={update}
        onReset={() => update({ sort: 'rec', priceBand: 'any', category: 'all' })}
      />
    </main>
  );
}
