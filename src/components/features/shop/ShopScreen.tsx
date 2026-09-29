'use client';

import { useCallback, useMemo, useState } from 'react';
import { CartButton } from '@/components/features/CartButton';
import { ProductRow } from '@/components/features/ProductCards';
import { Badge } from '@/components/ui/Card';
import { Chip, ChipRow } from '@/components/ui/Chip';
import { EmptyState } from '@/components/ui/EmptyState';
import { Icon } from '@/components/ui/Icon';
import { PageHeader } from '@/components/ui/PageHeader';
import { SearchInput } from '@/components/ui/SearchInput';
import { activeFilterCount, buildPriceBands, filterProducts, type ProductFilter } from '@/lib/filters';
import { categories, products, shopSettings } from '@/lib/mock/catalogue';
import { FilterSheet } from './FilterSheet';

const TABS = [{ slug: 'all', name: 'All' }, ...categories];

export function ShopScreen({
  initialCategory,
  initialQuery,
}: {
  initialCategory: string;
  initialQuery: string;
}) {
  const [filter, setFilter] = useState<ProductFilter>({
    category: initialCategory,
    query: initialQuery,
    sort: 'rec',
    priceBand: 'any',
  });
  const [sheetOpen, setSheetOpen] = useState(false);

  const bands = useMemo(() => buildPriceBands(shopSettings.priceBandsPaise), []);
  const list = useMemo(() => filterProducts(products, filter, bands), [filter, bands]);
  const active = activeFilterCount(filter);

  const update = useCallback((patch: Partial<ProductFilter>) => {
    setFilter((f) => {
      const next = { ...f, ...patch };
      // Keep category and search in the URL so refresh / share / back keep the view.
      const params = new URLSearchParams();
      if (next.category !== 'all') params.set('category', next.category);
      if (next.query) params.set('q', next.query);
      const qs = params.toString();
      window.history.replaceState(null, '', qs ? `/shop?${qs}` : '/shop');
      return next;
    });
  }, []);

  const closeSheet = useCallback(() => setSheetOpen(false), []);

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
          value={filter.query}
          onChange={(query) => update({ query })}
        />
        <ChipRow label="Categories">
          {TABS.map((t) => (
            <Chip
              key={t.slug}
              selected={filter.category === t.slug}
              onClick={() => update({ category: t.slug })}
            >
              {t.name}
            </Chip>
          ))}
        </ChipRow>
      </div>

      <p className="sr-only" aria-live="polite">
        {list.length} {list.length === 1 ? 'item' : 'items'} shown
      </p>

      {list.length > 0 ? (
        <ul className="m-0 list-none p-0">
          {list.map((p) => (
            <ProductRow key={p.id} product={p} />
          ))}
        </ul>
      ) : (
        <EmptyState title="Nothing found" body="Try a different name or pick another category." />
      )}

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
        filter={filter}
        bands={bands}
        resultCount={list.length}
        onChange={update}
        onReset={() => update({ sort: 'rec', priceBand: 'any', category: 'all' })}
      />
    </main>
  );
}
