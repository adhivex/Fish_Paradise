'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/cn';
import { Icon, type IconName } from '@/components/ui/Icon';

const ITEMS: ReadonlyArray<{ href: string; label: string; icon: IconName }> = [
  { href: '/', label: 'Home', icon: 'home' },
  { href: '/shop', label: 'Shop', icon: 'shop' },
  { href: '/orders', label: 'Orders', icon: 'receipt' },
  { href: '/account', label: 'Account', icon: 'user' },
];

/** The bottom nav only shows on the four top-level tabs, as in the design. */
export function hasBottomNav(pathname: string): boolean {
  return ITEMS.some((i) => i.href === pathname);
}

export function BottomNav() {
  const pathname = usePathname();
  if (!hasBottomNav(pathname)) return null;
  return (
    <nav
      aria-label="Main"
      className="border-line bg-card fixed inset-x-0 bottom-0 z-30 mx-auto flex max-w-[480px] border-t px-2 pt-1.5 pb-[calc(14px+env(safe-area-inset-bottom))]"
    >
      {ITEMS.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex min-h-[54px] flex-1 flex-col items-center justify-center gap-0.5 text-xs font-semibold tracking-[0.02em]',
              active ? 'text-ink' : 'text-ink-soft hover:text-ink',
            )}
          >
            <Icon name={item.icon} className={active ? 'text-gold-dark' : undefined} />
            {item.label}
            <span
              aria-hidden="true"
              className={cn('mt-px size-1 rounded-full', active ? 'bg-gold' : 'bg-transparent')}
            />
          </Link>
        );
      })}
    </nav>
  );
}
