'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { cn } from '@/lib/cn';
import { useUiStore } from '@/lib/stores/ui';
import { hasBottomNav } from '@/components/features/BottomNav';
import { Icon } from './Icon';

/** Ink toast with an optional "View cart" action. Moves up on Shop to clear the Filter button. */
export function Toast() {
  const toast = useUiStore((s) => s.toast);
  const hide = useUiStore((s) => s.hideToast);
  const pathname = usePathname();

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(hide, 2600);
    return () => clearTimeout(t);
  }, [toast, hide]);

  useEffect(() => hide(), [pathname, hide]);

  const bottom =
    pathname === '/shop'
      ? 'bottom-[calc(150px+env(safe-area-inset-bottom))]'
      : hasBottomNav(pathname)
        ? 'bottom-[calc(96px+env(safe-area-inset-bottom))]'
        : 'bottom-[calc(24px+env(safe-area-inset-bottom))]';

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn('pointer-events-none fixed inset-x-0 z-40 mx-auto max-w-[480px] px-4', bottom)}
    >
      {toast && (
        <div
          key={toast.id}
          className="animate-toast-in bg-ink text-cream shadow-toast pointer-events-auto flex min-h-14 items-center gap-2.5 rounded-2xl py-1.5 pr-1.5 pl-4 text-sm font-semibold"
        >
          <Icon name="check" className="text-gold" />
          <span className="min-w-0 flex-1">{toast.message}</span>
          {toast.action === 'cart' && (
            <Link
              href="/cart"
              className="bg-gold text-ink flex h-11 items-center rounded-xl px-4 text-sm font-bold"
            >
              View cart
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
