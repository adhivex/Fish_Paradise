'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';

export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="bg-cream mx-auto min-h-dvh max-w-[480px] pt-10 pb-10" role="alert">
      <EmptyState
        icon="alert"
        title="Something went wrong"
        body="We couldn't load this page. Check your connection and try again."
        action={
          <Button onClick={reset} block={false} className="w-[220px]">
            Try again
          </Button>
        }
      />
    </main>
  );
}
