import { ProductImage } from '@/components/ui/ProductImage';
import { cn } from '@/lib/cn';
import { formatMoney } from '@/lib/money';
import { formatQty } from '@/lib/qty';

interface SummaryLine {
  key: string;
  slug: string;
  categorySlug?: string;
  imageUrl?: string | null;
  name: string;
  qtyGrams: number;
  cleaningLabel: string;
  lineTotalPaise: number;
}

/** Compact order lines: tile, name, "1 kg (Whole cleaned)", line total. */
export function SummaryLines({
  lines,
  tile = 'md',
  divided = false,
}: {
  lines: SummaryLine[];
  tile?: 'sm' | 'md';
  divided?: boolean;
}) {
  return (
    <ul className="m-0 list-none p-0">
      {lines.map((l) => (
        <li
          key={l.key}
          className={cn(
            'flex items-center gap-3',
            divided ? 'border-line-soft border-t px-4 py-3.5 first:border-t-0' : 'py-1.5',
            divided && 'gap-3.5',
          )}
        >
          <ProductImage
            slug={l.slug}
            categorySlug={l.categorySlug}
            imageUrl={l.imageUrl}
            sizes="56px"
            className={tile === 'sm' ? 'size-11 rounded-xl' : 'size-14 rounded-[14px]'}
          />
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <b className="truncate">{l.name}</b>
            <span className="text-ink-muted text-[13px]">
              {formatQty(l.qtyGrams)} ({l.cleaningLabel})
            </span>
          </div>
          <b>{formatMoney(l.lineTotalPaise)}</b>
        </li>
      ))}
    </ul>
  );
}
