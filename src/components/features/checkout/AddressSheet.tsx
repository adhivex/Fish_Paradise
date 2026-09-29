'use client';

import { useState } from 'react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { OptionCard, OptionGroup } from '@/components/ui/OptionCard';
import { addressInputSchema, formatAddress, type AddressInput } from '@/lib/address';
import { findZone } from '@/lib/mock/catalogue';
import { useAccountStore } from '@/lib/stores/account';

interface AddressSheetProps {
  open: boolean;
  onClose: () => void;
  selectedId: string | undefined;
  onSelect: (id: string) => void;
  startInForm?: boolean;
}

type FieldErrors = Partial<Record<keyof AddressInput, string>>;

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

export function AddressSheet({
  open,
  onClose,
  selectedId,
  onSelect,
  startInForm = false,
}: AddressSheetProps) {
  const addresses = useAccountStore((s) => s.addresses);
  const addAddress = useAccountStore((s) => s.addAddress);
  const [mode, setMode] = useState<'list' | 'form'>(startInForm ? 'form' : 'list');
  const [form, setForm] = useState<AddressInput>(EMPTY);
  const [errors, setErrors] = useState<FieldErrors>({});

  const set = (name: keyof AddressInput, value: string) => {
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((e) => ({ ...e, [name]: undefined }));
  };

  function save() {
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
    const created = addAddress({
      ...parsed.data,
      area: parsed.data.area || undefined,
      landmark: parsed.data.landmark || undefined,
    });
    onSelect(created.id);
    setForm(EMPTY);
    setMode('list');
    onClose();
  }

  const pinServiceable = /^\d{6}$/.test(form.pincode) ? !!findZone(form.pincode) : null;

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
            <Button variant="outline" onClick={() => setMode('list')} className="flex-1">
              Back
            </Button>
            <Button onClick={save} className="flex-[2]">
              Save address
            </Button>
          </div>
        )
      }
    >
      {mode === 'list' ? (
        <OptionGroup label="Saved addresses" showLabel={false} columns={1} className="mt-3">
          {addresses.map((a) => {
            const serviceable = !!findZone(a.pincode);
            return (
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
                    {!serviceable && (
                      <span className="text-danger mt-0.5 block font-semibold">
                        We don&apos;t deliver here yet
                      </span>
                    )}
                  </>
                }
              />
            );
          })}
        </OptionGroup>
      ) : (
        <form
          className="mt-3"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            save();
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
          {pinServiceable === false && (
            <p
              role="alert"
              className="text-danger mt-0 mb-2 rounded-xl bg-[#FBEDE8] px-3 py-2.5 text-[13px] font-semibold"
            >
              Sorry, we don&apos;t deliver to {form.pincode} yet. You can save it, but checkout needs a
              serviceable pincode.
            </p>
          )}
          {pinServiceable === true && (
            <p className="text-success mt-0 mb-2 text-[13px] font-semibold">
              Great – we deliver to {form.pincode}.
            </p>
          )}
          <button type="submit" hidden aria-hidden="true" tabIndex={-1} />
        </form>
      )}
    </BottomSheet>
  );
}
