'use client';

import { Badge } from '@/components/ui/Card';
import { IconLink } from '@/components/ui/IconButton';
import { cn } from '@/lib/cn';
import { useCartCount } from '@/lib/hooks';

/** Header cart icon with the gold count badge. */
export function CartButton({ className }: { className?: string }) {
  const count = useCartCount();
  const label = count > 0 ? `Open cart, ${count} ${count === 1 ? 'item' : 'items'}` : 'Open cart';
  return (
    <IconLink href="/cart" icon="bag" label={label} className={cn('relative', className)}>
      <Badge count={count} className="absolute top-[3px] right-px" />
    </IconLink>
  );
}
