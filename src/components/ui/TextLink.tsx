import Link from 'next/link';
import type { ButtonHTMLAttributes, ComponentProps } from 'react';
import { cn } from '@/lib/cn';
import { Icon } from './Icon';

const base =
  'inline-flex h-11 items-center gap-0.5 border-0 bg-transparent px-1 text-sm font-bold tracking-[0.02em] text-gold-dark hover:underline underline-offset-4';

/** Gold text link ("View all", "Change", "Reset"), 44px tall for touch. */
export function TextLink({
  className,
  children,
  chevron,
  ...rest
}: ComponentProps<typeof Link> & { chevron?: boolean }) {
  return (
    <Link className={cn(base, className)} {...rest}>
      {children}
      {chevron && <Icon name="chevronRight" size={16} />}
    </Link>
  );
}

export function TextButton({
  className,
  children,
  type = 'button',
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type={type} className={cn(base, className)} {...rest}>
      {children}
    </button>
  );
}
