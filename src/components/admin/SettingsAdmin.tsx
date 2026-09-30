'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { InlineError } from '@/components/ui/InlineError';
import { Skeleton } from '@/components/ui/Skeleton';
import { api, ClientApiError, fetcher } from '@/lib/client/api';
import { cn } from '@/lib/cn';
import { useUiStore } from '@/lib/stores/ui';
import { Field, fromFormValue, toFormValue, type FieldDef, type FormValues } from './fields';

type Settings = Record<string, unknown> & { acceptingOrders: boolean };

const SECTIONS: Array<{ title: string; fields: FieldDef[] }> = [
  {
    title: 'Shop details',
    fields: [
      { name: 'shopName', label: 'Shop name', type: 'text' },
      {
        name: 'phone',
        label: 'Phone (shown as “Call shop”)',
        type: 'text',
        nullable: true,
        placeholder: '+91XXXXXXXXXX',
      },
      {
        name: 'whatsapp',
        label: 'WhatsApp (new-order alerts)',
        type: 'text',
        nullable: true,
        placeholder: '+91XXXXXXXXXX',
      },
      {
        name: 'fssaiNumber',
        label: 'FSSAI licence number',
        type: 'text',
        nullable: true,
        placeholder: '14 digits',
      },
      { name: 'gstin', label: 'GSTIN (optional)', type: 'text', nullable: true },
      { name: 'deliveryCity', label: 'City shown on Home', type: 'text', nullable: true },
    ],
  },
  {
    title: 'Hours & delivery',
    fields: [
      { name: 'opensAt', label: 'Opens', type: 'time' },
      { name: 'closesAt', label: 'Closes', type: 'time' },
      { name: 'asapMinMinutes', label: 'ASAP delivery from (minutes)', type: 'number' },
      { name: 'asapMaxMinutes', label: 'ASAP delivery up to (minutes)', type: 'number' },
    ],
  },
  {
    title: 'Orders & payments',
    fields: [
      { name: 'autoConfirmCod', label: 'Confirm cash-on-delivery orders automatically', type: 'boolean' },
      {
        name: 'unpaidCancelMinutes',
        label: 'Cancel unpaid online orders after (minutes)',
        type: 'number',
      },
      {
        name: 'priceBandsPaise',
        label: 'Shop price filter bands (₹ per kg)',
        type: 'bands',
        help: 'Comma separated, e.g. 300, 600 → Under ₹300 · ₹300–₹600 · Above ₹600',
      },
    ],
  },
];

const ALL_FIELDS = SECTIONS.flatMap((s) => s.fields);

function SettingsForm({ settings, onSaved }: { settings: Settings; onSaved: (s: Settings) => void }) {
  const showToast = useUiStore((s) => s.showToast);
  const [values, setValues] = useState<FormValues>(() =>
    Object.fromEntries(ALL_FIELDS.map((f) => [f.name, toFormValue(f, settings[f.name])])),
  );
  const [accepting, setAccepting] = useState(settings.acceptingOrders);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(overrides: Partial<{ acceptingOrders: boolean }> = {}) {
    setSaving(true);
    setError(null);
    try {
      const data: Record<string, unknown> = { acceptingOrders: overrides.acceptingOrders ?? accepting };
      for (const f of ALL_FIELDS) {
        const v = fromFormValue(f, values[f.name] ?? '');
        if (v !== undefined) data[f.name] = v;
      }
      const res = await api<{ settings: Settings }>('/api/admin/settings', { method: 'PATCH', body: data });
      onSaved(res.settings);
      showToast('Settings saved');
    } catch (e) {
      setError(e instanceof ClientApiError ? e.message : 'Could not save.');
      if (overrides.acceptingOrders !== undefined) setAccepting(!overrides.acceptingOrders);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <Card className={cn('mb-5 flex items-center gap-3 p-4', !accepting && 'border-danger')}>
        <div className="flex-1">
          <b className="block">{accepting ? 'Taking orders' : 'Orders paused'}</b>
          <span className="text-ink-muted text-sm">
            {accepting
              ? 'Customers can order now (ASAP only during opening hours).'
              : 'Customers can browse but cannot place orders.'}
          </span>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={accepting}
          aria-label="Accepting orders"
          disabled={saving}
          onClick={() => {
            const next = !accepting;
            setAccepting(next);
            void save({ acceptingOrders: next });
          }}
          className={cn(
            'relative h-9 w-16 flex-none rounded-full transition-colors',
            accepting ? 'bg-success' : 'bg-danger',
          )}
        >
          <span
            className={cn(
              'absolute top-1 size-7 rounded-full bg-white shadow transition-all',
              accepting ? 'left-8' : 'left-1',
            )}
          />
        </button>
      </Card>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void save();
        }}
      >
        {SECTIONS.map((section) => (
          <Card key={section.title} className="mb-4 p-4">
            <h2 className="mt-0 mb-3 font-serif text-lg font-semibold">{section.title}</h2>
            {section.fields.map((f) => (
              <Field
                key={f.name}
                def={f}
                value={values[f.name] ?? ''}
                onChange={(v) => setValues((s) => ({ ...s, [f.name]: v }))}
              />
            ))}
          </Card>
        ))}
        {error && <InlineError className="mb-3" message={error} />}
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving…' : 'Save settings'}
        </Button>
      </form>
    </div>
  );
}

export function SettingsAdmin() {
  const { data, error, isLoading, mutate } = useSWR<{ settings: Settings }>('/api/admin/settings', fetcher);
  return (
    <div>
      <h1 className="mt-0 mb-4 font-serif text-2xl font-semibold">Settings</h1>
      {isLoading && !data ? (
        <Skeleton className="h-96 w-full rounded-2xl" />
      ) : error || !data ? (
        <InlineError
          message={(error as Error | undefined)?.message ?? 'Could not load settings.'}
          onRetry={() => void mutate()}
        />
      ) : (
        <SettingsForm
          settings={data.settings}
          onSaved={(settings) => void mutate({ settings }, { revalidate: false })}
        />
      )}
    </div>
  );
}
