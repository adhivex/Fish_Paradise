import type { Metadata } from 'next';
import { ButtonLink } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';

export const metadata: Metadata = { title: 'Offline', robots: { index: false } };

/** Shown by the service worker when a page is requested without a connection. */
export default function OfflinePage() {
  return (
    <main className="pt-10 pb-10">
      <EmptyState
        icon="alert"
        title="You're offline"
        body="Check your internet connection. Pages you have visited are still available."
        action={
          <ButtonLink href="/shop" block={false} className="w-[220px]">
            Browse the catch
          </ButtonLink>
        }
      />
    </main>
  );
}
