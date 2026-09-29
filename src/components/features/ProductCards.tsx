'use client';

import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import { ProductImage } from '@/components/ui/ProductImage';
import { cn } from '@/lib/cn';
import { useQuickAdd } from '@/lib/hooks';
import { formatPricePerKg } from '@/lib/money';
import type { ProductDTO } from '@/lib/types';

function AddButton({ product, className }: { product: ProductDTO; className?: string }) {
  const quickAdd = useQuickAdd();
  const soldOut = !product.todayAvailable;
  return (
    <button
      type="button"
      aria-label={soldOut ? `${product.name} is sold out today` : `Add ${product.name} to cart`}
      disabled={soldOut}
      onClick={() => quickAdd(product)}
      className={cn(
        'bg-ink text-gold flex size-11 flex-none items-center justify-center rounded-full transition-transform duration-150 active:scale-95',
        'disabled:bg-line-strong disabled:text-ink-muted',
        className,
      )}
    >
      <Icon name="plus" />
    </button>
  );
}

/** Card in the horizontal "Today's fresh catch" rail on Home. */
export function ProductCard({ product }: { product: ProductDTO }) {
  return (
    <li className="border-line bg-card shadow-card relative w-[164px] flex-none rounded-[22px] border p-2">
      <Link href={`/product/${product.slug}`} className="block rounded-2xl">
        <ProductImage
          slug={product.slug}
          categorySlug={product.categorySlug}
          className="h-[116px] w-full rounded-2xl"
        />
        <span className="mx-1.5 mt-3 mr-[52px] block font-serif text-[17px] font-semibold tracking-[-0.2px]">
          {product.name}
        </span>
        <span className="text-ink-muted mx-1.5 mt-0.5 mr-[52px] mb-1.5 block text-[13px] font-medium">
          {product.todayAvailable ? formatPricePerKg(product.pricePerKgPaise) : 'Sold out today'}
        </span>
      </Link>
      <AddButton product={product} className="absolute right-2.5 bottom-2.5" />
    </li>
  );
}

/** Row in the Shop list. */
export function ProductRow({ product }: { product: ProductDTO }) {
  const soldOut = !product.todayAvailable;
  return (
    <li className="border-line bg-card mx-4 mb-3 flex items-center gap-2 rounded-[22px] border py-2.5 pr-3.5 pl-2.5 shadow-[0_14px_30px_-22px_rgba(10,42,47,0.4)]">
      <Link
        href={`/product/${product.slug}`}
        className="flex min-w-0 flex-1 items-center gap-3.5 rounded-[18px]"
      >
        <ProductImage
          slug={product.slug}
          categorySlug={product.categorySlug}
          className={cn('size-[76px] rounded-[18px]', soldOut && 'opacity-50 grayscale')}
        />
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="truncate font-serif text-lg font-semibold tracking-[-0.2px]">{product.name}</span>
          <span className="text-[15px] font-semibold">{formatPricePerKg(product.pricePerKgPaise)}</span>
          <span className={cn('text-[13px]', soldOut ? 'text-danger font-semibold' : 'text-ink-muted')}>
            {soldOut ? 'Sold out today' : product.note}
          </span>
        </span>
      </Link>
      <AddButton product={product} />
    </li>
  );
}
