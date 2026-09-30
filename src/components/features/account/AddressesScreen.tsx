'use client';

import { useCallback, useState } from 'react';
import { AddressSheet } from '@/components/features/checkout/AddressSheet';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Icon } from '@/components/ui/Icon';
import { InlineError } from '@/components/ui/InlineError';
import { PageHeader } from '@/components/ui/PageHeader';
import { LineSkeleton, LoadingRegion } from '@/components/ui/Skeleton';
import { TextButton } from '@/components/ui/TextLink';
import { formatAddress } from '@/lib/address';
import { api, ClientApiError } from '@/lib/client/api';
import { useAddresses } from '@/lib/client/data';
import { useCheckoutStore } from '@/lib/stores/checkout';

export function AddressesScreen() {
  const { addresses, loading, error, mutate } = useAddresses();
  const setAddress = useCheckoutStore((s) => s.setAddress);
  const [sheet, setSheet] = useState({ open: false, n: 0 });
  const [actionError, setActionError] = useState<string | null>(null);
  const close = useCallback(() => setSheet((s) => ({ ...s, open: false })), []);

  async function act(url: string, method: 'PATCH' | 'DELETE', body?: unknown) {
    setActionError(null);
    try {
      await api(url, { method, body: body ?? {} });
      await mutate();
    } catch (e) {
      setActionError(e instanceof ClientApiError ? e.message : 'Something went wrong.');
    }
  }

  return (
    <main className="pb-10">
      <PageHeader title="Saved addresses" backHref="/account" backLabel="Back to account" />
      {loading ? (
        <LoadingRegion label="Loading addresses">
          <Card className="mx-4 mt-2">
            <LineSkeleton />
          </Card>
        </LoadingRegion>
      ) : error ? (
        <InlineError className="mx-4 mt-2" message={error.message} onRetry={() => void mutate()} />
      ) : addresses.length === 0 ? (
        <EmptyState icon="pin" title="No saved addresses" body="Add one now to check out faster." />
      ) : (
        <ul className="m-0 list-none p-0">
          {addresses.map((a) => (
            <li key={a.id}>
              <Card className="mx-4 mt-3 flex items-start gap-3 p-4">
                <Icon name={a.label === 'Home' ? 'home' : 'pin'} className="mt-0.5" />
                <div className="min-w-0 flex-1">
                  <b>
                    {a.label}
                    {a.isDefault && (
                      <span className="text-gold-dark ml-2 text-xs font-semibold">Default</span>
                    )}
                  </b>
                  <div className="text-ink-muted mt-0.5 text-[13px] leading-[1.45]">{formatAddress(a)}</div>
                  {!a.serviceable && (
                    <div className="text-danger mt-1 text-[13px] font-semibold">
                      Outside our delivery area
                    </div>
                  )}
                  <div className="-ml-1 flex gap-2">
                    {!a.isDefault && (
                      <TextButton
                        onClick={() => void act(`/api/addresses/${a.id}`, 'PATCH', { isDefault: true })}
                      >
                        Make default
                      </TextButton>
                    )}
                    <TextButton
                      className="text-danger"
                      aria-label={`Delete ${a.label} address`}
                      onClick={() => void act(`/api/addresses/${a.id}`, 'DELETE')}
                    >
                      Delete
                    </TextButton>
                  </div>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
      {actionError && <InlineError className="mx-4 mt-3" message={actionError} />}
      <div className="mx-4 mt-5">
        <Button variant="outline" onClick={() => setSheet((s) => ({ open: true, n: s.n + 1 }))}>
          <Icon name="plus" />
          Add new address
        </Button>
      </div>
      <AddressSheet
        key={sheet.n}
        open={sheet.open}
        startInForm
        onClose={close}
        addresses={addresses}
        selectedId={undefined}
        onSelect={setAddress}
        onSaved={() => void mutate()}
      />
    </main>
  );
}
