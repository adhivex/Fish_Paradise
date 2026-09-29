'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Icon, type IconName } from '@/components/ui/Icon';
import { PageHeader } from '@/components/ui/PageHeader';
import { Skeleton } from '@/components/ui/Skeleton';
import { useAccountStore } from '@/lib/stores/account';
import { useHydrated, useUiStore } from '@/lib/stores/ui';

const LINKS: ReadonlyArray<{ href: string; label: string; icon: IconName }> = [
  { href: '/orders', label: 'My orders', icon: 'receipt' },
  { href: '/account/addresses', label: 'Saved addresses', icon: 'pin' },
  { href: '/account/favourites', label: 'Favourites', icon: 'heart' },
  { href: '/offers', label: 'Offers & rewards', icon: 'tag' },
  { href: '/help', label: 'Help & support', icon: 'help' },
  { href: '/about', label: 'About Fish Paradise', icon: 'info' },
];

const row =
  'flex min-h-[58px] w-full items-center gap-4 px-[18px] text-left text-[15px] font-semibold hover:bg-gold-soft/40';

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function AccountScreen() {
  const hydrated = useHydrated();
  const customer = useAccountStore((s) => s.customer);
  const logIn = useAccountStore((s) => s.logIn);
  const logOut = useAccountStore((s) => s.logOut);
  const showToast = useUiStore((s) => s.showToast);

  return (
    <main className="pb-[calc(96px+env(safe-area-inset-bottom))]">
      <PageHeader title="My account" backHref="/" backLabel="Back to home" />

      <Card className="mx-4 mt-2 flex items-center gap-3.5 p-3.5">
        {!hydrated ? (
          <>
            <Skeleton className="size-14 rounded-full" />
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-40" />
            </div>
          </>
        ) : customer ? (
          <>
            <span
              aria-hidden="true"
              className="bg-ink flex size-14 flex-none items-center justify-center rounded-full text-lg font-bold text-white"
            >
              {initials(customer.name)}
            </span>
            <div className="min-w-0">
              <b className="block truncate text-[17px]">{customer.name}</b>
              <div className="text-ink-muted truncate text-[13px]">{customer.email}</div>
            </div>
          </>
        ) : (
          <div className="flex w-full flex-col gap-3">
            <div>
              <b className="block text-[17px]">You&apos;re browsing as a guest</b>
              <span className="text-ink-muted text-[13px]">
                Log in with your phone number to see your orders.
              </span>
            </div>
            {/* MOCK: phone + OTP login arrives in Phase 3. */}
            <Button size="md" onClick={logIn}>
              Log in
            </Button>
          </div>
        )}
      </Card>

      <Card className="mx-4 mt-4 overflow-hidden">
        <nav aria-label="Account">
          <ul className="m-0 list-none p-0">
            {LINKS.map((l) => (
              <li key={l.href} className="border-line-soft border-t first:border-t-0">
                <Link href={l.href} className={row}>
                  <Icon name={l.icon} className="text-gold-dark" />
                  {l.label}
                  <Icon name="chevronRight" className="text-radio ml-auto" />
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </Card>

      {hydrated && customer && (
        <button
          type="button"
          onClick={() => {
            logOut();
            showToast('You have been logged out');
          }}
          className={`${row} text-danger mx-4 mt-3 w-[calc(100%-32px)] rounded-2xl`}
        >
          <Icon name="logout" />
          Log out
        </button>
      )}
    </main>
  );
}
