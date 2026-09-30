'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { OptionCard, OptionGroup } from '@/components/ui/OptionCard';
import { addressInputSchema, formatAddress, type AddressInput } from '@/lib/address';
import { api, ClientApiError, fetcher } from '@/lib/client/api';
import type { ClientAddress } from '@/lib/client/data';

interface AddressSheetProps {
  open: boolean;
  onClose: () => void;
  addresses: ClientAddress[];
  selectedId: string | undefined;
  onSelect: (id: string) => void;
  /** Called after a new address is saved (to refresh the list). */
  onSaved: (address: ClientAddress) => void;
  startInForm?: boolean;
}

type FieldErrors = Partial<Record<keyof AddressInput, string>>;

// PLACEHOLDER defaults from the design's sample city.
const EMPTY: AddressInput = {
  label: 'Home',
  line1: '',
  area: '',
  landmark: '',
  city: 'Bhubaneswar',
  state: 'Odisha',
  pincode: '',
};

function Field({
  label,
  name,
  value,
  error,
  onChange,
  inputMode,
  autoComplete,
}: {
  label: string;
  name: keyof AddressInput;
  value: string;
  error?: string;
  onChange: (name: keyof AddressInput, value: string) => void;
  inputMode?: 'numeric' | 'text';
  autoComplete?: string;
}) {
  const id = `addr-${name}`;
  return (
    <div className="mb-3">
      <label htmlFor={id} className="mb-1.5 block text-[13px] font-semibold">
        {label}
      </label>
      <input
        id={id}
        name={name}
        value={value}
        inputMode={inputMode}
        autoComplete={autoComplete}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-err` : undefined}
        onChange={(e) => onChange(name, e.target.value)}
        className="border-line-strong bg-card aria-[invalid=true]:border-danger h-12 w-full rounded-2xl border px-4 text-[15px]"
      />
      {error && (
        <p id={`${id}-err`} className="text-danger mt-1 mb-0 text-[13px]">
          {error}
        </p>
      )}
    </div>
  );
}

interface PincodeCheck {
  serviceable: boolean;
  areaName: string | null;
}

export function AddressSheet({
  open,
  onClose,
  addresses,
  selectedId,
  onSelect,
  onSaved,
  startInForm = false,
}: AddressSheetProps) {
  const [mode, setMode] = useState<'list' | 'form'>(startInForm || addresses.length === 0 ? 'form' : 'list');
  const [form, setForm] = useState<AddressInput>(EMPTY);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const pinReady = /^[1-9]\d{5}$/.test(form.pincode);
  const { data: pin } = useSWR<PincodeCheck>(
    pinReady ? `/api/delivery/check?pincode=${form.pincode}` : null,
    fetcher,
  );

  const set = (name: keyof AddressInput, value: string) => {
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((e) => ({ ...e, [name]: undefined }));
  };

  async function save() {
    const parsed = addressInputSchema.safeParse(form);
    if (!parsed.success) {
      const next: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof AddressInput;
        next[key] ??= issue.message;
      }
      setErrors(next);
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      const { address } = await api<{ address: ClientAddress }>('/api/addresses', { body: parsed.data });
      onSaved(address);
      onSelect(address.id);
      setForm(EMPTY);
      setMode('list');
      onClose();
    } catch (e) {
      setSaveError(e instanceof ClientApiError ? e.message : 'Could not save the address.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={mode === 'list' ? 'Delivery address' : 'New address'}
      footer={
        mode === 'list' ? (
          <Button variant="outline" onClick={() => setMode('form')}>
            Add new address
          </Button>
        ) : (
          <div className="flex gap-2.5">
            {addresses.length > 0 && (
              <Button variant="outline" onClick={() => setMode('list')} className="flex-1">
                Back
              </Button>
            )}
            <Button onClick={() => void save()} disabled={saving} className="flex-[2]">
              {saving ? 'Saving…' : 'Save address'}
            </Button>
          </div>
        )
      }
    >
      {mode === 'list' ? (
        <OptionGroup label="Saved addresses" showLabel={false} columns={1} className="mt-3">
          {addresses.map((a) => (
            <OptionCard
              key={a.id}
              size="lg"
              name="address"
              value={a.id}
              checked={a.id === selectedId}
              onSelect={(id) => {
                onSelect(id);
                onClose();
              }}
              title={a.label}
              subtitle={
                <>
                  {formatAddress(a)}
                  {!a.serviceable && (
                    <span className="text-danger mt-0.5 block font-semibold">
                      We don&apos;t deliver here yet
                    </span>
                  )}
                </>
              }
            />
          ))}
        </OptionGroup>
      ) : (
        <form
          className="mt-3"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            void save();
          }}
        >
          <OptionGroup label="Save as" className="mb-4" columns={2}>
            {(['Home', 'Work', 'Other'] as const).map((l) => (
              <OptionCard
                key={l}
                name="label"
                value={l}
                title={l}
                checked={form.label === l}
                onSelect={(v) => set('label', v)}
              />
            ))}
          </OptionGroup>
          <Field
            label="House / flat, street"
            name="line1"
            value={form.line1}
            error={errors.line1}
            onChange={set}
            autoComplete="address-line1"
          />
          <Field
            label="Area (optional)"
            name="area"
            value={form.area ?? ''}
            onChange={set}
            autoComplete="address-level3"
          />
          <Field label="Landmark (optional)" name="landmark" value={form.landmark ?? ''} onChange={set} />
          <div className="grid grid-cols-2 gap-2.5">
            <Field
              label="City"
              name="city"
              value={form.city}
              error={errors.city}
              onChange={set}
              autoComplete="address-level2"
            />
            <Field
              label="Pincode"
              name="pincode"
              value={form.pincode}
              error={errors.pincode}
              onChange={(n, v) => set(n, v.replace(/\D/g, '').slice(0, 6))}
              inputMode="numeric"
              autoComplete="postal-code"
            />
          </div>
          {pinReady && pin?.serviceable === false && (
            <p
              role="alert"
              className="text-danger mt-0 mb-2 rounded-xl bg-[#FBEDE8] px-3 py-2.5 text-[13px] font-semibold"
            >
              Sorry, we don&apos;t deliver to {form.pincode} yet. You can save it, but checkout needs a
              serviceable pincode.
            </p>
          )}
          {pinReady && pin?.serviceable && (
            <p className="text-success mt-0 mb-2 text-[13px] font-semibold">
              Great – we deliver to {pin.areaName ?? form.pincode}.
            </p>
          )}
          {saveError && (
            <p role="alert" className="text-danger mt-0 mb-2 text-[13px] font-semibold">
              {saveError}
            </p>
          )}
          <button type="submit" hidden aria-hidden="true" tabIndex={-1} />
        </form>
      )}
    </BottomSheet>
  );
}
