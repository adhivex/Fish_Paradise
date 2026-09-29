'use client';

import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { OptionCard, OptionGroup } from '@/components/ui/OptionCard';
import { TextButton } from '@/components/ui/TextLink';
import { SORT_OPTIONS, type PriceBand, type ProductFilter, type SortKey } from '@/lib/filters';
import { categories } from '@/lib/mock/catalogue';

interface FilterSheetProps {
  open: boolean;
  onClose: () => void;
  filter: ProductFilter;
  bands: PriceBand[];
  resultCount: number;
  onChange: (patch: Partial<ProductFilter>) => void;
  onReset: () => void;
}

const CATEGORY_OPTIONS = [{ slug: 'all', name: 'All' }, ...categories];

export function FilterSheet({
  open,
  onClose,
  filter,
  bands,
  resultCount,
  onChange,
  onReset,
}: FilterSheetProps) {
  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="Filters"
      headerAction={<TextButton onClick={onReset}>Reset</TextButton>}
      footer={
        <Button onClick={onClose}>
          Show {resultCount} {resultCount === 1 ? 'item' : 'items'}
        </Button>
      }
    >
      <OptionGroup label="Sort by" className="mt-[18px]">
        {SORT_OPTIONS.map((o) => (
          <OptionCard
            key={o.value}
            name="sort"
            value={o.value}
            title={o.label}
            checked={filter.sort === o.value}
            onSelect={(v) => onChange({ sort: v as SortKey })}
          />
        ))}
      </OptionGroup>
      <OptionGroup label="Price per kg" className="mt-[18px]">
        {bands.map((b) => (
          <OptionCard
            key={b.id}
            name="price"
            value={b.id}
            title={b.label}
            checked={filter.priceBand === b.id}
            onSelect={(v) => onChange({ priceBand: v })}
          />
        ))}
      </OptionGroup>
      <OptionGroup label="Category" className="mt-[18px]">
        {CATEGORY_OPTIONS.map((c) => (
          <OptionCard
            key={c.slug}
            name="category"
            value={c.slug}
            title={c.name}
            checked={filter.category === c.slug}
            onSelect={(v) => onChange({ category: v })}
          />
        ))}
      </OptionGroup>
    </BottomSheet>
  );
}
