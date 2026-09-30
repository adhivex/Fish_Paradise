'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/cn';

const LINKS = [
  { href: '/admin', label: 'Orders' },
  { href: '/admin/catalogue', label: "Today's catalogue" },
  { href: '/admin/products', label: 'Products' },
  { href: '/admin/delivery', label: 'Delivery' },
  { href: '/admin/coupons', label: 'Coupons' },
  { href: '/admin/settings', label: 'Settings' },
];

export function AdminNav({ name }: { name: string }) {
  const pathname = usePathname();
  const active = (href: string) =>
    href === '/admin'
      ? pathname === '/admin' || pathname.startsWith('/admin/orders')
      : pathname.startsWith(href);
  return (
    <header className="bg-ink text-cream sticky top-0 z-30">
      <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 pt-3 pb-2">
        <Link href="/admin" className="font-serif text-lg font-semibold">
          Fish Paradise <span className="text-gold font-sans text-sm font-semibold">Admin</span>
        </Link>
        <span className="text-cream/70 ml-auto truncate text-xs">{name}</span>
        <Link href="/" className="text-gold text-xs font-semibold underline-offset-4 hover:underline">
          View shop
        </Link>
      </div>
      <nav
        aria-label="Admin"
        className="mx-auto flex max-w-3xl scrollbar-none gap-1 overflow-x-auto px-2 pb-2"
      >
        {LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active(l.href) ? 'page' : undefined}
            className={cn(
              'flex h-10 flex-none items-center rounded-full px-4 text-sm font-semibold',
              active(l.href) ? 'bg-gold text-ink' : 'text-cream/85 hover:bg-white/10',
            )}
          >
            {l.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
