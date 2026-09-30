'use client';

import { useCallback, useState } from 'react';
import { AddressSheet } from '@/components/features/checkout/AddressSheet';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { PageHeader } from '@/components/ui/PageHeader';
import { LineSkeleton, LoadingRegion } from '@/components/ui/Skeleton';
import { formatAddress } from '@/lib/address';
import { findZone } from '@/lib/mock/checkout';
import { useAccountStore } from '@/lib/stores/account';
import { useOrdersStore } from '@/lib/stores/orders';
import { useHydrated } from '@/lib/stores/ui';

export function AddressesScreen() {
  const hydrated = useHydrated();
  const addresses = useAccountStore((s) => s.addresses);
  const setDraft = useOrdersStore((s) => s.setDraft);
  const [sheet, setSheet] = useState({ open: false, n: 0 });
  const close = useCallback(() => setSheet((s) => ({ ...s, open: false })), []);

  return (
    <main className="pb-10">
      <PageHeader title="Saved addresses" backHref="/account" backLabel="Back to account" />
      {!hydrated ? (
        <LoadingRegion label="Loading addresses">
          <Card className="mx-4 mt-2">
            <LineSkeleton />
          </Card>
        </LoadingRegion>
      ) : (
        <ul className="m-0 list-none p-0">
          {addresses.map((a) => (
            <li key={a.id}>
              <Card className="mx-4 mt-3 flex items-start gap-3 p-4">
                <Icon name={a.label === 'Home' ? 'home' : 'pin'} className="mt-0.5" />
                <div>
                  <b>
                    {a.label}
                    {a.isDefault && (
                      <span className="text-gold-dark ml-2 text-xs font-semibold">Default</span>
                    )}
                  </b>
                  <div className="text-ink-muted mt-0.5 text-[13px] leading-[1.45]">{formatAddress(a)}</div>
                  {!findZone(a.pincode) && (
                    <div className="text-danger mt-1 text-[13px] font-semibold">
                      Outside our delivery area
                    </div>
                  )}
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
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
        selectedId={undefined}
        onSelect={(id) => setDraft({ addressId: id })}
      />
    </main>
  );
}
