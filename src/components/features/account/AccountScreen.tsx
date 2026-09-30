'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Icon, type IconName } from '@/components/ui/Icon';
import { PageHeader } from '@/components/ui/PageHeader';
import { Skeleton } from '@/components/ui/Skeleton';
import { TextButton } from '@/components/ui/TextLink';
import { api, ClientApiError } from '@/lib/client/api';
import { useSession, type ClientUser } from '@/lib/client/session';
import { formatPhone } from '@/lib/phone';
import { useUiStore } from '@/lib/stores/ui';

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

function initials(user: ClientUser): string {
  if (!user.name) return user.phone.slice(-2);
  return user.name
    .split(/\s+/)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function ProfileSheet({ user, open, onClose }: { user: ClientUser; open: boolean; onClose: () => void }) {
  const { setUser } = useSession();
  const [name, setName] = useState(user.name ?? '');
  const [email, setEmail] = useState(user.email ?? '');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const input = 'border-line-strong bg-card h-12 w-full rounded-2xl border px-4 text-[15px]';

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res = await api<{ user: ClientUser }>('/api/me', { method: 'PATCH', body: { name, email } });
      await setUser(res.user);
      onClose();
    } catch (e) {
      setError(e instanceof ClientApiError ? e.message : 'Could not save.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="Your profile"
      footer={
        <Button onClick={() => void save()} disabled={saving || !name.trim()}>
          {saving ? 'Saving…' : 'Save'}
        </Button>
      }
    >
      <label className="mt-3 mb-3 block">
        <span className="mb-1.5 block text-[13px] font-semibold">Name</span>
        <input className={input} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
      </label>
      <label className="mb-3 block">
        <span className="mb-1.5 block text-[13px] font-semibold">Email (optional)</span>
        <input
          className={input}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />
      </label>
      <p className="text-ink-muted m-0 text-[13px]">Phone: {formatPhone(user.phone)}</p>
      {error && (
        <p role="alert" className="text-danger mt-2 mb-0 text-sm font-semibold">
          {error}
        </p>
      )}
    </BottomSheet>
  );
}

export function AccountScreen() {
  const router = useRouter();
  const { user, loading, setUser } = useSession();
  const showToast = useUiStore((s) => s.showToast);
  const [profileOpen, setProfileOpen] = useState(false);

  async function logOut() {
    await api('/api/auth/logout', { body: {} }).catch(() => {});
    await setUser(null);
    showToast('You have been logged out');
    router.refresh();
  }

  return (
    <main className="pb-[calc(96px+env(safe-area-inset-bottom))]">
      <PageHeader title="My account" backHref="/" backLabel="Back to home" />

      <Card className="mx-4 mt-2 flex items-center gap-3.5 p-3.5">
        {loading ? (
          <>
            <Skeleton className="size-14 rounded-full" />
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-40" />
            </div>
          </>
        ) : user ? (
          <>
            <span
              aria-hidden="true"
              className="bg-ink flex size-14 flex-none items-center justify-center rounded-full text-lg font-bold text-white"
            >
              {initials(user)}
            </span>
            <div className="min-w-0 flex-1">
              <b className="block truncate text-[17px]">{user.name ?? 'Add your name'}</b>
              <div className="text-ink-muted truncate text-[13px]">
                {user.email ?? formatPhone(user.phone)}
              </div>
            </div>
            <TextButton onClick={() => setProfileOpen(true)}>Edit</TextButton>
          </>
        ) : (
          <div className="flex w-full flex-col gap-3">
            <div>
              <b className="block text-[17px]">You&apos;re browsing as a guest</b>
              <span className="text-ink-muted text-[13px]">
                Log in with your phone number to see your orders.
              </span>
            </div>
            <ButtonLink href="/login?next=/account" size="md">
              Log in
            </ButtonLink>
          </div>
        )}
      </Card>

      {user?.role === 'ADMIN' && (
        <Card className="mx-4 mt-4 overflow-hidden">
          <Link href="/admin" className={row}>
            <Icon name="shop" className="text-gold-dark" />
            Shop admin
            <Icon name="chevronRight" className="text-radio ml-auto" />
          </Link>
        </Card>
      )}

      <Card className="mx-4 mt-4 overflow-hidden">
        <nav aria-label="Account">
          <ul className="m-0 list-none p-0">
            {LINKS.map((l) => (
              <li key={l.href} className="border-line-soft border-t first:border-t-0">
                <Link
                  href={l.href}
                  prefetch={l.href.startsWith('/account/') || l.href === '/orders' ? false : undefined}
                  className={row}
                >
                  <Icon name={l.icon} className="text-gold-dark" />
                  {l.label}
                  <Icon name="chevronRight" className="text-radio ml-auto" />
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </Card>

      {user && (
        <button
          type="button"
          onClick={() => void logOut()}
          className={`${row} text-danger mx-4 mt-3 w-[calc(100%-32px)] rounded-2xl`}
        >
          <Icon name="logout" />
          Log out
        </button>
      )}

      {user && (
        <ProfileSheet key={user.id} user={user} open={profileOpen} onClose={() => setProfileOpen(false)} />
      )}
    </main>
  );
}
