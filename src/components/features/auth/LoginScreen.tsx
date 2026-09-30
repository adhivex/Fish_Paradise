'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { LoginForm } from './LoginForm';

/** Only same-site paths are allowed as a post-login destination (no open redirects). */
function safeNext(next: string | null): string {
  return next && next.startsWith('/') && !next.startsWith('//') ? next : '/account';
}

export function LoginScreen() {
  const router = useRouter();
  const next = safeNext(useSearchParams().get('next'));
  return (
    <main className="pb-10">
      <PageHeader title="Log in" backHref="/" backLabel="Back to home" />
      <Card className="mx-4 mt-2 p-5">
        <h2 className="mt-0 mb-1 font-serif text-xl font-semibold">Welcome to Fish Paradise</h2>
        <p className="text-ink-muted mt-0 mb-5 text-sm">
          Log in with your mobile number to place orders and track deliveries.
        </p>
        <LoginForm
          onDone={(user) => {
            router.replace(user.role === 'ADMIN' && next === '/account' ? '/admin' : next);
            router.refresh();
          }}
        />
      </Card>
    </main>
  );
}
